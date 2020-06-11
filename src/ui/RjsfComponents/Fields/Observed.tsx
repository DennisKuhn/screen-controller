import { ErrorSchema, FieldProps } from '@rjsf/core';
import SchemaField from '@rjsf/core/lib/components/fields/SchemaField';
import Ajv, { ValidateFunction } from 'ajv';
import { cloneDeep } from 'lodash';
import React from 'react';
import controller from '../../../Setup/Controller';
import { SetupBase } from '../../../Setup/SetupBase';
import { forEach } from '../../../Setup/JsonSchemaTools';

const ajv = (new Ajv()).addSchema(SetupBase.activeSchema);



/**
 * 
 * @see https://github.com/rjsf-team/react-jsonschema-form/issues/651
 * @param props 
 */
const ObservedField = (props: FieldProps): JSX.Element => {
    const { onChange, ...remainingProps } = props;
    const { idSchema, name, formData } = props;

    //Only process if we are dealing with a field, not the parent object
    if (typeof formData != 'object') {
        // Root_Object-ID_propertyName_property or Root_Object-ID_property
        const stack = idSchema.$id.split('_'); 
        const propertyName = stack[stack.length - 1];
        let iStack = stack.length - 2;
        let parent = controller.tryGetSetupSync(stack[iStack], 0);

        // Dive into stack until a parent found
        while ((iStack >= 0) && (parent == undefined)) {
            iStack -= 1;
            parent = controller.tryGetSetupSync(stack[iStack], 0);
        }
        if (parent == undefined) 
            throw new Error(`ObservedField[${idSchema.$id}].[${name}] failed to get root parent stack=${stack}`);
        
        while (iStack < (stack.length - 2)) {
            iStack++;
            parent = parent[stack[iStack]];
            if (parent == undefined)
                throw new Error(`ObservedField[${idSchema.$id}].[${name}] failed to get parent child ${stack[iStack]} stack=${stack}`);
        }
        const item = parent;

        if (!item)
            throw new Error(`ObservedField[${parent}.${propertyName}].[${name}] [${idSchema.$id}] failed controller.tryGetSetupSync()`);

        let fValidate: ValidateFunction | undefined;
        const schema = cloneDeep(props.schema);

        forEach(
            schema,
            s => s.$ref &&
                (s.$ref = SetupBase.activeSchema.$id + s.$ref.substr('#'.length))
        );

        // console.log(`ObservedField[${parent}.${propertyName}].[${name}] [${idSchema.$id}]`, schema, cloneDeep( props ));
        
        const schemaId = schema.$id ?? idSchema.$id;
        
        try {
            fValidate =
                ajv.getSchema(schemaId) ??
                ajv.addSchema(schema, schemaId).getSchema(schemaId);
        } catch (error) {
            console.error(
                `ObservedField[${parent}.${propertyName}].[${name}] [${schemaId}/${idSchema.$id}] creating validate function caught: ${error} from: ${JSON.stringify(schema)}`,
                error, schema);
        }

        if (!fValidate) {
            console.error(
                `ObservedField[${parent}.${propertyName}].[${name}] [${schemaId}/${idSchema.$id}] can't create validate function from: ${JSON.stringify(schema)}`, props);
            //throw new Error(
            // `ObservedField[${parent}.${propertyName}].[${name}] [${schemaId}/${idSchema.$id}] can't create validate function from: ${JSON.stringify(props.schema)}`);
        } else {
            console.log(`ObservedField[${parent}.${propertyName}].[${name}] [${schemaId}/${idSchema.$id}] ${JSON.stringify(schema)}`, cloneDeep( props));

            const validate = fValidate;

            const customProps = {
                ...remainingProps,
                onChange: (newValue, es?: ErrorSchema): void => {
                    // console.log(`ObservedField[${parent}.${propertyName}].[${name}] [${schemaId}/${idSchema.$id}] onChange=`, newValue, props, es);

                    onChange(newValue, es);

                    if (newValue.id) {
                        if (newValue.id != item[name]?.id) {
                            console.error(`ObservedField[${parent}.${propertyName}].[${name}] [${schemaId}/${idSchema.$id}].onChange: ${newValue.id} != ${item[name]?.id}`);
                        } else {
                            console.log(`ObservedField[${parent}.${propertyName}].[${name}] [${schemaId}/${idSchema.$id}].onChange: skip ${newValue.id} == ${item[name]?.id}`);
                        }
                    } else {
                        if (validate(newValue)) {
                            console.log(`ObservedField[${parent}.${propertyName}].[${name}] [${schemaId}/${idSchema.$id}]== ${item[name]} = ${newValue}`);
                            item[name] = newValue;
                        } else {
                            console.warn(
                                `ObservedField[${parent}.${propertyName}].[${name}] [${schemaId}/${idSchema.$id}]== ${item[name]} = -> ${newValue} <- :` +
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
    } else {
        console.log(`ObservedField[${name}] [${idSchema.$id}] ignore`, cloneDeep( props ));
    }
    return (
        <SchemaField {...props} />
    );
};

export default ObservedField;
