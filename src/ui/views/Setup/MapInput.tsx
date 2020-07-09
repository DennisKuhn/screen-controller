import React from 'react';
import { InputProps, PropertyProps, WrapperProps, MapPropsWithChildren, ChangeEventArgs, isChangeEvent, AllPropsType } from './Registry';
import { callerAndfName } from '../../../utils/debugging';
import { getProspect, Field, LabelContainer, LabelView, ValueContainer, ValueInput, getType, getLabel } from './AbstractComponents';
import { ScSchema7 } from '../../../Setup/ScSchema7';
import { SetupBase } from '../../../Setup/SetupBase';
import {  } from '../../../Setup/Container';
import { isObservableMap } from 'mobx';

const ContainerMap = (props: MapPropsWithChildren & WrapperProps): JSX.Element => getProspect('Map', props);

interface MapItemBuilderProps {
    mapKey: string;
    map: Map<string, SetupBase>;
    schema: ScSchema7;
    setup: SetupBase;
    property: string;
    baseKey: string;
}

const getMapKeyLabel = (mapKey: string, schema: ScSchema7): string => schema.scTranslationId ?? schema.title ?? mapKey;

const MapItemBuilder = ({ map, mapKey, baseKey, property, schema, setup }: MapItemBuilderProps): JSX.Element => {
    if (schema.scHidden == true)
        throw new Error(`${callerAndfName()} ${baseKey} is hidden`);

    const onChange = (change: ChangeEventArgs): void => {
        const newValue = isChangeEvent(change) ? change.target.nodeValue : change;
        map.set(mapKey, newValue);
    };

    const label = getMapKeyLabel(mapKey, schema);

    if (! mapKey) throw new Error(`${callerAndfName()} ${mapKey} is invalid=${mapKey}`);

    const sharedProps: AllPropsType = {
        key: baseKey,
        item: setup,
        property,
        mapKey,
        schema,
        rawValue: mapKey,
        value: mapKey,
        cacheId: baseKey,
        readOnly: schema.readOnly === true || schema.scViewOnly === true,
        rawLabel: label,
        label,
        helperText: schema.description,
        rawHelperText: schema.scDescriptionTranslationId ?? schema.description,
        type: getType(schema),
        onChange
    };

    const fieldProps: PropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-Field',
        elementKey: baseKey + '-Field'
    };
    const labelContainerProps: PropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-labelContainer',
        elementKey: baseKey + '-labelContainer'
    };
    const valueContainerProps: PropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-valueContainer',
        elementKey: baseKey + '-valueContainer'
    };

    const labelViewProps: PropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-labelView',
        elementKey: baseKey + '-labelView',
        contentChild: label,
    };

    const valueInputProps: PropertyProps & WrapperProps = {
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


const MapInput = ({ item, property, value, schema, type }: InputProps & PropertyProps): JSX.Element => {
    if ((!(value instanceof Map)) && (!isObservableMap(value))) throw new Error(`${callerAndfName()} value must be a map: ${JSON.stringify(value)}`);
    if (type !== 'map') throw new Error(`${callerAndfName()} type=${type} invalid, must be map`);
    if (typeof schema.additionalProperties !== 'object')
        throw new Error(`${callerAndfName()} schema.additionalProperties must be an object(Schema), ${typeof schema.additionalProperties} is not supported`);

    const baseKey = `${item.id}.${property}`;
    const containerKey = `${baseKey}-ContainerMap`;
    const itemSchema = schema.additionalProperties;
    const label = getLabel(item.parentProperty, schema);
    const mapKeys = Array.from(value.keys());

    return (
        <ContainerMap
            item={item}
            property={property}
            map={value}
            schema={schema}
            label={label}
            rawLabel={label}
            helperText={schema.description}
            rawHelperText={schema.scDescriptionTranslationId ?? schema.description}
            cacheId={containerKey}
            elementKey={containerKey}
            key={containerKey}
            >
            {mapKeys.map(mapKey =>
                <MapItemBuilder
                    setup={item}
                    property={property}
                    map={value}
                    mapKey={mapKey}
                    schema={itemSchema}
                    baseKey={`${baseKey}.${mapKey}`}
                    key={`${baseKey}-ItemBuilder.${mapKey}`}
                />
            )}
        </ContainerMap>
    );
};

export default MapInput;
