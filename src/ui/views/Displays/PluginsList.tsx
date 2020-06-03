
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
    GridListTile,
    TextField
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
import { RelativeRectangle } from '../../../Setup/Default/RelativeRectangle';
import { ObservableSetupBaseMap } from '../../../Setup/Container';
import { Browser } from '../../../Setup/Application/Browser';
import { SetupBase } from '../../../Setup/SetupBase';

// import RelativeRectangle from './RelativeRectangle';

import { JSONSchema7 } from 'json-schema';
import Ajv from 'ajv';


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

const ajv = (new Ajv()).addSchema(Plugin.activeSchema);

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
        // const ajv = ajvs[formContext.plugin.className];
        if (!ajv) {
            console.error(`${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] no ajv for : ${formContext.plugin.className}`, props);
        } else {
            let fValidate;

            const schema = props.schema.$ref ?
                { $ref: Plugin.activeSchema.$id + props.schema.$ref.substr('#'.length) } :
                props.schema;
            // const schema = props.schema;

            try {
                fValidate = ajv.getSchema(props.idSchema.$id) ?? ajv.addSchema(schema, props.idSchema.$id).getSchema(props.idSchema.$id);
            } catch (error) {
                console.error(
                    `${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] creating validate function caught: ${error} from: ${JSON.stringify(schema)}`,
                    error, schema);
            }

            if (!fValidate) {
                console.error(`${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] can't create validate function from: ${JSON.stringify(schema)}`, props);
                //throw new Error(`${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] can't create validate function from: ${JSON.stringify(props.schema)}`);
            } else {
                // console.log(`${module.id}.ObservedField[${props.idSchema.$id}] ${JSON.stringify(schema)}`);

                const validate = fValidate;


                const customProps = {
                    ...props,
                    onChange: (newValue, es?: ErrorSchema): void => {
                        // console.log(`${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] onChange=`, newValue, props, es);

                        originalOnChange(newValue, es);

                        // console.log(`${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] onChange=`, newValue, props, es);
                        // Split idSchema $id <RootPrefix>_<RootProperty>_<Childproperty>
                        const [target, name] = moveToTarget(
                            formContext.plugin,
                            props.idSchema.$id.split('_'));

                        if (newValue.id) {
                            if (newValue.id != target[name]?.id) {
                                console.error(`${module.id}.ObservedField[${props.idSchema?.$id}][${name}].onChange: ${newValue.id} != ${target[name]?.id}`);
                            } else {
                                // console.log(`${module.id}.ObservedField[${props.idSchema?.$id}][${name}].onChange: skip ${newValue.id} == ${target[name]?.id}`);
                            }
                        } else {
                            if (validate(newValue)) {
                                // console.log(`${module.id}.ObservedField[${props.idSchema?.$id}][${name}]== ${target[name]} = ${newValue}`);
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
        }
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
        formData: Number(((props.formData as number) * 100).toPrecision(10)),
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

    // console.log(`${module.id}: RectangleObjectTemplate[${props.title}]`, { ...props });

    let isFullscreen = (rect.x == 0 && rect.y == 0 && rect.width == 1 && rect.height == 1);

    function toggleFullScreen(): void {
        isFullscreen = !isFullscreen;

        const [target, property] = moveToTarget(plugin, idSchema.$id.split('_'));

        // console.log(`${module.id}: RectangleObjectTemplate[${title}].toggleFullScreen ${target.id}.${property}=${isFullscreen}`, target, props);

        target[property] = RelativeRectangle.createNew(
            target['id'],
            isFullscreen ?
                { x: 0, y: 0, width: 1, height: 1 } :
                { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
        );
    }

    return (
        <div>
            {title}
            <GridList cellHeight={'auto'} cols={9} >
                <GridListTile cols={1}>
                    <Tooltip
                        title={isFullscreen ? 'Make part screen' : 'Make Full Screen'}
                    >
                        <IconButton aria-label="Fullscreen" onClick={toggleFullScreen} >
                            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                        </IconButton>
                    </Tooltip>
                </GridListTile>
                {
                    properties
                        .filter(({ content }: { content: { props } }) =>
                            (content.props.uiSchema == undefined)
                            || (content.props.uiSchema['ui:FieldTemplate'] != HiddenFieldTemplate))
                        .map(element => {
                            // console.log(`${module.id}: RectangleObjectTemplate[${title}] ${element.name}`, element, { ...element.content });

                            return (
                                <GridListTile cols={2} key={`Tile-${element.content.key}`}>
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
    const { properties } = props;
    // console.log(`${module.id}: ObjectTemplate[${props.title}]`);
    return (
        <div>
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
                item['ui:ObjectFieldTemplate'] = RectangleObjectTemplate;
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

    item['name'] = item['name'] ?? {};
    item['name']['ui:widget'] = 'hidden';

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