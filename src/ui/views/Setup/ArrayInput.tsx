import React from 'react';
import { InputProps, PropertyProps, WrapperProps, ArrayPropsWithChildren, ChangeEventArgs, isChangeEvent, ArrayPropertyProps, Options, ActionProps } from './PropTypes';
import { callerAndfName } from '../../../utils/debugging';
import { getProspect, Field, LabelContainer, LabelView, ValueContainer, ValueInput, getType, getLabel, NewContainer, NewItem, DeleteItem } from './AbstractComponents';
import { ScSchema7 } from '../../../Setup/ScSchema7';
import { SetupBase } from '../../../Setup/SetupBase';
import { Icon } from '@material-ui/core';
import { Add } from '@material-ui/icons';

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

    const deleteItem = (): any[] => array.splice(index, 1);

    const deleteProps: ArrayPropertyProps & ActionProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-Delete',
        elementKey: baseKey + '-Delete',
        onClick: () => deleteItem,
    };

    return (
        <Field {...fieldProps}>
            <LabelContainer {...labelContainerProps}>
                <LabelView {...labelViewProps} />
            </LabelContainer>
            <ValueContainer {...valueContainerProps} >
                <ValueInput {...valueInputProps} />
            </ValueContainer>
            <DeleteItem {...deleteProps} />
        </Field>
    );
};

const addSchemaItem = (parentItem: SetupBase, arrayName: string, newSchema: ScSchema7): void => {

    console.debug(`${callerAndfName()}(${parentItem?.id}, ${arrayName}, ${newSchema.type})`, {parentItem, arrayName, newSchema});

    switch (newSchema.type) {
        case 'string':
            parentItem[arrayName].push('');
            break;
        default:
            throw new Error(`${callerAndfName()} type=${newSchema.type} not supported yet`);
    }
};


const ArrayInput = ({ item, property, value, schema, type, options }: InputProps & PropertyProps): JSX.Element => {
    if (!Array.isArray(value)) throw new Error(`${callerAndfName()} value must be an array: ${JSON.stringify(value)}`);
    if (type !== 'array') throw new Error(`${callerAndfName()} type=${type} invalid, must be array`);
    if ((typeof schema.items !== 'object') || Array.isArray(schema.items))
        throw new Error(`${callerAndfName()} typeof schema.items must be object(Schema), ${typeof schema.items} is not supported`);

    const baseKey = `${item.id}.${property}`;
    const containerKey = `${baseKey}-ContainerArray`;
    const newContainerKey = `${baseKey}-NewContainerarray`;
    const itemSchema = schema.items;
    const label = getLabel(undefined, item.parentProperty, schema);
    const newLabel = getLabel(undefined, 'new', itemSchema);
    const newItems = itemSchema.oneOf ?? [itemSchema];
    const sharedProps = {
        item: item,
        property: property,
        array: value,
        options: options,
    };

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
            <NewContainer
                {...sharedProps}
                key={newContainerKey}
                schema={itemSchema}
                cacheId={newContainerKey}
                elementKey={newContainerKey}
                label={newLabel}
                rawLabel={newLabel}
            >
                {newItems.map((newSchema, index) => {
                    if (typeof newSchema !== 'object') throw new Error(`${callerAndfName()} invalid new item schema ${JSON.stringify(newSchema)}`);
                    const key = baseKey + '-new-' + newSchema.$id ?? index;
                    const label = getLabel(undefined, property, newSchema);
                    const scSchema = newSchema as ScSchema7;
                    const newIcon = scSchema.scIcon ?
                        <Icon>{scSchema.scIcon}</Icon> :
                        <Add />;

                    return <NewItem
                        {...sharedProps}
                        key={key}
                        elementKey={key}
                        cacheId={key}
                        schema={scSchema}
                        contentChild={newIcon}
                        label={label}
                        rawLabel={label}
                        helperText={scSchema.description}
                        rawHelperText={scSchema.scDescriptionTranslationId ?? scSchema.description}
                        onClick={(): void => addSchemaItem(item, property, scSchema)}
                    />;
                }
                )
                }
            </NewContainer>
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
