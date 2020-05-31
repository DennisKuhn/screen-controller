
import React, { useState } from 'react';

import { observer } from 'mobx-react-lite';

import {
    makeStyles,
    List,
    ListItem,
    ListItemIcon,
    Tooltip,
    ListItemSecondaryAction,
    IconButton,
    GridList,
    GridListTile
} from '@material-ui/core';

// @material-ui/icons
import Delete from '@material-ui/icons/Delete';
import Fullscreen from '@material-ui/icons/Fullscreen';
import FullscreenExit from '@material-ui/icons/FullscreenExit';
import Menu from '@material-ui/icons/Menu';
import MenuOpen from '@material-ui/icons/MenuOpen';

import Form from '@rjsf/material-ui';

import { Plugin } from '../../../Setup/Application/Plugin';
import { Rectangle } from '../../../Setup/Default/Rectangle';
import { ObservableSetupBaseMap } from '../../../Setup/Container';
import { Browser } from '../../../Setup/Application/Browser';
import { SetupBase } from '../../../Setup/SetupBase';

import RelativeRectangle from './RelativeRectangle';

import { JSONSchema7 } from 'json-schema';

import { UiSchema, ObjectFieldTemplateProps, FieldProps, ErrorSchema } from '@rjsf/core';
import SchemaField from '@rjsf/core/lib/components/fields/SchemaField';

const useStyles = makeStyles((/*theme*/) => ({
    coordField: {
        width: 60,
    },
    hiddenField: {
        display: 'none'
    }
}));

const PluginForm = observer(({ plugin }: { plugin: Plugin }): JSX.Element => {
    let isFullscreen = (plugin.relativeBounds.x == 0 && plugin.relativeBounds.y == 0 && plugin.relativeBounds.width == 1 && plugin.relativeBounds.height == 1);

    function toggleFullScreen(): void {
        isFullscreen = !isFullscreen;

        plugin.relativeBounds = Rectangle.createNew(
            plugin.id,
            isFullscreen ?
                { x: 0, y: 0, width: 1, height: 1 } :
                { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
        );
    }

    return (
        <>
            <Tooltip
                id={'tooltip-' + plugin.id + '-config'}
                title={isFullscreen ? 'Make part screen' : 'Make Full Screen'}
                placement="top"
                >
                <IconButton aria-label="Fullscreen" onClick={toggleFullScreen} >
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
            </Tooltip>
            <RelativeRectangle rect={plugin.relativeBounds} />
        </>
    );
});

const fixRefs = (item: JSONSchema7): JSONSchema7 => {

    if (item.$ref) {
        if (item.$ref.startsWith('#/definitions/')) {
            // console.log(`${module.id}.fixRefs: skip ${item.$id} = ${item.$ref}`);
        } else {
            // console.log(`${module.id}.fixRefs: ${item.$id} ${item.$ref} => ${'#/definitions/' + item.$ref}`);
            item.$ref = '#/definitions/' + item.$ref;
        }
    }
    for (const child of Object.values(item)) {
        if (child instanceof Object) {
            fixRefs(child);
        }
    }

    return item;
};

const HiddenFieldTemplate = (): JSX.Element => (<></>);

const replaceHidden = (item: UiSchema, classes: string): UiSchema => {

    if (item['ui:widget'] == 'hidden') {
        delete item['ui:widget'];
        item['ui:FieldTemplate'] = HiddenFieldTemplate;
    }

    // recurse
    for (const value of Object.values(item)) {
        (value instanceof Object) && replaceHidden(value, classes);
    }

    // console.log(`fixUiSchema: ${classes}`, { ...item });

    return item;
};

// const RectangleFieldTemplate = (props: FieldTemplateProps): JSX.Element => {
//     const { id, classNames, label, help, required, description, errors, children } = props;
//     return (
//         <div className={classNames}>
//             <label htmlFor={id}>ReCt:{label}{required ? '++' : null}</label>
//             {description}
//             {children}
//             {errors}
//             {help}
//         </div>
//     );
// };



interface FormContext {
    plugin: Plugin;
}

const moveToTarget = (start: SetupBase, properties: string[]): [SetupBase, string] => {
    let target = start;
    properties.shift();

    while (properties.length > 1) {
        target = target[properties.shift() as string];
    }
    return [target, properties[0]];
};

/**
 * 
 * @see https://github.com/rjsf-team/react-jsonschema-form/issues/651
 * @param props 
 */
const CustomField = (props: FieldProps): JSX.Element => {
    //Only process if we are dealing with a field, not the parent object
    if ('name' in props) {
        const formContext = props.registry.formContext as FormContext;

        // debugger;

        const originalOnChange = props.onChange;

        // console.log(`${module.id}.CustomField[${props.idSchema.$id}] props=`, props);

        const customProps = {
            onChange: (newValue, es?: ErrorSchema): void => {
                console.log(`${module.id}.CustomField[${props.idSchema.$id}][${props.name}] onChange=`, newValue, es);
                
                // do validation first
                originalOnChange(newValue, es);

                const [target, name] = moveToTarget(
                    formContext.plugin,
                    props.idSchema.$id.split('_') );

                if (newValue.id) {
                    if (newValue.id != target[name]?.id)
                        console.error(`${module.id}.CustomField[${props.idSchema?.$id}][${name}]: ${newValue.id} != ${target[name]?.id}`);
                    else
                        console.log(`${module.id}.CustomField[${props.idSchema?.$id}][${name}]: skip ${newValue.id} == ${target[name]?.id}`);
                } else {
                    console.log(`${module.id}.CustomField[${props.idSchema?.$id}][${name}]== ${target[name]} = ${newValue}`, target, newValue, { ...target });
                    target[name] = newValue;
                }
            }
        };
        return (
            <SchemaField {...props} {...customProps} />
        );
    }
    return (
        <SchemaField {...props} />
    );
};


const RectangleObjectTemplate = (props: ObjectFieldTemplateProps): JSX.Element => {
    const { idSchema, title, description, properties, formData: rect, formContext } = props;
    const {plugin} = formContext as FormContext;

    console.log(`${module.id}: RectangleObjectTemplate[${props.title}]`, {...props});

    let isFullscreen = (rect.x == 0 && rect.y == 0 && rect.width == 1 && rect.height == 1);

    function toggleFullScreen(): void {
        isFullscreen = !isFullscreen;

        const [target, property] = moveToTarget(plugin, idSchema.$id.split('_'));

        console.log(`${module.id}: RectangleObjectTemplate[${title}].toggleFullScreen ${target.id}.${property}=${isFullscreen}`, target, props );

        target[property] = Rectangle.createNew(
            target['id'],
            isFullscreen ?
                { x: 0, y: 0, width: 1, height: 1 } :
                { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
        );
    }

    return (
        <div>
            {title}
            {description}
            <Tooltip
                title={isFullscreen ? 'Make part screen' : 'Make Full Screen'}
            >
                <IconButton aria-label="Fullscreen" onClick={toggleFullScreen} >
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
            </Tooltip>
            <GridList cellHeight={'auto'} cols={4} >

                {
                    properties
                        .filter(({ content }: { content: { props } }) =>
                            (content.props.uiSchema == undefined)
                            || (content.props.uiSchema['ui:FieldTemplate'] != HiddenFieldTemplate))
                        .map(element => {
                            // console.log(`${module.id}: RectangleObjectTemplate[${title}] ${element.name}`, element, { ...element.content });
                            // return element.content;
                            return (
                                <GridListTile key={`Tile-${element.content.key}`}>
                                    {element.content}
                                </GridListTile>
                            );
                        })
                }
            </GridList>
        </div>
    );
};

const ObjectTemplate = (props: ObjectFieldTemplateProps): JSX.Element => {
    const { title, description, properties } = props;
    console.log(`${module.id}: ObjectTemplate[${props.title}]`);
    return (
        <div>
            {title}
            {description}
                {
                    properties
                        .filter(({ content }: { content: { props } }) =>
                            (content.props.uiSchema == undefined)
                            || (content.props.uiSchema['ui:FieldTemplate']?.name != HiddenFieldTemplate.name))
                        .map(element => {
                            // console.log(`${module.id}: ObjectTemplate[${title}] ${element.name}`, { ...element.content.props.uiSchema });
                            // return element.content;
                            return element.content;
                        })
                }
        </div>
    );
};

const addCustom = (item: UiSchema, schema: JSONSchema7, rootSchema: JSONSchema7): void => {

    if (!rootSchema.definitions)
        throw new Error('addCustom: rootSchema got no definitions');

    if (schema.$ref == '#/definitions/' + Rectangle.name) {

        if (item['ui:FieldTemplate']) {
            console.log('addCustom() [ui:FieldTemplate] already set');
        } else {
            console.log('addCustom() set [ui:ObjectFieldTemplate] = RectangleObjectTemplate');
            // item['ui:FieldTemplate'] = RectangleFieldTemplate;
            item['ui:ObjectFieldTemplate'] = RectangleObjectTemplate;
        }
    } else if (schema.$ref) {
        console.log(`addCustom() resolve ${schema.$ref} - ${schema.$ref.replace(/^#\/definitions\//, '')}`, rootSchema.definitions);
        addCustom(item, rootSchema.definitions[schema.$ref.replace(/^#\/definitions\//, '')] as JSONSchema7, rootSchema);
    } else if (schema.allOf) {
        for (const subSchema of schema.allOf)
            addCustom(item, subSchema as JSONSchema7, rootSchema);
    } else if (schema.properties) {
        for (const [property, value] of Object.entries(schema.properties)) {
            if (value instanceof Object) {
                item[property] = item[property] ?? {};
                addCustom(item[property], value, rootSchema);
            }
        }
    }
};

const fixUiSchema = (item: UiSchema, plugin: Plugin, classes: string): UiSchema => {

    replaceHidden(item, classes);

    addCustom(item, plugin.schema, plugin.schema);

    // console.log(`fixUiSchema: ${classes}`, { ...item });
    return item;
};

const PluginItem = observer(({ plugin }: { plugin: Plugin }): JSX.Element => {
    const [configVisible, setConfigVisible] = useState(false);
    const classes = useStyles();
    const formContext: FormContext = { plugin };

    const deletePlugin = (): boolean => (plugin.parent as Browser).plugins.delete(plugin.id);

    console.log(`${module.id}.PluginItem`);

    return (
        <ListItem>
            <List>
                <ListItem>
                    <ListItemIcon>
                        <Tooltip
                            id={'tooltip-' + plugin.id + '-config'}
                            title="Show config"
                            placement="top"
                        >
                            <IconButton
                                aria-label="Menu"
                                onClick={ (): void => setConfigVisible(!configVisible)}
                            >
                            {configVisible ? <MenuOpen /> : <Menu />}
                            </IconButton>
                        </Tooltip>
                    </ListItemIcon>
                    <PluginForm plugin={plugin} />
                    <ListItemSecondaryAction>
                        <Tooltip
                            id={'tooltip-' + plugin.id + '-delete'}
                            title="Remove"
                            placement="top"
                        >
                            <IconButton
                                aria-label="Delete"
                                onClick={deletePlugin}
                            >
                                <Delete />
                            </IconButton>
                        </Tooltip>
                    </ListItemSecondaryAction>
                </ListItem>
                {configVisible &&
                    <ListItem>
                        <Form
                            schema={fixRefs(plugin.schema)}
                            formData={plugin.getDeep()}
                            uiSchema={fixUiSchema(Plugin.uiSchema, plugin, classes.hiddenField)}
                            fields={{ SchemaField: CustomField }}
                            formContext={formContext}
                            ObjectFieldTemplate={ObjectTemplate}
                            children={' '}
                        />
                    </ListItem>
                }
            </List>
        </ListItem>
    );
});

const PluginsList = observer(({ plugins }: { plugins: ObservableSetupBaseMap<Plugin> }): JSX.Element => {

    return (
        <List>
            {plugins.map(plugin => {
                if (plugin == null) throw new Error('PluginsList: a plugin is null');

                return (<PluginItem key={plugin.id} plugin={plugin} />);
            })}
        </List>
    );
});

export default PluginsList;