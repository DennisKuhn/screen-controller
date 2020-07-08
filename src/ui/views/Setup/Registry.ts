import { ChangeEvent, PropsWithChildren } from 'react';
import { SetupBase } from '../../../Setup/SetupBase';
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

    /** Item containing property */
    item: SetupBase;

    cacheId: string;

    /** Simplified schema of the object or property, same as item.getSimpleClassSchema()[.properties[property]]  */
    schema: ScSchema7;
    
    /** Either translated( schema.scDescriptionTranslationId ) or same a rawHelperText */
    helperText?: string;
    /** schema.scDescriptionTranslationId | schema.description */
    rawHelperText?: string;

    /** Either translated(schema.scTranslationId) or same as rawText */
    label: string;

    /** schema.scTranslationId | schema.title [| property] */
    rawLabel: string;
}

export interface ViewProps extends KeyProps {
    /** Either translated(schema.scTranslationId) or same as rawText */
    children: string;
}

export type FieldType = 'object' | 'array' | 'map' | 'checkbox' | 'color' | 'date' | 'datetime-local' | 'email' | 'file' | 'number' | 'password' | 'text' | 'time' | 'url';

export interface InputProps extends KeyProps {
    /**
     * Can be either used directly by an input element or called with a new value
     */
    onChange: (change: ChangeEvent | string | number | boolean ) => void;

    /** Possibly translated value or same as rawValue */
    value: string | number | boolean;

    type: FieldType;

    readOnly: boolean;
}

export interface LabelProps extends KeyProps {
    /** Either translated(schema.scTranslationId) or same as rawText */
    label: string;
}

export interface ObjectProps extends PropsWithChildren<BaseProps> {
}

export interface PropertyProps extends BaseProps {

    /** Property name in item */
    property: string;

    /** Possibly translated value or same as rawValue */
    value: string | number | boolean;

    /** item[property] */
    rawValue: string | number;

    readOnly: boolean;
}

export interface PropertyPropsWithChildren extends PropsWithChildren<PropertyProps> {

    /** Property name in item */
    property: string;

    /** Possibly translated value or same as rawValue */
    value: string | number | boolean;

    /** item[property] */
    rawValue: string | number;

    readOnly: boolean;
}

export enum Props {
    None = 0,
    Base = 1,
    Property = 2,
    View = 4,
    Input = 8,
    Label = 16
}

export type PropsType = KeyProps | PropertyProps | BaseProps | ViewProps | InputProps | LabelProps;
export type AllPropsType = KeyProps & PropertyProps & BaseProps & ViewProps & InputProps & LabelProps;

export type ObjectElement = React.ComponentType<BaseProps & React.ComponentProps<any>> | string;
export type PropertyElement = React.ComponentType<PropertyProps & React.ComponentProps<any>> | string;
export type PropertyElementWithChildren = React.ComponentType<PropertyPropsWithChildren & React.ComponentProps<any>> | string;

export type ElementType = ObjectElement | PropertyElement | PropertyElementWithChildren | null;
/**
 * Field[ LabelContainer[LabelView], ValueContainer[LabelView] ]
 */
export type Category = 'Object' | 'Array' | 'Map' | 'Field' | 'LabelContainer' | 'LabelView' | 'ValueContainer' | 'ValueInput';

export interface Entry {
    element: ElementType;
    props: Props;
}

export interface Registry {
    register(category: 'Object', typeName: string | undefined, element: null, props?: Props.None): void;
    register(category: 'Array', typeName: string | undefined, element: null, props?: Props.None): void;
    register(category: 'Map', typeName: string | undefined, element: null, props?: Props.None): void;
    register(category: 'Field', typeName: string | undefined, element: null, props?: Props.None): void;
    register(category: 'LabelContainer', typeName: string | undefined, element: null, props?: Props.None): void;
    register(category: 'LabelView', typeName: string | undefined, element: null, props?: Props.None): void;
    register(category: 'ValueContainer', typeName: string | undefined, element: null, props?: Props.None): void;
    register(category: 'ValueInput', typeName: string | undefined, element: null, props?: Props.None): void;

    register(category: 'Object', typeName: string | undefined, element: ObjectElement , props: Props.None | Props.Base): void;
    register(category: 'Array', typeName: string | undefined, element: ObjectElement, props: Props.None | Props.Base): void;
    register(category: 'Map', typeName: string | undefined, element: ObjectElement, props: Props.None | Props.Base): void;
    register(category: 'Field', typeName: string | undefined, element: PropertyElementWithChildren, props: Props.None | Props.Base | Props.Property): void;
    register(category: 'LabelContainer', typeName: string | undefined, element: PropertyElementWithChildren, props: Props.None | Props.Base | Props.Property): void;
    register(category: 'LabelView', typeName: string | undefined, element: PropertyElementWithChildren, props: Props.None | Props.Base | Props.Property | Props.View): void;
    register(category: 'ValueContainer', typeName: string | undefined, element: PropertyElementWithChildren, props: Props.None | Props.Base | Props.Property): void;
    register(category: 'ValueInput', typeName: string | undefined, element: PropertyElement,
        props: Props.None | Props.Base | Props.Property | Props.Input | Props.Label): void;
    
    get(category: Category, cacheId: string, keys: (string | undefined)[]): Entry;
}

const getName = (element: ElementType): string =>
    (element == null ? 'null' : typeof element == 'string' ? 'element' : (element.name ?? element.displayName ?? element.constructor?.name));

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
    register = (name: string | undefined, element: ElementType, props: Props): void => {
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
    register(category: Category, typeName: string | undefined, element: ElementType, props?: Props): void {
        console.debug(
            `${callerAndfName()}[${category}][${typeName ?? 'default'}]=${getName(element)} ` +
            `props=${props == undefined ? 'undefined=None' : Props[props]}`
        );
        this.registers[category].register.register(typeName, element, props ?? Props.None);
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
        console.debug(`${callerAndfName()}(${category}, ${cacheId}, [${keys.join()}])= element: ${getName(entry.element)}, props: ${Props[entry.props]}/${entry.props}`);
        return entry;
    };
}

const registry: Registry = new RegistryImplementation();

export default registry;