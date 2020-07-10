import { ChangeEvent, PropsWithChildren } from 'react';
import { SetupBase, PropertyType } from '../../../Setup/SetupBase';
import { callerAndfName } from '../../../utils/debugging';
import { ScSchema7 } from 'src/Setup/ScSchema7';

export interface KeyProps {
    key: string;
}

export interface WrapperProps extends KeyProps {
    elementKey: string;
    contentChild?: string;
}

export interface BaseProps extends KeyProps {

    /** Item containing property, array or map */
    item: SetupBase;

    cacheId: string;

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
    ((prop as BaseProps).cacheId !== undefined);


export interface ViewProps extends KeyProps {
    /** Either translated(schema.scTranslationId) or same as rawText */
    children: string;
}

export type { PropertyType } from '../../../Setup/SetupBase';

export type FieldType = 'object' | 'array' | 'map' | 'checkbox' | 'color' | 'date' | 'datetime-local' | 'email' | 'file' | 'number' | 'password' | 'text' | 'time' | 'url';

export type ChangeEventArgs = ChangeEvent | PropertyType;
export type ChangeHandler = (change: ChangeEventArgs) => void;
export const isChangeEvent = (event: ChangeEventArgs): event is ChangeEvent => typeof event == 'object' && 'target' in event;

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

export type Props = 'None' | 'Base' | 'Property' | 'View' | 'Input' | 'Label' | 'Object' | 'Array' | 'Map';
export type PropsSelection<Allowed extends Props = Props> = Extract<Props, Allowed>[];

export type PropsType = KeyProps | PropertyProps | BaseProps | ViewProps | InputProps | LabelProps | ObjectProps | ArrayProps | MapProps;
export type AllPropsType = KeyProps & PropertyProps & BaseProps & ViewProps & InputProps & LabelProps;

export type ObjectElement = React.ComponentType<ObjectPropsWithChildren & React.ComponentProps<any>> | string;
export type ArrayElement = React.ComponentType<ArrayPropsWithChildren & React.ComponentProps<any>> | string;
export type MapElement = React.ComponentType<MapPropsWithChildren & React.ComponentProps<any>> | string;
export type PropertyElement = React.ComponentType<PropertyProps & React.ComponentProps<any>> | string;
export type PropertyElementWithChildren = React.ComponentType<PropertyPropsWithChildren & React.ComponentProps<any>> | string;

export type ElementType = ObjectElement | ArrayElement | MapElement | PropertyElement | PropertyElementWithChildren | null;
/**
 * Field[ LabelContainer[LabelView], ValueContainer[LabelView] ]
 */
export type Category = 'Root' | 'Object' | 'Array' | 'Map' | 'Field' | 'LabelContainer' | 'LabelView' | 'ValueContainer' | 'ValueInput';

export interface Entry {
    element: ElementType;
    props: PropsSelection;
}

type TypeName = string | undefined;
type TypeNames = TypeName | (TypeName[]);

export interface Registry {
    register(category: 'Root', typeName: TypeNames, element: null, props?: PropsSelection<'None'>): void;
    register(category: 'Object', typeName: TypeNames, element: null, props?: PropsSelection<'None'>): void;
    register(category: 'Array', typeName: TypeNames, element: null, props?: PropsSelection<'None'>): void;
    register(category: 'Map', typeName: TypeNames, element: null, props?: PropsSelection<'None'>): void;
    register(category: 'Field', typeName: TypeNames, element: null, props?: PropsSelection<'None'>): void;
    register(category: 'LabelContainer', typeName: TypeNames, element: null, props?: PropsSelection<'None'>): void;
    register(category: 'LabelView', typeName: TypeNames, element: null, props?: PropsSelection<'None'>): void;
    register(category: 'ValueContainer', typeName: TypeNames, element: null, props?: PropsSelection<'None'>): void;
    register(category: 'ValueInput', typeName: TypeNames, element: null, props?: PropsSelection<'None'>): void;

    register(category: 'Root', typeName: TypeNames, element: ObjectElement, props: PropsSelection<'None'>): void;
    register(category: 'Object', typeName: TypeNames, element: ObjectElement, props: PropsSelection<'None' | 'Base'>): void;
    register(category: 'Array', typeName: TypeNames, element: ArrayElement, props: PropsSelection<'None' | 'Base'>): void;
    register(category: 'Map', typeName: TypeNames, element: MapElement, props: PropsSelection<'None' | 'Base'>): void;
    register(category: 'Field', typeName: TypeNames, element: PropertyElementWithChildren, props: PropsSelection<'None' | 'Base' | 'Property'>): void;
    register(category: 'LabelContainer', typeName: TypeNames, element: PropertyElementWithChildren, props: PropsSelection<'None' | 'Base' | 'Property'>): void;
    register(category: 'LabelView', typeName: TypeNames, element: PropertyElementWithChildren, props: PropsSelection<'None' | 'Base' | 'Property' | 'View'>): void;
    register(category: 'ValueContainer', typeName: TypeNames, element: PropertyElementWithChildren, props: PropsSelection<'None' | 'Base' | 'Property'>): void;
    register(category: 'ValueInput', typeName: TypeNames, element: PropertyElement,
        props: PropsSelection<'None' | 'Base' | 'Property' | 'Input' | 'Label'>): void;

    get(category: Category, cacheId: string, keys: (string | undefined)[]): Entry;
}

const getName = (element: ElementType): string =>
    (element == null ? 'null' : typeof element == 'string' ? 'element' : (element.name ?? element.displayName ?? element.constructor?.name));

const getNamesArray = (names: TypeNames): TypeName[] => names === undefined ? [undefined] : (typeof names == 'string' ? [names] : names);

class Register {
    default: Entry | undefined;
    elements = new Map<string, Entry>();

    /**
     * @param name if undefined us as default fallback, otherwise key
     * @param element a container element contructor/function
     * @param props selector
     * @example register( undefined,  GridContainer )
     * register( 'number', TextInput )
     */
    register = (names: TypeNames, element: ElementType, props: PropsSelection): void => {
        for (const name of getNamesArray(names)) {
            const existingField = name == undefined ? this.default : this.elements.get(name);

            if (existingField) {
                console.warn(`${callerAndfName()} change [${name ?? 'default'}] from ${getName(existingField.element)} to ${getName(element)}`);
            } else {
                // console.debug(`${callerAndfName()} [${name ?? 'default'}]=${element == null ? 'null' : element.name}`);
            }
            if (name == undefined) {
                this.default = { element, props };
            } else {
                this.elements.set(name, { element, props });
            }
        }
    }

    get = (keys: (string | undefined)[]): Entry => {
        let entry: undefined | Entry;

        for (
            let index = 0;
            index < keys.length && (entry === undefined);
            index += 1
        ) {
            const key = keys[index];
            if (key !== undefined) {
                entry = this.elements.get(key);
            }
        }
        if (entry === undefined) {
            entry = this.default;
        }
        if (entry === undefined)
            throw new Error(`${callerAndfName()} no default for: ${keys.join(', ')}`);

        return entry;
    }
}

class CategoryRecord {
    register = new Register();
    cache = new Map<string, Entry>();
}

type Registers = {
    [key in Category]: CategoryRecord;
}

class RegistryImplementation implements Registry {
    private registers: Registers = {
        Root: new CategoryRecord(),
        Object: new CategoryRecord(),
        Array: new CategoryRecord(),
        Map: new CategoryRecord(),
        Field: new CategoryRecord(),
        LabelContainer: new CategoryRecord(),
        LabelView: new CategoryRecord(),
        ValueContainer: new CategoryRecord(),
        ValueInput: new CategoryRecord()
    };

    /**
     * @param category Field[ LabelContainer[LabelView], ValueContainer[LabelView] ]
     * @param typeName if undefined us as default fallback, otherwise schema.$id, schema.type
     * @param element a container element contructor/function
     * @example register( 'Field', undefined, GridContainer )
     * register( 'LabelContainer', undefined, GridItem )
     * register( 'LabelView', undefined, Typography )
     * register( 'ValueContainer', undefined, GridItem )
     * register( 'ValueInput', undefined, TextInput )
     * register( 'ValueInput', 'number', TextInput )
     */
    register(category: Category, typeNames: TypeNames, element: ElementType, props?: PropsSelection): void {
        console.debug(
            `${callerAndfName()}[${category}][${getNamesArray(typeNames).join()}]=${getName(element)} ` +
            `props=${props == undefined ? 'undefined=None' : props.join()}`
        );
        this.registers[category].register.register(typeNames, element, props === undefined ? ['None'] : props);
    }

    /**
     * 
     * @param category 
     * @param cacheId has to be unique within category
     * @param keys searched in order
     * @example get( 'Object', 'DigiTime-12', ['DigiTime', 'Plugin', 'SetupBase'] )
     */
    get = (category: Category, cacheId: string, keys: (string | undefined)[]): Entry => {
        const register = this.registers[category];
        let entry = register.cache.get(cacheId);

        if (entry === undefined) {
            entry = register.register.get(keys);
            register.cache.set(cacheId, entry);
        }
        console.debug(`${callerAndfName()}(${category}, ${cacheId}, [${keys.join()}])= element: ${getName(entry.element)}, props: ${entry.props.join()}`);
        return entry;
    };
}

const registry: Registry = new RegistryImplementation();

export default registry;