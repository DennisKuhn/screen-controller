import React from 'react';
import { InputProps, PropertyProps, WrapperProps, ArrayPropsWithChildren, ChangeEventArgs, isChangeEvent, ArrayPropertyProps, Options } from './Shared';
import { callerAndfName } from '../../../utils/debugging';
import { getProspect, Field, LabelContainer, LabelView, ValueContainer, ValueInput, getType, getLabel } from './AbstractComponents';
import { ScSchema7 } from '../../../Setup/ScSchema7';
import { SetupBase } from '../../../Setup/SetupBase';

const ContainerArray = (props: ArrayPropsWithChildren & WrapperProps): JSX.Element => getProspect('Array', props);

interface ArrayItemBuilderProps {
    index: number;
    array: Array<any>;
    schema: ScSchema7;
    setup: SetupBase;
    property: string;
    baseKey: string;
    options: Options;
}

const getIndexLabel = (index: number, schema: ScSchema7): string => schema.scTranslationId ?? schema.title ?? index.toFixed();

const ArrayItemBuilder = ({ array, index, baseKey, property, schema, setup, options }: ArrayItemBuilderProps): JSX.Element => {
    if (schema.scHidden == true)
        throw new Error(`${callerAndfName()} ${baseKey} is hidden`);

    const onChange = (change: ChangeEventArgs): void => {
        if (isChangeEvent(change)) {
            array[index] = change.target.nodeValue;
        } else {
            array[index] = change;
        }
    };

    const label = getIndexLabel(index, schema);

    const sharedProps = {
        key: baseKey,
        item: setup,
        property,
        array,
        index,
        schema,
        rawValue: array[index],
        value: array[index],
        cacheId: baseKey,
        readOnly: schema.readOnly === true || schema.scViewOnly === true,
        rawLabel: label,
        label,
        helperText: schema.description,
        rawHelperText: schema.scDescriptionTranslationId ?? schema.description,
        type: getType(schema),
        onChange,
        options
    };

    const fieldProps: ArrayPropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-Field',
        elementKey: baseKey + '-Field'
    };
    const labelContainerProps: ArrayPropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-labelContainer',
        elementKey: baseKey + '-labelContainer'
    };
    const valueContainerProps: ArrayPropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-valueContainer',
        elementKey: baseKey + '-valueContainer'
    };

    const labelViewProps: ArrayPropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-labelView',
        elementKey: baseKey + '-labelView',
        contentChild: label,
    };

    const valueInputProps: ArrayPropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-valueInput',
        elementKey: baseKey + '-valueInput'
    };

    return (
        <Field {...fieldProps}>
            <LabelContainer {...labelContainerProps}>
                <LabelView {...labelViewProps} />
            </LabelContainer>
            <ValueContainer {...valueContainerProps} >
                <ValueInput {...valueInputProps} />
            </ValueContainer>
        </Field>
    );
};


const ArrayInput = ({ item, property, value, schema, type, options }: InputProps & PropertyProps): JSX.Element => {
    if (!Array.isArray(value)) throw new Error(`${callerAndfName()} value must be an array: ${JSON.stringify(value)}`);
    if (type !== 'array') throw new Error(`${callerAndfName()} type=${type} invalid, must be array`);
    if ((typeof schema.items !== 'object') || Array.isArray(schema.items))
        throw new Error(`${callerAndfName()} typeof schema.items must be object(Schema), ${typeof schema.items} is not supported`);

    const baseKey = `${item.id}.${property}`;
    const containerKey = `${baseKey}-ContainerArray`;
    const itemSchema = schema.items;
    const label = getLabel(item.parentProperty, schema);

    return (
        <ContainerArray
            item={item}
            property={property}
            array={value}
            schema={schema}
            label={label}
            rawLabel={label}
            helperText={schema.description}
            rawHelperText={schema.scDescriptionTranslationId ?? schema.description}
            cacheId={containerKey}
            elementKey={containerKey}
            key={containerKey}
            options={options}
            >
            {value.map((valueItem, index) =>
                <ArrayItemBuilder
                    setup={item}
                    property={property}
                    array={value}
                    index={index}
                    schema={itemSchema}
                    baseKey={`${baseKey}.${index}`}
                    key={`${baseKey}-ItemBuilder.${index}`}
                    options={options}
                />
            )}
        </ContainerArray>
    );
};

export default ArrayInput;
