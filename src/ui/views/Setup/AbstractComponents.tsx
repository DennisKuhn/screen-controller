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
    BaseProps,
    InputProps,
    FieldType,
    CommonProps,
    AllPropsType,
    isActionProps,
    ActionProps,
    MapPropsWithChildren,
    BasePropsWithChildren,
    ArrayPropsWithChildren
} from './Shared';
import { Entry, Category } from './Registry';

import { callerAndfName } from '../../../utils/debugging';
import React, { Fragment } from 'react';
import register from './Registry';
import { ScSchema7 } from '../../../Setup/ScSchema7';

export const getType = (schema: ScSchema7): FieldType => {
    let type: FieldType | undefined;

    if (schema.oneOf) {
        if (schema.oneOf.length < 1)
            throw new Error(`${callerAndfName()} oneOf.length=${schema.oneOf.length} not supported (yet): ${JSON.stringify(schema)}`);
        
        // Get type from oneOfs and ensure it's same type
        schema.oneOf.forEach(option => {
            if (typeof option !== 'object' )
                throw new Error(`${callerAndfName()} oneOf option is not a object/schema, not supported (yet), option=${JSON.stringify(option)} schema=${JSON.stringify(schema)}`);

            const optionType = getType(option);
            if ((type !== undefined) && (type !== optionType))
                throw new Error(`${callerAndfName()} different types in OneOf not supported (yet) ${type} != ${optionType}: ${JSON.stringify(schema)}`);
            type = optionType;
        });
    } else {
        if (!schema.type) throw new Error(`${callerAndfName()} no type in schema: ${JSON.stringify(schema)}`);

        switch (schema.type) {
            case 'number':
            case 'array':
                type = schema.type;
                break;
            case 'boolean': type = 'checkbox'; break;
            case 'string':
                switch (schema.scFormat) {
                    case undefined:
                        switch (schema.format) {
                            case 'email':
                            case 'date':
                            case 'time':
                                type = schema.format; break;
                            case undefined: type = 'text'; break;
                            case 'uri': type = 'url'; break;
                            case 'date-time': type = 'datetime-local'; break;
                            default:
                                throw new Error(`${callerAndfName()} format=${schema.format} not supported (yet) in ${schema}`);
                        }
                        break;
                    case 'color':
                    case 'password':
                        type = schema.scFormat;
                        break;
                    case 'localFile':
                        type = 'file';
                        break;
                    case 'localFolder':
                        type = 'folder';
                        break;
                    default:
                        throw new Error(`${callerAndfName()} scFormat=${schema.scFormat} not supported (yet) in ${schema}`);
                }
                break;
            case 'object':
                if (typeof schema.additionalProperties == 'object') {
                    type = 'map';
                } else {
                    type = 'object';
                }
                break;
            default:
                type = 'text';
                console.error(`${callerAndfName()} type=${schema.type} no yet supported: ${JSON.stringify(schema)}`);
                // throw new Error(`${callerAndfName()} type=${schema.type} no yet supported: ${JSON.stringify(schema)}`);
                break;
        }
    }
    if (type === undefined) throw new Error(`${callerAndfName()} can't find a type in schema: ${JSON.stringify(schema)}`);
    return type;
};

export const getLabel = (name: string | undefined, property: string, schema: ScSchema7): string =>
    name ?? schema.scTranslationId ?? schema.title ?? property;

/**
 * Make all properties in T as boolean
 */
type Flags<T> = {
    [P in keyof T]: boolean;
};

const allProps: Flags<AllPropsType & WrapperProps> = {
    array: true,
    index: true,
    cacheId: true,
    contentChild: true,
    children: true,
    elementKey: true,    
    item: true,
    key: true,
    label: true,
    map: true,
    mapKey: true,
    onChange: true,
    onClick: true,
    options: true,
    property: true,
    rawLabel: true,
    rawValue: true,
    readOnly: true,
    schema: true,
    type: true,
    value: true,
    helperText: true,
    rawHelperText: true
};

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
            options: source.options,
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
    //     if (props.includes( 'Icon' )) { //<-- Handled in create() using contentChild

    if (props.includes('Action')) {
        if (!isActionProps(source)) throw new Error(`${callerAndfName()} source props areN'T ActionProps`);

        const newProps: ActionProps = {
            ...selectedProps,
            onClick: source.onClick,
            // children: source.children, //<-- Handled in create() using contentChild
        };

        selectedProps = newProps;
    }
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
    for (const prop in source) {
        if ((!(prop in selectedProps)) && (!(prop in allProps))) {
            console.log(`${callerAndfName()}(${props.join()}) add unkown prop ${prop}=${source[prop]} `, { prop, source, selectedProps, props });
            selectedProps[prop] = source[prop];
        }
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


export const getProspect = (category: Category, props: CommonProps & WrapperProps): JSX.Element => {
    if (isBaseProps(props)) {
        console.log(`${callerAndfName()}(${category}, ${props.cacheId})`, props);
        const schemas = props.schema.scAllOf ?? [props.schema.$id, props.schema.scAbstract?.$id];
        const types = Array.isArray(props.schema.type) ? props.schema.type : [props.schema.type];
        return create(
            register.get(
                category,
                props.cacheId,
                [
                    props.schema.enum ? 'enum' : undefined,
                    ...schemas,
                    props['type'],
                    ...types,
                ]
            ), props);
    } else {
        console.warn(`${callerAndfName()}(${category}, {${Object.keys(props).join()}}) no schema`);

        return create(
            register.get(
                category,
                props.cacheId,
                []
            ), props);
    }
};



export const LabelView = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('LabelView', props);

export const LabelContainer = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('LabelContainer', props);

export const ValueInput = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('ValueInput', props);

export const ValueContainer = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('ValueContainer', props);

export const Field = (props: PropertyProps & WrapperProps): JSX.Element => getProspect('Field', props);
export const NewContainer = (props: (MapPropsWithChildren | ArrayPropsWithChildren) & WrapperProps): JSX.Element => getProspect('NewContainer', props);
export const NewItem = (props: BasePropsWithChildren & ActionProps & WrapperProps): JSX.Element => getProspect('NewItem', props);
export const DeleteItem = (props: PropertyProps & ActionProps & WrapperProps): JSX.Element => getProspect('DeleteItem', props);
