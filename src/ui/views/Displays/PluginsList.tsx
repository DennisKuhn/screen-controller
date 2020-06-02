
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

import Form, { UiSchema, ObjectFieldTemplateProps, ErrorSchema, FieldProps } from '@rjsf/core';
//import { UiSchema, ObjectFieldTemplateProps } from '@rjsf/core';
//import Form from '@rjsf/material-ui';
import SchemaField from '@rjsf/core/lib/components/fields/SchemaField';
import NumberField from '@rjsf/core/lib/components/fields/NumberField';

import { Plugin } from '../../../Setup/Application/Plugin';
import { Rectangle } from '../../../Setup/Default/Rectangle';
import { ObservableSetupBaseMap } from '../../../Setup/Container';
import { Browser } from '../../../Setup/Application/Browser';
import { SetupBase } from '../../../Setup/SetupBase';

import RelativeRectangle from './RelativeRectangle';

import { JSONSchema7 } from 'json-schema';
import Ajv from 'ajv';


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

/** Descends into object according to properties stack.
 * @example 
 * moveToTarget(
 *     {root: {child: { grandchild: {money: 5} }}},
 *     ['AnyName','root', 'child', 'grandchild', 'money' ] )
 * => [{money:5}, 'money']
 * moveToTarget(
 *     {root: {child: { grandchild: {money: 5} }}},
 *     ['AnyName','root' ] )
 * => [{root: {child: { grandchild: {money: 5} }}}, 'root']
 * @param start object
 * @param properties names stack
 * @returns target object with target property name, use like target[name]
 */
const moveToTarget = (start: SetupBase, properties: string[]): [SetupBase, string] => {
    let target = start;
    properties.shift();

    while (properties.length > 1) {
        target = target[properties.shift() as string];
    }
    return [target, properties[0]];
};

const ajv = new Ajv();

/**
 * 
 * @see https://github.com/rjsf-team/react-jsonschema-form/issues/651
 * @param props 
 */
const ObservedField = (props: FieldProps): JSX.Element => {
    //Only process if we are dealing with a field, not the parent object
    if ('name' in props) {
        const formContext = props.registry.formContext as FormContext;

        const originalOnChange = props.onChange;

        // console.log(`${module.id}.ObservedField[${props.idSchema.$id}] props=`, props);

        const validate = ajv.getSchema(props.idSchema.$id) ?? ajv.addSchema(props.schema, props.idSchema.$id).getSchema(props.idSchema.$id);

        if (!validate)
            throw new Error(`${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] can't create validate function from: ${JSON.stringify(props.schema)}`);

        // Split idSchema $id <RootPrefix>_<RootProperty>_<Childproperty>
        const [target, name] = moveToTarget(
            formContext.plugin,
            props.idSchema.$id.split('_'));

        const customProps = {
            ...props,
            onChange: (newValue, es?: ErrorSchema): void => {
                // console.log(`${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] onChange=`, newValue, props, es);

                originalOnChange(newValue, es);

                // console.log(`${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] onChange=`, newValue, props, es);

                if (newValue.id) {
                    if (newValue.id != target[name]?.id)
                        console.error(`${module.id}.ObservedField[${props.idSchema?.$id}][${name}].onChange: ${newValue.id} != ${target[name]?.id}`);
                    else
                        console.log(`${module.id}.ObservedField[${props.idSchema?.$id}][${name}].onChange: skip ${newValue.id} == ${target[name]?.id}`);
                } else {
                    if (validate(newValue)) {
                        console.log(`${module.id}.ObservedField[${props.idSchema?.$id}][${name}]== ${target[name]} = ${newValue}`);
                        target[name] = newValue;
                    } else {
                        console.warn(
                            `${module.id}.ObservedField[${props.idSchema?.$id}][${name}]== ${target[name]} = -> ${newValue} <- :` +
                            ` ${validate.errors ? validate.errors.map(error => `${error.dataPath}:${error.message}`) : ''}`,
                            { ...validate.errors }, newValue);
                    }
                }
            }
        };
        return (
            <SchemaField {...customProps} />
        );
    }
    return (
        <SchemaField {...props} />
    );
};

/**
 * 
 * @param props 
 */
// const CustomField = (props: FieldProps): JSX.Element => {
//     //Only process if we are dealing with a field, not the parent object
//     if ('name' in props) {
//         const formContext = props.registry.formContext as FormContext;

//         const originalOnChange = props.onChange;

//         // console.log(`${module.id}.CustomField[${props.idSchema.$id}] props=`, props);

//         const customProps = {
//             onChange: (newValue, es?: ErrorSchema): void => {
//                 console.log(`${module.id}.CustomField[${props.idSchema.$id}][${props.name}] onChange=`, newValue, props, es);

//                 originalOnChange(newValue, es);

//             }
//         };
//         return (
//             <SchemaField {...props} {...customProps} />
//         );
//     }
//     return (
//         <SchemaField {...props} />
//     );
// };

/**
 * 
 * @param props 
 */
const PercentField = (props: FieldProps): JSX.Element => {

    const originalOnChange = props.onChange;

    // console.log(`${module.id}.PercentField[${props.idSchema.$id}] props=`, props);

    const customProps = {
        ...props,
        onChange: (newValue, es?: ErrorSchema): void => {
            // console.log(`${module.id}.PercentField[${props.idSchema.$id}][${props.name}] onChange=`, newValue, props, es);

            originalOnChange(Number(((newValue as number) / 100).toPrecision(10)), es);
        },
        formData: Number( ((props.formData as number) * 100).toPrecision(10)),
        schema: {
            ...props.schema,
            ...(typeof props.schema.default == 'number' ? { default: props.schema.default * 100 } : {}),
            ...(typeof props.schema.maximum == 'number' ? { maximum: props.schema.maximum * 100 } : {}),
            ...(typeof props.schema.minimum == 'number' ? { minimum: props.schema.minimum * 100 } : {}),
            ...(typeof props.schema.exclusiveMaximum == 'number' ? { exclusiveMaximum: props.schema.exclusiveMaximum * 100 } : {}),
            ...(typeof props.schema.exclusiveMinimum == 'number' ? { exclusiveMinimum: props.schema.exclusiveMinimum * 100 } : {}),
            ...(typeof props.schema.multipleOf == 'number' ? { multipleOf: props.schema.multipleOf * 100 } : {})
        }
    };
    return (
        <NumberField {...customProps} />
    );
};


const RectangleObjectTemplate = (props: ObjectFieldTemplateProps): JSX.Element => {
    const { idSchema, title, description, properties, formData: rect, formContext } = props;
    const { plugin } = formContext as FormContext;

    console.log(`${module.id}: RectangleObjectTemplate[${props.title}]`, { ...props });

    let isFullscreen = (rect.x == 0 && rect.y == 0 && rect.width == 1 && rect.height == 1);

    function toggleFullScreen(): void {
        isFullscreen = !isFullscreen;

        const [target, property] = moveToTarget(plugin, idSchema.$id.split('_'));

        console.log(`${module.id}: RectangleObjectTemplate[${title}].toggleFullScreen ${target.id}.${property}=${isFullscreen}`, target, props);

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

const addCustom = (item: UiSchema, schema: JSONSchema7): void => {

    console.log(`addCustom(${schema.$id}, ${schema.type})`);

    // if (!rootSchema.definitions)
    //     throw new Error('addCustom: rootSchema got no definitions');

    if (schema.$id && [Rectangle.name, RelativeRectangle.name].includes(schema.$id)) {

        if (item['ui:FieldTemplate']) {
            // console.log(`addCustom(${schema.$id}, ${schema.type}) [ui:FieldTemplate] already set`);
        } else {
            // console.log(`addCustom(${schema.$id}, ${schema.type}) set [ui:ObjectFieldTemplate] = RectangleObjectTemplate`);
            // item['ui:FieldTemplate'] = RectangleFieldTemplate;
            item['ui:ObjectFieldTemplate'] = RectangleObjectTemplate;
        }
    } else if (schema.type == 'number') {
        // console.log(`addCustom(${schema.$id}) ${schema.type} set: item['ui:field'] = PercentField`);
        item['ui:field'] = PercentField;
    }
    if (schema.anyOf) {
        for (const subSchema of schema.anyOf)
            addCustom(item, subSchema as JSONSchema7);
    }
    if (schema.oneOf) {
        for (const subSchema of schema.oneOf)
            addCustom(item, subSchema as JSONSchema7);
    }
    if (schema.properties) {
        for (const [property, value] of Object.entries(schema.properties)) {
            if (value instanceof Object) {
                item[property] = item[property] ?? {};
                addCustom(item[property], value);
            }
        }
    }
};

const fixUiSchema = (item: UiSchema, schema: JSONSchema7, classes: string): UiSchema => {

    replaceHidden(item, classes);

    addCustom(item, schema);

    // console.log(`fixUiSchema: ${classes}`, { ...item });
    return item;
};

const PluginItem = observer(({ plugin }: { plugin: Plugin }): JSX.Element => {
    const [configVisible, setConfigVisible] = useState(false);
    const classes = useStyles();

    const deletePlugin = (): boolean => (plugin.parent as Browser).plugins.delete(plugin.id);

    const formContext: FormContext = { plugin };
    const schema = plugin.getPlainSchema();
    const data = plugin; // .getDeep(); // It creates a copy inside
    const uiSchema = fixUiSchema(Plugin.uiSchema, schema, classes.hiddenField);

    // const schema = require('D:\\Dennis\\OneDrive - Dennis\'es Services\\Desktop\\schema.json');
    // const data = require('D:\\Dennis\\OneDrive - Dennis\'es Services\\Desktop\\data.json');

    console.log(`${module.id}.PluginItem`, data, schema, uiSchema);
    // localStorage.setItem('DEBUG-TEMP', JSON.stringify(schema));
    // localStorage.setItem('DEBUG-TEMP-DATA', JSON.stringify(plugin.getDeep()));

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
                                onClick={(): void => setConfigVisible(!configVisible)}
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
                            showErrorList={true}
                            // transformErrors={(errors: AjvError[]): AjvError[] => {
                            //     errors.forEach(error =>
                            //         console.error(`${module.id}.PluginItem form.transformErrors=`, { ...error })
                            //     );    
                            //     return errors;    
                            // }}
                            idPrefix={plugin.id}
                            liveValidate={true}
                            noHtml5Validate={true}
                            schema={schema}
                            formData={data}
                            uiSchema={uiSchema}
                            fields={{ SchemaField: ObservedField }}
                            formContext={formContext}
                            //                            ObjectFieldTemplate={ObjectTemplate}
                            onError={(e): void => console.error(`${module.id}.PluginItem form.onError: ${e.length}`, e)}
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