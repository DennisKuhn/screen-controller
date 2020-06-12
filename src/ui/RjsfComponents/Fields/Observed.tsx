import { ErrorSchema, FieldProps } from '@rjsf/core';
import SchemaField from '@rjsf/core/lib/components/fields/SchemaField';
import Ajv, { ValidateFunction } from 'ajv';
import { cloneDeep } from 'lodash';
import React from 'react';
import controller from '../../../Setup/Controller';
import { SetupBase } from '../../../Setup/SetupBase';
import { forEach } from '../../../Setup/JsonSchemaTools';
import { JSONSchema7 } from 'json-schema';

const ajv = (new Ajv()).addSchema(SetupBase.activeSchema);

const targetCache = new Map<string, [SetupBase, string]>();

const getTarget = (idSchemaId: string): [SetupBase, string] => {
    // const cache = targetCache.get(idSchemaId);

    // if (cache)
    //     return cache;

    const stack = idSchemaId.split('_');
    const propertyName = stack[stack.length - 1];
    let iStack = stack.length - 2;
    let parent = controller.tryGetSetupSync(stack[iStack], 0);

    // Dive into stack until a parent found
    while ((iStack >= 0) && (parent == undefined)) {
        iStack -= 1;
        parent = controller.tryGetSetupSync(stack[iStack], 0);
    }
    if (parent == undefined)
        throw new Error(`ObservedField[${idSchemaId}].[${name}] failed to get root parent stack=${stack}`);

    while (iStack < (stack.length - 2)) {
        iStack++;
        parent = parent[stack[iStack]];
        if (parent == undefined)
            throw new Error(`ObservedField[${idSchemaId}].[${name}] failed to get parent child ${stack[iStack]} stack=${stack}`);
    }
    
    targetCache.set(idSchemaId, [parent, propertyName]);
    return [parent, propertyName];
};

const getValidator = (idSchemaId: string, schema: JSONSchema7): ValidateFunction => {
    const schemaId = schema.$id ?? idSchemaId;
    let fValidate: ValidateFunction | undefined = ajv.getSchema(schemaId);

    if (!fValidate) {
        const unFixedSchema = cloneDeep(schema);
        forEach(
            unFixedSchema,
            s => s.$ref &&
                (s.$ref = SetupBase.activeSchema.$id + s.$ref.substr('#'.length))
        );

        try {
            fValidate =
                ajv.addSchema(unFixedSchema, schemaId)
                    .getSchema(schemaId);
        } catch (error) {
            throw new Error(
                `getValidator[${schema.$id}/${idSchemaId}] creating validate function caught: ${error} from: ${JSON.stringify(unFixedSchema)}`);
        }
        if (!fValidate)
            throw new Error(
                `getValidator[${schema.$id}/${idSchemaId}] can't get/create validate function from: ${JSON.stringify(schema)}`);
    }
    return fValidate;
};

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
        const [item, propertyName] = getTarget(idSchema.$id);
        const validate = getValidator(idSchema.$id, props.schema);

        console.log(`ObservedField[${parent}.${propertyName}].[${name}] ${idSchema.$id} ${JSON.stringify(props.schema)}`);

        const customProps = {
            ...remainingProps,
            onChange: (newValue, es?: ErrorSchema): void => {
                // console.log(`ObservedField[${parent}.${propertyName}].[${name}] [${schemaId}/${idSchema.$id}] onChange=`, newValue, props, es);

                onChange(newValue, es);

                if (newValue.id) {
                    if (newValue.id != item[name]?.id) {
                        console.error(`ObservedField[${parent}.${propertyName}].[${name}] ${idSchema.$id}.onChange: ${newValue.id} != ${item[name]?.id}`);
                    } else {
                        console.log(`ObservedField[${parent}.${propertyName}].[${name}] ${idSchema.$id}.onChange: skip ${newValue.id} == ${item[name]?.id}`);
                    }
                } else {
                    if (validate(newValue)) {
                        console.log(`ObservedField[${parent}.${propertyName}].[${name}] ${idSchema.$id}== ${item[name]} = ${newValue}`);
                        item[name] = newValue;
                    } else {
                        console.warn(
                            `ObservedField[${parent}.${propertyName}].[${name}] ${idSchema.$id}== ${item[name]} = -> ${newValue} <- :` +
                            ` ${validate.errors ? validate.errors.map(error => `${error.dataPath}:${error.message}`) : ''}`,
                            { ...validate.errors }, newValue);
                    }
                }
            }
        };
        return (
            <SchemaField {...customProps} />
        );
    } else {
        console.log(`ObservedField[${name}] [${idSchema.$id}] ignore`);
    }
    return (
        <SchemaField {...props} />
    );
};

export default ObservedField;
