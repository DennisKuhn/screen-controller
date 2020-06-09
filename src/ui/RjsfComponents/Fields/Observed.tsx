import { ErrorSchema, FieldProps } from '@rjsf/core';
import SchemaField from '@rjsf/core/lib/components/fields/SchemaField';
import Ajv from 'ajv';
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
const Observed = (props: FieldProps): JSX.Element => {
    const { onChange, ...remainingProps } = props;
    const { setupItemId, idSchema, name } = props;


    //Only process if we are dealing with a field, not the parent object
    if ('name' in props && setupItemId) {
        const item = controller.tryGetSetupSync(setupItemId, 0);

        if (!item)
            throw new Error(`ObservedField[${setupItemId}].[${name}] [${idSchema.$id}] failed controller.tryGetSetupSync()`);


        let fValidate;

        // const schema = props.schema.$ref ?
        //     { $ref: SetupBase.activeSchema.$id + props.schema.$ref.substr('#'.length) } :
        //     props.schema;
        
        const schema = cloneDeep(props.schema);

        forEach(
            schema,
            s => s.$ref &&
                (s.$ref = SetupBase.activeSchema.$id + s.$ref.substr('#'.length))
        );

        // console.log(`ObservedField[${setupItemId}].[${name}] [${idSchema.$id}]`, schema, props);
        
        const schemaId = schema.$id ?? idSchema.$id;
        
        try {
            fValidate =
                ajv.getSchema(schemaId) ??
                ajv.addSchema(schema, schemaId).getSchema(schemaId);
        } catch (error) {
            console.error(
                `ObservedField[${setupItemId}].[${name}] [${schemaId}/${idSchema.$id}] creating validate function caught: ${error} from: ${JSON.stringify(schema)}`,
                error, schema);
        }

        if (!fValidate) {
            console.error(
                `ObservedField[${setupItemId}].[${name}] [${schemaId}/${idSchema.$id}] can't create validate function from: ${JSON.stringify(schema)}`, props);
            //throw new Error(
            // `ObservedField[${setupItemId}].[${name}] [${schemaId}/${idSchema.$id}] can't create validate function from: ${JSON.stringify(props.schema)}`);
        } else {
            // console.log(`ObservedField[${setupItemId}].[${name}] [${schemaId}/${idSchema.$id}] ${JSON.stringify(schema)}`);

            const validate = fValidate;

            const customProps = {
                ...remainingProps,
                onChange: (newValue, es?: ErrorSchema): void => {
                    // console.log(`ObservedField[${setupItemId}].[${name}] [${schemaId}/${idSchema.$id}] onChange=`, newValue, props, es);

                    onChange(newValue, es);

                    if (newValue.id) {
                        if (newValue.id != item[name]?.id) {
                            console.error(`ObservedField[${setupItemId}].[${name}] [${schemaId}/${idSchema.$id}].onChange: ${newValue.id} != ${item[name]?.id}`);
                        } else {
                            console.log(`ObservedField[${setupItemId}].[${name}] [${schemaId}/${idSchema.$id}].onChange: skip ${newValue.id} == ${item[name]?.id}`);
                        }
                    } else {
                        if (validate(newValue)) {
                            console.log(`ObservedField[${setupItemId}].[${name}] [${schemaId}/${idSchema.$id}]== ${item[name]} = ${newValue}`);
                            item[name] = newValue;
                        } else {
                            console.warn(
                                `ObservedField[${setupItemId}].[${name}] [${schemaId}/${idSchema.$id}]== ${item[name]} = -> ${newValue} <- :` +
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
    return (
        <SchemaField {...props} />
    );
};

export default Observed;
