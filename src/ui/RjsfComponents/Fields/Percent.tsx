import React from 'react';
import { FieldProps, ErrorSchema } from '@rjsf/core';
import NumberField from '@rjsf/core/lib/components/fields/NumberField';

/**
 * 
 * @param props 
 */
const Percent = (props: FieldProps): JSX.Element => {

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
        <NumberField { ...customProps } />
    );
};

export default Percent;