import { makeStyles } from '@material-ui/core';
import { ChevronRight, ExpandMore } from '@material-ui/icons';
import { TreeView } from '@material-ui/lab';
// import Form, { UiSchema } from '@rjsf/core';
import { UiSchema } from '@rjsf/core';
import Form from '@rjsf/material-ui';
import { JSONSchema7 } from 'json-schema';
import { merge } from 'lodash';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Screen } from '../../Setup/Application/Screen';
import { Rectangle } from '../../Setup/Default/Rectangle';
import { RelativeRectangle } from '../../Setup/Default/RelativeRectangle';
import { SetupBase } from '../../Setup/SetupBase';
import HiddenField from './Fields/Hidden';
import ObservedField from './Fields/Observed';
import PercentField from './Fields/Percent';
import { FormContext } from './FormContext';
import DictionaryObject from './Objects/Dictionary';
import RectangleObject from './Objects/Rectangle';
import SetupObject from './Objects/SetupBase';
import { toJS } from 'mobx';

const useStyles = makeStyles((/*theme*/) => ({
    percentField: {
        width: 93
    },
    hiddenField: {
        display: 'none'
    }
}));

const replaceHidden = (item: UiSchema): UiSchema => {

    if (item['ui:widget'] == 'hidden') {
        delete item['ui:widget'];
        item['ui:FieldTemplate'] = HiddenField;
    }
    // recurse
    for (const value of Object.values(item)) {
        (value instanceof Object) && replaceHidden(value);
    }

    // console.log(`fixUiSchema: ${item}`, { ...item });

    return item;
};


const addCustom = (item: UiSchema, schema: JSONSchema7, root?: JSONSchema7): void => {

    root = root ?? schema;

    // console.log(`Form.addCustom(id=${schema.$id}, ref=${schema.$ref}, type=${schema.type})`);

    if (!root.definitions)
        throw new Error('Form.addCustom: root got no definitions');

    if (schema.$ref) {
        addCustom(
            item,
            root.definitions[schema.$ref.substr('#/definitions/'.length)] as JSONSchema7,
            root
        );
    } else {
        // If SetupBase or child class
        if (schema.required && schema.required.includes('id') && schema.required.includes('className')) {
            // console.log(`Form.addCustom(${schema.$id}, ${schema.type}) SetupBase merge uiSchema`, SetupBase.uiSchema);

            if (!schema.$id)
                throw new Error(`Form.addCustom(${schema.$id}, ${schema.type}) SetupBase no $id: ${JSON.stringify(schema)}`);

            merge(item, SetupBase.getUiSchema(schema.$id));

            if (schema.$id && [Rectangle.name, RelativeRectangle.name].includes(schema.$id)) {
                if (item['ui:FieldTemplate'] || (item['ui:widget'] == 'hidden')) {
                    // console.log(`Form.addCustom(${schema.$id}, ${schema.type}) set Rectangle already hidden`);
                } else {
                    // console.log(`Form.addCustom(${schema.$id}, ${schema.type}) set [ui:ObjectFieldTemplate] = RectangleObject`);
                    // item['ui:FieldTemplate'] = RectangleFieldTemplate;
                    item['ui:ObjectFieldTemplate'] = RectangleObject;
                }
            } else {
                // console.log(`Form.addCustom(${schema.$id}, ${schema.type}) SetupBase set [ui:ObjectFieldTemplate] = SetupObject`);
                item['ui:ObjectFieldTemplate'] = SetupObject;
            }
        } else if (schema.$id == 'Percent') {
            const classes = useStyles();

            // console.log(`Form.addCustom(${schema.$id}, ${schema.type})  set: item['ui:field'] = PercentField`);
            item['ui:field'] = PercentField;
            item.classNames = classes.percentField;
        } else if (schema.type == 'object' && schema.additionalProperties) {
            // console.log(`Form.addCustom(${schema.$id}, ${schema.type}) set [ui:ObjectFieldTemplate] = DictionaryObject`);
            item['ui:ObjectFieldTemplate'] = DictionaryObject;
        }

        if (schema.properties) {
            for (const [property, value] of Object.entries(schema.properties)) {
                if (value instanceof Object) {
                    item[property] = item[property] ?? {};
                    addCustom(item[property], value, root);
                }
            }
        }
        if (schema.additionalProperties) {
            item['additionalProperties'] = {};
            addCustom(
                item['additionalProperties'],
                schema.additionalProperties as JSONSchema7,
                root
            );
        }
        if (schema.anyOf) {
            for (const subSchema of schema.anyOf)
                addCustom(item, subSchema as JSONSchema7, root);
        }
        if (schema.oneOf) {
            for (const subSchema of schema.oneOf)
                addCustom(item, subSchema as JSONSchema7, root);
        }
    }
};

const fixUiSchema = (item: UiSchema, schema: JSONSchema7): UiSchema => {


    addCustom(item, schema);

    replaceHidden(item);

    // console.log(`fixUiSchema: ${classes}`, { ...item });
    return item;
};


const SetupBaseForm = observer(({ root, schema }: { root: SetupBase; schema: JSONSchema7 }): JSX.Element => {

    const formContext: FormContext = { schema };
    const uiSchema = fixUiSchema(Screen.uiSchema, schema);

    console.log(`SetupBaseForm(${root.id}/${root.className})`/*, uiSchema*/);

    return (
        <TreeView
            defaultCollapseIcon={<ExpandMore />}
            defaultExpandIcon={<ChevronRight />}
            >
            <Form
                showErrorList={true}
                // transformErrors={(errors: AjvError[]): AjvError[] => {
                //     errors.forEach(error =>
                //         console.error(`${module.id}.PluginItem form.transformErrors=`, { ...error })
                //     );    
                //     return errors;    
                // }}
                tagName={'div'}
                idPrefix={root.id}
                liveValidate={true}
                noHtml5Validate={true}
                schema={schema}
                formData={root.getShallow()}
                // formData={toJS(root, { recurseEverything: true, exportMapsAsObjects: true })}
                uiSchema={uiSchema}
                fields={{ SchemaField: ObservedField }}
                formContext={formContext}
                onError={(e): void => console.error(`ScreenForm: form.onError: ${e.length}`, e)}
                children={' '}
            />
        </TreeView>
    );
});

export default SetupBaseForm;