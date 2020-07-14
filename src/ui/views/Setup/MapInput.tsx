import { Icon } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import { isObservableMap } from 'mobx';
import React from 'react';
import controller from '../../..//Setup/Controller/Factory';
import { ObservableSetupBaseMap } from '../../../Setup/Container';
import { ScSchema7 } from '../../../Setup/ScSchema7';
import { SetupBase } from '../../../Setup/SetupBase';
import { callerAndfName } from '../../../utils/debugging';
import {
    DeleteItem,
    Field,
    getLabel, getProspect, getType,
    LabelContainer, LabelView,
    NewContainer, NewItem,
    ValueContainer, ValueInput
} from './AbstractComponents';
import {
    ActionProps, ChangeEventArgs, InputProps,
    isChangeEvent,
    MapPropertyProps, MapPropsWithChildren,
    Options, PropertyProps,
    WrapperProps
} from './Shared';

const ContainerMap = (props: MapPropsWithChildren & WrapperProps): JSX.Element => getProspect('Map', props);


interface MapItemBuilderProps {
    mapKey: string;
    map: Map<string, SetupBase>;
    schema: ScSchema7;
    setup: SetupBase;
    property: string;
    baseKey: string;
    options: Options;
}

const getMapKeyLabel = (mapKey: string, schema: ScSchema7): string => schema.scTranslationId ?? schema.title ?? mapKey;

const MapItemBuilder = ({ map, mapKey, baseKey, property, schema, setup, options }: MapItemBuilderProps): JSX.Element => {
    if (schema.scHidden == true)
        throw new Error(`${callerAndfName()} ${baseKey} is hidden`);

    const onChange = (change: ChangeEventArgs): void => {
        const newValue = isChangeEvent(change) ? change.target.nodeValue : change;
        if (!(newValue instanceof SetupBase))
            throw new Error(`${callerAndfName()} type of newValue=${typeof newValue} isn't supported yet, it should be instance of SetupBase`);
        map.set(mapKey, newValue);
    };

    const label = getMapKeyLabel(mapKey, schema);

    if (!mapKey) throw new Error(`${callerAndfName()} ${mapKey} is invalid=${mapKey}`);

    const sharedProps/*: AllPropsType & MapPropertyProps*/ = {
        key: baseKey,
        item: setup,
        property,
        map,
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
        onChange,
        options
    };

    const fieldProps: MapPropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-Field',
        elementKey: baseKey + '-Field'
    };
    const labelContainerProps: MapPropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-labelContainer',
        elementKey: baseKey + '-labelContainer'
    };
    const valueContainerProps: MapPropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-valueContainer',
        elementKey: baseKey + '-valueContainer'
    };

    const labelViewProps: MapPropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-labelView',
        elementKey: baseKey + '-labelView',
        contentChild: label,
    };
    const deleteProps: MapPropertyProps & ActionProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-Delete',
        elementKey: baseKey + '-Delete',
        onClick: () => console.log(`${callerAndfName()} Click Delete ${label}`)
    };

    const valueInputProps: MapPropertyProps & WrapperProps = {
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
            <DeleteItem {...deleteProps} />
        </Field>
    );
};

const add = async (parentId: string, mapName: string, className: string): Promise<void> => {
    let parent = controller.tryGetSetupSync(parentId, 1);
    if (!parent) {
        console.debug(`${callerAndfName()}(${parentId}, ${mapName}, ${className}) can't get parent ${parentId}`);
        parent = await controller.getSetup(parentId, 1);
        if (!parent) throw new Error(`${callerAndfName()}(${parentId}, ${mapName}, ${className}) can't get parent ${parentId}`);
    }
    const map = parent[mapName] as ObservableSetupBaseMap<SetupBase>;
    if (!map) throw new Error(`${callerAndfName()}(${parentId}, ${mapName}, ${className}) can't get map ${mapName} in ${JSON.stringify(parent)}`);

    const newItem = SetupBase.createNew(className, parentId, mapName);

    console.debug(`${callerAndfName()}(${parentId}, ${mapName}, ${className}) created ${newItem.className}@${newItem.id} add to ${newItem.parentId}.${mapName}`);

    map.set(newItem.id, newItem);
    // console.log(`DictionaryTemplate[${parentId}.${mapName}].added ${newItem.className}@${newItem.id} in ${newItem.parentId}.${mapName}`);
};



const addSchemaItem = (parentId: string, mapName: string, newSchema: ScSchema7): void => {
    const className = (newSchema.properties?.className as ScSchema7)?.const;

    if (typeof className != 'string') throw new Error(`${callerAndfName()}(${parentId}, ${mapName}, ${newSchema.$id}) no className.const[string]: ${JSON.stringify(newSchema)}`);

    console.debug(`${callerAndfName()}(${parentId}, ${mapName}, ${newSchema.$id}) add ${className}`);

    add(parentId, mapName, className);
};


const MapInput = ({ item, property, value, schema, type, options }: InputProps & PropertyProps): JSX.Element => {
    if ((!(value instanceof Map)) && (!isObservableMap(value))) throw new Error(`${callerAndfName()} value must be a map: ${JSON.stringify(value)}`);
    if (type !== 'map') throw new Error(`${callerAndfName()} type=${type} invalid, must be map`);
    if (typeof schema.additionalProperties !== 'object')
        throw new Error(`${callerAndfName()} schema.additionalProperties must be an object(Schema), ${typeof schema.additionalProperties} is not supported`);

    const baseKey = `${item.id}.${property}`;
    const containerKey = `${baseKey}-ContainerMap`;
    const newContainerKey = `${baseKey}-NewContainerMap`;
    const itemSchema = schema.additionalProperties;
    const label = getLabel( undefined, property, schema);
    const mapKeys = Array.from(value.keys());
    const newLabel = getLabel( undefined, 'new', itemSchema);
    const newItems = itemSchema.oneOf ?? [itemSchema];
    const sharedProps = {
        item: item,
        property: property,
        map: value,
        options: options,
    };

    return (
        <ContainerMap
            {...sharedProps}
            schema={schema}
            label={label}
            rawLabel={label}
            helperText={schema.description}
            rawHelperText={schema.scDescriptionTranslationId ?? schema.description}
            cacheId={containerKey}
            elementKey={containerKey}
            key={containerKey}
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
                    const onNewClick = (): void => addSchemaItem(item.id, property, scSchema);

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
                        onClick={onNewClick}
                    />;
                }
                )
                }
            </NewContainer>
            {mapKeys.map(mapKey =>
                <MapItemBuilder
                    setup={item}
                    property={property}
                    map={value}
                    mapKey={mapKey}
                    schema={itemSchema}
                    baseKey={`${baseKey}.${mapKey}`}
                    key={`${baseKey}-ItemBuilder.${mapKey}`}
                    options={options}
                />
            )}
        </ContainerMap>
    );
};

export default MapInput;
