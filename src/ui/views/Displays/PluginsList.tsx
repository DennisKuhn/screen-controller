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
    TextField
} from '@material-ui/core';

// @material-ui/icons
import Delete from '@material-ui/icons/Delete';
import Menu from '@material-ui/icons/Menu';
import MenuOpen from '@material-ui/icons/MenuOpen';

// import Form, { UiSchema, ObjectFieldTemplateProps, ErrorSchema, FieldProps } from '@rjsf/core';
import { UiSchema } from '@rjsf/core';
import Form from '@rjsf/material-ui';

import { Plugin } from '../../../Setup/Application/Plugin';
import { Rectangle } from '../../../Setup/Default/Rectangle';
import { RelativeRectangle } from '../../../Setup/Default/RelativeRectangle';
import { ObservableSetupBaseMap } from '../../../Setup/Container';
import { Browser } from '../../../Setup/Application/Browser';

import HiddenField from '../../RjsfComponents/Fields/Hidden';
import ObservedField from '../../RjsfComponents/Fields/Observed';
import PercentField from '../../RjsfComponents/Fields/Percent';
import RectangleObject from '../../RjsfComponents/Objects/Rectangle';

import { JSONSchema7 } from 'json-schema';
import { FormContext } from '../../RjsfComponents/FormContext';
import ObjectTemplate from '../../RjsfComponents/Objects/SetupBase';

const useStyles = makeStyles((/*theme*/) => ({
    percentField: {
        width: 93
    },
    hiddenField: {
        display: 'none'
    }
}));

const PluginForm = observer(({ plugin }: { plugin: Plugin }): JSX.Element => {
    return (
        <>
            <Tooltip
                id={'tooltip-' + plugin.id + '-config'}
                title={plugin.getPlainSchema().description ?? ''}
                placement="top"
                >
                <TextField
                    value={plugin.name}
                    onChange={(e): string => plugin.name = e.target.value}
                />
            </Tooltip>
        </>
    );
});


const replaceHidden = (item: UiSchema, classes: string): UiSchema => {

    if (item['ui:widget'] == 'hidden') {
        delete item['ui:widget'];
        item['ui:FieldTemplate'] = HiddenField;
    }
    // recurse
    for (const value of Object.values(item)) {
        (value instanceof Object) && replaceHidden(value, classes);
    }

    // console.log(`fixUiSchema: ${classes}`, { ...item });

    return item;
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



const addCustom = (item: UiSchema, schema: JSONSchema7, root?: JSONSchema7): void => {

    root = root ?? schema;

    // console.log(`addCustom(${schema.$id}, ${schema.$ref}, ${schema.type})`);

    if (!root.definitions)
        throw new Error('addCustom: root got no definitions');

    if (schema.$ref) {
        addCustom(
            item,
            root.definitions[schema.$ref.substr('#/definitions/'.length)] as JSONSchema7,
            root
        );
    } else {
        if (schema.$id && [ Rectangle.name, RelativeRectangle.name].includes(schema.$id)) {

            if (item['ui:FieldTemplate']) {
                // console.log(`addCustom(${schema.$id}, ${schema.type}) [ui:FieldTemplate] already set`);
            } else {
                // console.log(`addCustom(${schema.$id}, ${schema.type}) set [ui:ObjectFieldTemplate] = RectangleObjectTemplate`);
                // item['ui:FieldTemplate'] = RectangleFieldTemplate;
                item['ui:ObjectFieldTemplate'] = RectangleObject;
            }
        } else if (schema.$id == 'Percent') {
            const classes = useStyles();

            // console.log(`addCustom(${schema.$id}, ${schema.type})  set: item['ui:field'] = PercentField`);
            item['ui:field'] = PercentField;
            item.classNames = classes.percentField;
        }
        if (schema.anyOf) {
            for (const subSchema of schema.anyOf)
                addCustom(item, subSchema as JSONSchema7, root);
        }
        if (schema.oneOf) {
            for (const subSchema of schema.oneOf)
                addCustom(item, subSchema as JSONSchema7, root);
        }
        if (schema.properties) {
            for (const [property, value] of Object.entries(schema.properties)) {
                if (value instanceof Object) {
                    item[property] = item[property] ?? {};
                    addCustom(item[property], value, root);
                }
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


    const formContext: FormContext = { root: plugin };
    const schema = plugin.getPlainSchema();
    const data = plugin.getDeep(); // It creates a copy inside
    const uiSchema = fixUiSchema(Plugin.uiSchema, schema, classes.hiddenField);

    // console.log(`${module.id}.PluginItem`, data, schema, uiSchema);

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
                            ObjectFieldTemplate={ObjectTemplate}
                            formContext={formContext}
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