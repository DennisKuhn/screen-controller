import { ChangeEvent, PropsWithChildren } from 'react';
import { ScSchema7 } from '../../../Setup/ScSchema7';
import { SetupBase } from '../../../Setup/SetupBase';
import { PropertyType } from '../../../Setup/SetupInterface';

export interface Options {
    ignoreViewOnly: boolean;
}

/** Can be used by any component, e.g. Input, Label, View, ... */
export interface KeyProps {
    key: string;
}

/** Used by components knowing this */
export interface CommonProps extends KeyProps {
    options: Options;
    cacheId: string;
}

export const isCommonProps = (prop: PropsType): prop is CommonProps =>
    ((prop as CommonProps).options !== undefined);
export type CommonPropsWithChildren = PropsWithChildren<CommonProps>;

/** Used by wrapper components to pass through key and children */
export interface WrapperProps extends CommonProps {
    elementKey: string;
    contentChild?: string | JSX.Element;
}

export interface SchemaProps extends CommonProps {
    
}

/** Props from item level used (e.g. only RootElement doesn't get this) */
export interface BaseProps extends CommonProps {

    /** Item containing property, array or map */
    item: SetupBase;

    /** Simplified schema of the object, array, map or property  */
    schema: ScSchema7;

    /** Either translated( schema.scDescriptionTranslationId ) or same a rawHelperText */
    helperText?: string;
    /** schema.scDescriptionTranslationId | schema.description */
    rawHelperText?: string;

    /** Either translated(schema.scTranslationId) or same as rawLabel */
    label: string;

    /** schema.scTranslationId | schema.title [| property[| index ][| key]] */
    rawLabel: string;
}
export type BasePropsWithChildren = PropsWithChildren<BaseProps>;
export const isBaseProps = (prop: PropsType): prop is BaseProps =>
    ((prop as BaseProps).item !== undefined);

/** Used by views like label, that has the text content as child */
export interface ViewProps extends KeyProps {
    /** Either translated(schema.scTranslationId) or same as rawText */
    children: string;
}

export interface ActionProps extends KeyProps {
    /**
     * Can be either used directly by an input element or called with a new value
     */
    onClick: () => void;
}
export const isActionProps = (prop: PropsType): prop is ActionProps =>
    ((prop as ActionProps).onClick !== undefined);

export interface IconProps extends KeyProps {
    /** default icon */
    children: JSX.Element;
}

export type { PropertyType } from '../../../Setup/SetupBase';

export type FieldType = 'object' | 'array' | 'map' | 'checkbox' | 'color' | 'date' | 'datetime-local' | 'email' | 'file' | 'number' | 'password' | 'text' | 'time' | 'url';

export type ChangeEventArgs = ChangeEvent | PropertyType;
export type ChangeHandler = (change: ChangeEventArgs) => void;
export const isChangeEvent = (event: ChangeEventArgs): event is ChangeEvent => typeof event == 'object' && 'target' in event;

/** Used for component dealing with the actual value.
 *  Must be controlled, e.g. always display value and call onChange with new value */
export interface InputProps extends KeyProps {
    /**
     * Can be either used directly by an input element or called with a new value
     */
    onChange: ChangeHandler;

    /** Possibly translated value or same as rawValue */
    value: PropertyType;

    type: FieldType;

    readOnly: boolean;
}

export const isInputProps = (prop: PropsType): prop is InputProps =>
    ((prop as InputProps).type !== undefined) &&
    ((prop as InputProps).onChange !== undefined);

export interface LabelProps extends KeyProps {
    /** Either translated(schema.scTranslationId) or same as rawText */
    label: string;
}
export const isLabelProps = (prop: PropsType): prop is LabelProps =>
    ((prop as LabelProps).label !== undefined);

export interface ObjectProps extends BaseProps {
}

export type ObjectPropsWithChildren = PropsWithChildren<ObjectProps>;

export interface ArrayProps extends BaseProps {
    /** Property name in item, e.g. item[propertyName] == array */
    property: string;
    array: Array<any>;
}
export type ArrayPropsWithChildren = PropsWithChildren<ArrayProps>;

export interface MapProps extends BaseProps {
    /** Property name in item, e.g. item[propertyName] == map */
    property: string;
    map: Map<string, SetupBase>;
}
export type MapPropsWithChildren = PropsWithChildren<MapProps>;

export interface PropertyProps extends BaseProps {

    /** Property name in item */
    property: string;

    /** Possibly translated value or same as rawValue */
    value: PropertyType;

    /** item[property] */
    rawValue: PropertyType;

    readOnly: boolean;
}
export type PropertyPropsWithChildren = PropsWithChildren<PropertyProps>;
export const isPropertyProps = (prop: PropsType): prop is PropertyProps =>
    ((prop as PropertyProps).property !== undefined) &&
    ('value' in prop) &&
    ((prop as PropertyProps).readOnly !== undefined);

export interface MapPropertyProps extends PropertyProps, MapProps {
    mapKey: string;
}
export type MapPropertyPropsWithChildren = PropsWithChildren<MapPropertyProps>;

export interface ArrayPropertyProps extends PropertyProps, ArrayProps {
    index: number;
}
export type ArrayPropertyPropsWithChildren = PropsWithChildren<ArrayPropertyProps>;

export type Props = 'None' | 'Base' | 'Property' | 'View' | 'Input' | 'Action' | 'Icon' | 'Label' | 'Object' | 'Array' | 'Map';
export type PropsSelection<Allowed extends Props = Props> = Extract<Props, Allowed>[];

export type PropsType =
    KeyProps | PropertyProps | ArrayPropertyProps | MapPropertyProps | BaseProps |
    ViewProps | InputProps | IconProps | ActionProps | LabelProps | ObjectProps | ArrayProps | MapProps;
export type AllPropsType =
    KeyProps & PropertyProps & ArrayPropertyProps & MapPropertyProps & BaseProps &
    ViewProps & InputProps & IconProps & ActionProps & LabelProps & ObjectProps & ArrayProps & MapProps;

export type ObjectElement = React.ComponentType<ObjectPropsWithChildren & React.ComponentProps<any>> | string;
export type ArrayElement = React.ComponentType<ArrayPropsWithChildren & React.ComponentProps<any>> | string;
export type MapElement = React.ComponentType<MapPropsWithChildren & React.ComponentProps<any>> | string;
export type PropertyElement = React.ComponentType<PropertyProps & React.ComponentProps<any>> | string;
export type PropertyElementWithChildren = React.ComponentType<PropertyPropsWithChildren & React.ComponentProps<any>> | string;

export type ElementType = ObjectElement | ArrayElement | MapElement | PropertyElement | PropertyElementWithChildren | null;
