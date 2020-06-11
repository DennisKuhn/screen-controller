import React from 'react';
import { FieldProps, ErrorSchema } from '@rjsf/core';
import NumberField from '@rjsf/core/lib/components/fields/NumberField';

/**
 * 
 * @param props 
 */
const PercentField = ({ onChange, schema, formData, ...props}: FieldProps): JSX.Element => {

    // console.log(`${module.id}.PercentField[${props.idSchema.$id}] props=`, props);

    const customProps = {
        ...props,
        onChange: (newValue, es?: ErrorSchema): void => {
            // console.log(`${module.id}.PercentField[${props.idSchema.$id}][${props.name}] onChange=`, newValue, props, es);

            onChange(Number(((newValue as number) / 100).toPrecision(10)), es);
        },
        formData: Number(((formData as number) * 100).toPrecision(10)),
        schema: {
            ...schema,
            ...(typeof schema.default == 'number' ? { default: schema.default * 100 } : {}),
            ...(typeof schema.maximum == 'number' ? { maximum: schema.maximum * 100 } : {}),
            ...(typeof schema.minimum == 'number' ? { minimum: schema.minimum * 100 } : {}),
            ...(typeof schema.exclusiveMaximum == 'number' ? { exclusiveMaximum: schema.exclusiveMaximum * 100 } : {}),
            ...(typeof schema.exclusiveMinimum == 'number' ? { exclusiveMinimum: schema.exclusiveMinimum * 100 } : {}),
            ...(typeof schema.multipleOf == 'number' ? { multipleOf: schema.multipleOf * 100 } : {})
        }
    };
    return (
        <NumberField { ...customProps } />
    );
};

export default PercentField;