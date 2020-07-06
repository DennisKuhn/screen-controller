import { JSONSchema7 } from 'json-schema';
import { SetupBase } from '../../../Setup/SetupBase';
import { callerAndfName } from '../../../utils/debugging';
import { PropsWithChildren } from 'react';

export interface BaseProps {
    key: string;

    item: SetupBase;
    cacheId: string;

    /** Simplified schema of the object or property, same as item.getSimpleClassSchema().properties[property]  */
    schema: JSONSchema7;
}

export interface ObjectProps extends PropsWithChildren<BaseProps> {
}

export interface PropertyProps extends BaseProps {
    key: string;

    item: SetupBase;
    /** Property name in item */
    property: string;

    /** Either translated(schema.scTranslationId) or same as rawText */
    label: string | number;

    /** schema.scTranslationId | schema.title | property */
    rawLabel: string | number;

    /** Possibly translated value or same as rawValue */
    value: string | number;

    /** item[property] */
    rawValue: string | number;

}


export type PropsType = PropertyProps | BaseProps;

export type ObjectElement = React.ComponentType<BaseProps & React.ComponentProps<any>>;
export type PropertyElement = React.ComponentType<PropertyProps & React.ComponentProps<any>>;

export type ElementType = ObjectElement | PropertyElement | null;
/**
 * Field[ LabelContainer[LabelView], ValueContainer[LabelView] ]
 */
export type Category = 'Object' | 'Field' | 'LabelContainer' | 'LabelView' | 'ValueContainer' | 'ValueInput';


export interface Registry {
    register(category: 'Object', typeName: string | undefined, element: ObjectElement): void;
    register(category: 'Field', typeName: string | undefined, element: PropertyElement): void;
    register(category: 'LabelContainer', typeName: string | undefined, element: PropertyElement): void;
    register(category: 'LabelView', typeName: string | undefined, element: PropertyElement): void;
    register(category: 'ValueContainer', typeName: string | undefined, element: PropertyElement): void;
    register(category: 'ValueInput', typeName: string | undefined, element: PropertyElement): void;
}

class Register {
    default: ElementType | undefined;
    elements = new Map<string, ElementType>();

    /**
     * @param name if undefined us as default fallback, otherwise key
     * @param element a container element contructor/function
     * @example register( undefined,  GridContainer )
     * register( 'number', TextInput )
     */
    register = (name: string | undefined, element: ElementType): void => {
        const existingField = name == undefined ? this.default : this.elements.get(name);

        if (existingField) {
            console.warn(`${callerAndfName()} change [${name ?? 'default'}] from ${existingField.name} to ${element == null ? 'null' : element.name}`);
        } else {
            console.debug(`${callerAndfName()} [${name ?? 'default'}]=${element == null ? 'null' : element.name}`);
        }
        if (name == undefined) {
            this.default = element;
        } else {
            this.elements.set(name, element);
        }
    }

    get = (keys: (string | undefined)[]): ElementType => {
        let element: undefined | ElementType;

        for (
            let index = 0;
            index < keys.length && (element == undefined);
            index += 1
        ) {
            const key = keys[index];
            if (key !== undefined) {
                element = this.elements.get(key);
            }
        }
        if (element === undefined) {
            element = this.default;
        }
        if (element === undefined)
            throw new Error(`${callerAndfName()} no default for: ${keys.join(', ')}`);

        return element;
    }
}

class CategoryRecord {
    register = new Register();
    cache = new Map<string, ElementType>();
}

type Registers = {
    [key in Category]: CategoryRecord;
}

export class Registry {
    private registers: Registers = {
        Object: new CategoryRecord(),
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
    register(category: Category, typeName: string | undefined, element: ElementType): void {
        this.registers[category].register.register(typeName, element);
    }

    /**
     * 
     * @param category 
     * @param cacheId has to be unique within category
     * @param keys searched in order
     * @example get( 'Object', 'DigiTime-12', ['DigiTime', 'Plugin', 'SetupBase'] )
     */
    get = (category: Category, cacheId: string, keys: (string | undefined)[]): ElementType => {
        const register = this.registers[category];
        let element = register.cache.get(cacheId);

        if (element === undefined) {
            element = register.register.get(keys);
            register.cache.set(cacheId, element);
        }

        return element;
    };
}

const registry = new Registry();

export default registry;