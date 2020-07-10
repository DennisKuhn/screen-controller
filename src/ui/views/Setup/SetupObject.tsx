import React from 'react';
import { ScSchema7 } from '../../../Setup/ScSchema7';
import { SetupBase } from '../../../Setup/SetupBase';
import { callerAndfName } from '../../../utils/debugging';
import {
    AllPropsType,
    PropertyProps,
    WrapperProps,
    ChangeEventArgs,
    isChangeEvent,
    ObjectPropsWithChildren} from './Registry';
import { getProspect, Field, LabelContainer, LabelView, ValueContainer, ValueInput, getLabel, getType } from './AbstractComponents';



const ContainerObject = (props: ObjectPropsWithChildren & WrapperProps): JSX.Element => getProspect('Object', props);

interface FieldBuilderProps {
    property: string;
    schema: ScSchema7;
    setup: SetupBase;
}


const FieldBuilder = ({ property, schema, setup }: FieldBuilderProps): JSX.Element => {
    if (schema.scHidden == true)
        throw new Error(`${callerAndfName()} ${setup.id}.${property} is hidden`);

    const onChange = (change: ChangeEventArgs): void => {
        if (isChangeEvent(change)) {
            setup[property] = change.target.nodeValue;
        } else {
            setup[property] = change;
        }
    };

    const label = getLabel(property, schema);

    const baseKey = `${setup.id}.${property}`;
    const sharedProps: AllPropsType = {
        key: baseKey,
        item: setup,
        rawLabel: label,
        label,
        property,
        schema,
        rawValue: setup[property],
        value: setup[property],
        cacheId: baseKey,
        readOnly: schema.readOnly === true || schema.scViewOnly === true,
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


interface SetupObjectProps {
    setup: SetupBase;
}

const SetupObject = ({ setup }: SetupObjectProps): JSX.Element => {
    if (setup === undefined)
        throw new Error(`${callerAndfName} No setup object`);
    if (!setup.getSimpleClassSchema)
        throw new Error(`${callerAndfName} Not a setup object: ${JSON.stringify(setup)}`);

    const schema = setup.getSimpleClassSchema() as ScSchema7;
    const properties = schema.properties;
    const key = setup.id + '-object';
    const label = getLabel(setup.parentProperty, schema);

    if (properties == undefined) throw new Error(`${callerAndfName()}(${setup.id}/${setup.className}) no properties in simpleSchema`);

    const visibleProperties = Object.entries(properties)
        .filter(([, schema]) =>
            typeof schema == 'object' && (schema as ScSchema7).scHidden !== true)
        .sort(([, schemaA], [, schemaB]) => {
            if (typeof schemaA == 'object' && schemaA.type === 'object')
                return 1;
            if (typeof schemaB == 'object' && schemaB.type === 'object')
                return -1;
            return 0;
        }
        );

    //        <ContainerObject key={key} item={setup} cacheId={key}>

    return (
        <ContainerObject
            key={key}
            elementKey={key}
            item={setup}
            cacheId={key}
            schema={schema}
            label={label}
            rawLabel={label}
            helperText={schema.description}
            rawHelperText={schema.scDescriptionTranslationId ?? schema.description}
            >
            {
                visibleProperties.map(([property, schema]) =>
                    <FieldBuilder key={`${setup.id}.${property}-Builder`} setup={setup} property={property} schema={schema as ScSchema7} />
                )
            }
        </ContainerObject>
    );
};


export default SetupObject;
