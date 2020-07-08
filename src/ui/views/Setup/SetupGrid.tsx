import React, { Fragment, ChangeEvent } from 'react';
import { ScSchema7 } from '../../../Setup/ScSchema7';
import { SetupBase } from '../../../Setup/SetupBase';
import { callerAndfName } from '../../../utils/debugging';
import register, { Category, PropertyProps, BaseProps, ObjectProps, Entry, Props, PropsType, InputProps, LabelProps, AllPropsType, FieldType, WrapperProps } from './Registry';

interface SetupGridProps {
    setup: SetupBase;
}

const getProps = (source: PropsType & WrapperProps, props: Props): PropsType => {
    let selectedProps: PropsType = { key: source.elementKey };

    if (props & Props.Base || props & Props.Property) {
        if (!('cacheId' in source)) throw new Error(`${callerAndfName()} sourceProps lacking cacheId`);

        const baseProps: BaseProps = {
            ...selectedProps,
            cacheId: source.cacheId,
            helperText: source.helperText,
            rawHelperText: source.rawHelperText,
            item: source.item,
            label: source.label,
            rawLabel: source.rawLabel,
            schema: source.schema,
        };
        selectedProps = baseProps;
    }

    if (props & Props.Property) {
        if (!('property' in source)) throw new Error(`${callerAndfName()} sourceProps lacking property`);

        const propertyProps: PropertyProps = {
            ...(selectedProps as BaseProps),
            property: source.property,
            readOnly: source.readOnly,
            value: source.value,
            rawValue: source.rawValue,
        };
        selectedProps = propertyProps;
    }

    //     if (props & Props.View) {
    //         if (!('children' in source)) throw new Error(`${callerAndfName()} sourceProps lacking children`);

    //         const viewProps: ViewProps = {
    //             ...selectedProps,
    // //            children: source.children,
    //         };
    //         selectedProps = viewProps;
    //     }

    if (props & Props.Input) {
        if (!('type' in source)) throw new Error(`${callerAndfName()} sourceProps lacking type`);

        const newProps: InputProps = {
            ...selectedProps,
            onChange: source.onChange,
            readOnly: source.readOnly,
            value: source.value,
            type: source.type,
        };
        selectedProps = newProps;
    }

    if (props & Props.Label) {
        if (!('label' in source)) throw new Error(`${callerAndfName()} sourceProps lacking label`);

        const newProps: LabelProps = {
            ...selectedProps,
            label: source.label,
        };
        selectedProps = newProps;
    }
    return selectedProps;
};

const create = (entry: Entry, props: PropsType & WrapperProps): JSX.Element => {

    if (entry.element == null) {
        return <Fragment key={props.elementKey}>{props['children']}</Fragment>;
    } else {
        const selected = getProps(props, entry.props);
        console.log(`${callerAndfName()}`, { entry, props, selected, children: props['children'], contentChild: props.contentChild});
        return React.createElement(entry.element, selected, props['children'], props.contentChild);
    }
};


const getProspect = (category: Category, props: BaseProps & WrapperProps): JSX.Element => {
    const schemas = props.schema.scAllOf ?? [props.schema.$id];
    const types = Array.isArray(props.schema.type) ? props.schema.type : [props.schema.type];
    return create(
        register.get(
            category,
            props.cacheId,
            [
                ...schemas,
                props['type'],
                ...types,
            ]
        ), props);
};

const LabelView = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('LabelView', props);

const LabelContainer = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('LabelContainer', props);

const ValueInput = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('ValueInput', props);

const ValueContainer = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('ValueContainer', props);

const Field = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('Field', props);

const ContainerObject = (props: ObjectProps & WrapperProps): JSX.Element => getProspect('Object', props);

const getLabel = (property: string, schema: ScSchema7): string => schema.scTranslationId ?? schema.title ?? property;

interface FieldBuilderProps {
    property: string;
    schema: ScSchema7;
    setup: SetupBase;
}

const getType = (schema: ScSchema7): FieldType => {
    if (!schema.type) throw new Error(`${callerAndfName()} no type in schema: ${JSON.stringify(schema)}`);
    let type: FieldType;

    switch (schema.type) {
        case 'boolean':
            type = 'checkbox';
            break;
        case 'string':
            type = 'text';
            break;
        case 'number':
            type = 'number';
            break;
        case 'object':
            if (typeof schema.additionalProperties == 'object') {
                type = 'map';
            } else {
                type = 'object';
            }
            break;
        case 'array':
            type = 'array';
            break;
        default:
            type = 'text';
            console.error(`${callerAndfName()} type=${schema.type} no yet supported: ${JSON.stringify(schema)}`);
            // throw new Error(`${callerAndfName()} type=${schema.type} no yet supported: ${JSON.stringify(schema)}`);
            break;
    }

    return type;
};

const FieldBuilder = ({ property, schema, setup }: FieldBuilderProps): JSX.Element => {
    if (schema.scHidden == true)
        throw new Error(`${callerAndfName()} ${setup.id}.${property} is hidden`);

    const onChange = (change: ChangeEvent | string | number | boolean): void => {
        if (typeof change == 'object') {
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

const SetupGrid = ({ setup }: SetupGridProps): JSX.Element => {
    const schema = setup.getSimpleClassSchema() as ScSchema7;
    const properties = schema.properties;
    const key = setup.id + '-object';
    const label = getLabel(setup.parentProperty, schema);

    if (properties == undefined) throw new Error(`${callerAndfName()}(${setup.id}/${setup.className}) no properties in simpleSchema`);

    const visibleProperties = Object.entries(properties)
        .filter(([, schema]) =>
            typeof schema == 'object' && (schema as ScSchema7).scHidden !== true);

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

export default SetupGrid;
