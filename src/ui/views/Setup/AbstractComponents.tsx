import {
    PropsType,
    WrapperProps,
    PropsSelection,
    isBaseProps,
    isPropertyProps,
    PropertyProps,
    isInputProps,
    isLabelProps,
    LabelProps,
    Entry,
    Category,
    BaseProps,
    InputProps,
    FieldType
} from './Registry';
import { callerAndfName } from '../../../utils/debugging';
import React, { Fragment } from 'react';
import register from './Registry';
import { ScSchema7 } from '../../../Setup/ScSchema7';

export const getType = (schema: ScSchema7): FieldType => {
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
export const getLabel = (property: string, schema: ScSchema7): string => schema.scTranslationId ?? schema.title ?? property;



const getProps = (source: PropsType & WrapperProps, props: PropsSelection): PropsType => {
    let selectedProps: PropsType = { key: source.elementKey };

    if (props.includes('Base') || props.includes('Property')) {
        if (!isBaseProps(source)) throw new Error(`${callerAndfName()} source props areN'T BaseProps`);

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

    if (props.includes('Property')) {
        if (!isPropertyProps(source)) throw new Error(`${callerAndfName()} source props areN'T PropertyProps`);

        const propertyProps: PropertyProps = {
            ...(selectedProps as BaseProps),
            property: source.property,
            readOnly: source.readOnly,
            value: source.value,
            rawValue: source.rawValue,
        };
        selectedProps = propertyProps;
    }

    //     if (props.includes( 'View' )) { //<-- Handled in create() using contentChild

    if (props.includes('Input')) {
        if (!isInputProps(source)) throw new Error(`${callerAndfName()} source props areN'T InputProps`);

        const newProps: InputProps = {
            ...selectedProps,
            onChange: source.onChange,
            readOnly: source.readOnly,
            value: source.value,
            type: source.type,
        };
        //}
        selectedProps = newProps;
    }

    if (props.includes('Label')) {
        if (!isLabelProps(source)) throw new Error(`${callerAndfName()} source props areN'T LabelProps`);

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
        console.log(`${callerAndfName()}`, { entry, props, selected, children: props['children'], contentChild: props.contentChild });

        if ((props['children'] === undefined) && (props.contentChild === undefined)) {
            return React.createElement(entry.element, selected);
        } else {
            return React.createElement(entry.element, selected, props['children'], props.contentChild);
        }
    }
};


export const getProspect = (category: Category, props: BaseProps & WrapperProps): JSX.Element => {
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



export const LabelView = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('LabelView', props);

export const LabelContainer = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('LabelContainer', props);

export const ValueInput = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('ValueInput', props);

export const ValueContainer = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('ValueContainer', props);

export const Field = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('Field', props);
