import React, { Fragment } from 'react';
import { ScSchema7 } from '../../../Setup/ScSchema7';
import { SetupBase } from '../../../Setup/SetupBase';
import { callerAndfName } from '../../../utils/debugging';
import register, { Category, ElementType, PropertyProps, BaseProps, ObjectProps } from './Registry';

interface Props {
    setup: SetupBase;
}

const create = (prospect: ElementType, props: BaseProps): JSX.Element =>
    prospect ? React.createElement(prospect, props) : <Fragment />;


const getProspect = (category: Category, props: BaseProps): JSX.Element =>
    create(
        register.get(
            category,
            props.cacheId,
            [props.schema.$id, Array.isArray(props.schema.type) ? props.schema.type[0] : props.schema.type]
        ), props);


const LabelView = (props: PropertyProps): JSX.Element => getProspect('LabelView', props);

const LabelContainer = (props: PropertyProps): JSX.Element => getProspect('LabelContainer', props);

const ValueInput = (props: PropertyProps): JSX.Element => getProspect('ValueInput', props);

const ValueContainer = (props: PropertyProps): JSX.Element => getProspect('ValueContainer', props);

const Field = (props: PropertyProps): JSX.Element => getProspect('Field', props);

const ContainerObject = (props: ObjectProps): JSX.Element => getProspect('Object', props);

const getLabel = (property: string, schema: ScSchema7): string => schema.scTranslationId ?? schema.title ?? property;

interface FieldBuilderProps {
    property: string;
    schema: ScSchema7;
    setup: SetupBase;
}

const FieldBuilder = ({ property, schema, setup }: FieldBuilderProps): JSX.Element => {
    if (schema.scHidden == true)
        throw new Error(`${callerAndfName()} ${setup.id}.${property} is hidden`);

    const baseKey = `${setup.id}.${property}`;
    const sharedProps = {
        item: setup,
        rawLabel: getLabel(property, schema),
        label: getLabel(property, schema),
        property,
        schema,
        rawValue: String(setup[property]),
        value: String(setup[property]),
        cacheId: baseKey,
    };

    const fieldProps: PropertyProps = {
        ...sharedProps,
        key: baseKey + '-Field'
    };

    const labelContainerProps: PropertyProps = {
        ...sharedProps,
        key: baseKey + '-labelContainer'
    };

    const valueContainerProps: PropertyProps = {
        ...sharedProps,
        key: baseKey + '-valueContainer'
    };

    const labelViewProps: PropertyProps = {
        ...sharedProps,
        key: baseKey + '-labelView'
    };

    const valueInputProps: PropertyProps = {
        ...sharedProps,
        key: baseKey + '-valueInput'
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

const SetupGrid = ({ setup }: Props): JSX.Element => {
    const schema = setup.getSimpleClassSchema();
    const properties = schema.properties;
    const key = setup.id + '-object';

    if (properties == undefined) throw new Error(`${callerAndfName()}(${setup.id}/${setup.className}) no properties in simpleSchema`);

    const visibkeProperties = Object.entries(properties)
        .filter(([, schema]) =>
            typeof schema == 'object' && (schema as ScSchema7).scHidden !== true);

    //        <ContainerObject key={key} item={setup} cacheId={key}>

    return (
        <ContainerObject key={key} item={setup} cacheId={key} schema={schema}>
            {
                visibkeProperties.map(([property, schema]) =>
                    <FieldBuilder key={`${setup.id}.${property}-Builder`} setup={setup} property={property} schema={schema as ScSchema7} />
                )
            }
        </ContainerObject>
    );
};

export default SetupGrid;
