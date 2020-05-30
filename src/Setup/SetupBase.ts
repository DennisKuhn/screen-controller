import shortid from 'shortid';
import { JSONSchema7 } from 'json-schema';
import { ObservableSetupBaseMap } from './Container';
import { create, register } from './SetupFactory';
import { Dictionary } from 'lodash';
import Ajv, { ValidateFunction } from 'ajv';
import { action, observable, toJS } from 'mobx';
import { SetupItemId, SetupBaseInterface, PropertyType as InterfacePropertyType } from './SetupInterface';
import { remote } from 'electron';
import { UiSchema } from '@rjsf/core';

switch (process.type) {
    case 'browser': // Main
        shortid.worker(0);
        break;
    case 'renderer': {
        shortid.worker(remote.getCurrentWindow().id);
    }
        break;
    case 'worker':
        console.error(`SetupBase[${process.type}]: is not supported`);
        throw new Error(
            `SetupBase: process.type=${process.type} is not supported`
        );
        break;
}

export type PropertyType =
    SetupBase |
    ObservableSetupBaseMap<SetupBase> |
    string |
    number |
    boolean;


export interface SetupConstructor<SetupType extends SetupBase> {
    new(config: SetupBaseInterface): SetupType;
}

export abstract class SetupBase {    
    readonly id: SetupItemId;
    readonly parentId: SetupItemId;
    readonly className: string;
    readonly schema: JSONSchema7;
    readonly validator: ValidateFunction;

    _parent?: SetupBase;

    private static notSerialisedProperties = ['schema', 'validator', '_parent', 'parent'];

    static readonly schemaUri = 'https://github.com/maoriora/screen-controller/schemas/SetupSchema.json#';

    public static baseSchema: JSONSchema7 = {
        $id: SetupBase.name,
        type: 'object',
        properties: {
            id: {
                type: 'string'
            },
            parentId: {
                type: 'string'
            },
            className: {
                type: 'string'
            }
        },
        required: ['id', 'parentId', 'className']
    };

    public static activeSchema: JSONSchema7 = observable({
        // $schema: 'http://json-schema.org/draft/2019-09/schema#',
        $id: SetupBase.schemaUri,
        definitions: {
            SetupBase: SetupBase.baseSchema
        }
    });


    public static readonly uiSchema: UiSchema = {
        id: { 'ui:widget': 'hidden' },
        parentId: { 'ui:widget': 'hidden' },
        className: { 'ui:widget': 'hidden' },
        
    };

    public static ajv = new Ajv();

    public static readonly SCHEMA_REF = { $ref: SetupBase.name};

    protected static schemas: { [key: string]: JSONSchema7 } = {};
    private static validators: { [key: string]: ValidateFunction } = {};

    protected static addSchema(schema: JSONSchema7): void {
        if (!SetupBase.activeSchema.definitions) throw new Error(`SetupBase.addSchema(${schema.$id}) no definitions`);

        if (!schema.$id) throw new Error(`SetupBase.addSchema() no $id: ${JSON.stringify(schema)}`);

        if (schema.$id in SetupBase.activeSchema.definitions) {
            // console.log(`SetupBase.addSchema(${schema.$id}) already registered`, SetupBase.activeSchema.definitions[schema.$id], schema);
        } else {
            // console.log(`SetupBase.addSchema(${schema.$id}) @${Object.keys(SetupBase.activeSchema.definitions).length}`);
            SetupBase.activeSchema.definitions[schema.$id] = schema;

            SetupBase.schemas[schema.$id] = {
                definitions: SetupBase.activeSchema.definitions,
                $ref: '#/definitions/' + schema.$id
            };
        }
    }

    protected constructor(source: SetupBaseInterface) {
        if (source.id in SetupBase.instances)
            throw new Error(`SetupBase[${this.constructor.name}] id=${source.id} already in use`);

        if (!SetupBase.activeSchema.definitions)
            throw new Error(`SetupBase[${this.constructor.name}] no definitions in activeSchema: ${JSON.stringify(SetupBase.activeSchema)}`);

        if (!(source.className in SetupBase.schemas))
            throw new Error(`SetupBase[${this.constructor.name}] schema for ${source.className} in schemas: ${JSON.stringify(SetupBase.schemas)}`);

        if (this.constructor.name != source.className)
            if (this.constructor.name == 'Plugin') {
                // console.log(`SetupBase[${this.constructor.name}] for ${source.className}: ${JSON.stringify(source)}`);
            } else
                throw new Error(`SetupBase[${this.constructor.name}] does not match className=${source.className}: ${JSON.stringify(source)}`);

        this.schema = SetupBase.schemas[source.className];
        
        if (!(source.className in SetupBase.validators)) {
            console.log(`SetupBase[${this.constructor.name}] create validator for ${source.className}`, toJS( this.schema, {recurseEverything: true}));

            SetupBase.validators[source.className] = SetupBase.ajv.compile(this.schema);
        } else {
            // console.log(`SetupBase[${this.constructor.name}] validator exists for ${source.className}`);
        }
        
        this.validator = SetupBase.validators[source.className];

        if (this.validator(source) != true) {
            throw new Error(
                `SetupBase[${this.constructor.name}@${source.id}, ${source.className}]: Validation error:\n` +
                `${this.validator.errors?.map(
                    error => error.schemaPath + ' // ' + error.dataPath + ' @' + error.propertyName + ': ' + error.message + ':' + JSON.stringify(error.params)
                ).join(';\n')}\n` +
                `source:\n${JSON.stringify}`);
        }
        // console.log(`SetupBase[${this.constructor.name}@${source.id}, ${source.className}]: validated`);

        this.id = source.id;
        this.parentId = source.parentId;
        this.className = source.className;
        this._parent = SetupBase.instances[this.id];

        SetupBase.instances[this.id] = this;
    }


    get parent(): (SetupBase | undefined) {
        return SetupBase.instances[this.id];
    }


    protected static createMap<Setup extends SetupBase>(source: Dictionary<SetupBaseInterface>): ObservableSetupBaseMap<Setup> {
        const map = new ObservableSetupBaseMap<Setup>();

        for (const [id, plain] of Object.entries(source)) {
            if (plain) {
                // console.log(`SetupBase[${this.constructor.name}][${this.id}].createMap:[${id}]=create` /* , plain */);
                map.set(
                    id,
                    create(plain) as Setup
                );
            } else {
                // console.log(`SetupBase[${this.constructor.name}].createMap:[${id}] add null`);
                map.set(id, null);
            }
        }

        return map;
    }

    /**
     * Returns a shallow plain javascript object.
     * Child objects like screen, rectangle are included as plain.
     * Children/values in Maps are set to null.
     * This does only iterate/accesses keys of Maps,
     * value changes (like null to object) are ignored
     */
    getShallow(): SetupBaseInterface {
        const shallow: SetupBaseInterface = { id: this.id, parentId: this.parentId, className: this.className };

        for (const propertyName in this) {
            if (propertyName in shallow) {
                // console.log(`SetupBase[${this.constructor.name}].getShallow: ${propertyName} exists`);
            } else if (SetupBase.notSerialisedProperties.includes( propertyName ) ) {
                console.log(`SetupBase[${this.constructor.name}].getShallow: ignore ${propertyName}`);
            } else {
                const value = this[propertyName];
                switch (typeof value) {
                    case 'boolean':
                    case 'number':
                    case 'string':
                        // console.log(`SetupBase[${this.constructor.name}].getShallow: copy ${propertyName} of type ${typeof value}`);
                        shallow[propertyName as string] = value;
                        break;
                    case 'object':
                        if (value instanceof SetupBase) {
                            // console.log(`SetupBase[${this.constructor.name}].getShallow: copy ${propertyName} of SetupBase`);
                            shallow[propertyName as string] = value.getShallow();
                        } else if (value instanceof ObservableSetupBaseMap) {
                            // console.log(`SetupBase[${this.constructor.name}].getShallow: copy ${propertyName} of ObservableSetupBaseMap`);
                            shallow[propertyName as string] = {};
                            for (const id of value.keys()) {
                                shallow[propertyName as string][id] = null;
                            }
                        } else {
                            throw new Error(`SetupBase[${this.constructor.name}].getShallow: Invalid class type ${typeof value} for ${propertyName}`);
                        }
                        break;
                    case 'function':
                    case 'symbol':
                        console.warn(`SetupBase[${this.constructor.name}].getShallow: ignore ${propertyName} of type ${typeof value}`);
                        break;
                    case 'undefined':
                        // console.log(`SetupBase[${this.constructor.name}].getShallow: ignore ${propertyName} of type ${typeof value}`);
                        break;
                    case 'bigint':
                        throw new Error(`SetupBase[${this.constructor.name}].getShallow: Invalid type ${typeof value} for ${propertyName}`);
                    default:
                        throw new Error(`SetupBase[${this.constructor.name}].getShallow: Unkown type ${typeof value} for ${propertyName}`);
                }
            }
        }
        return shallow;
    }

    /**
    * Returns a deep plain javascript object.
    */
    getDeep(): SetupBaseInterface {
        return this.getPlain(-1);
    }

    getPlain(depth: number): SetupBaseInterface {
        const shallow: SetupBaseInterface = { id: this.id, parentId: this.parentId, className: this.className };

        for (const propertyName in this) {
            if (propertyName in shallow) {
                // console.log(`SetupBase[${this.constructor.name}].getPlain: ${propertyName} exists`);
            } else if (SetupBase.notSerialisedProperties.includes(propertyName)) {
                console.log(`SetupBase[${this.constructor.name}].getPlain: ignore ${propertyName}`);
            } else {
                const value = this[propertyName];
                switch (typeof value) {
                    case 'boolean':
                    case 'number':
                    case 'string':
                        // console.log(`SetupBase[${this.constructor.name}].getPlain: copy ${propertyName} of type ${typeof value}`);
                        shallow[propertyName as string] = value;
                        break;
                    case 'object':
                        if (value instanceof SetupBase) {
                            // console.log(`SetupBase[${this.constructor.name}].getPlain: copy ${propertyName} of SetupBase`);
                            shallow[propertyName as string] = value.getPlain(depth);
                        } else if (value instanceof ObservableSetupBaseMap) {
                            // console.log(`SetupBase[${this.constructor.name}].getPlain: copy ${propertyName} of ObservableSetupBaseMap`);
                            shallow[propertyName as string] = {};
                            for (const [id, child] of value.entries()) {
                                if (depth == 0) {
                                    shallow[propertyName as string][id] = null;
                                } else {
                                    shallow[propertyName as string][id] = (child as SetupBase).getPlain(depth - 1);
                                }
                            }
                        } else {
                            throw new Error(`SetupBase[${this.constructor.name}].getPlain: Invalid class type ${typeof value} for ${propertyName}`);
                        }
                        break;
                    case 'function':
                    case 'symbol':
                        console.warn(`SetupBase[${this.constructor.name}].getPlain: ignore ${propertyName} of type ${typeof value}`);
                        break;
                    case 'undefined':
                        // console.log(`SetupBase[${this.constructor.name}].getPlain: ignore ${propertyName} of type ${typeof value}`);
                        break;
                    case 'bigint':
                        throw new Error(`SetupBase[${this.constructor.name}].getPlain: Invalid type ${typeof value} for ${propertyName}`);
                    default:
                        throw new Error(`SetupBase[${this.constructor.name}].getPlain: Unkown type ${typeof value} for ${propertyName}`);
                }
            }
        }
        return shallow;
    }

    @action
    update(update: SetupBaseInterface): SetupBase {
        // console.log(`SetupBase[${this.constructor.name}][${this.id}].update`);

        if (update.id != this.id)
            throw new Error(`SetupBase[${this.constructor.name}][-> ${this.id} <-, ${this.parentId}, ${this.className}].update =`
                + ` { id: ${update.id}, parentId: ${this.parentId}, className: ${update.className} }`);
        if (update.parentId != this.parentId)
            throw new Error(`SetupBase[${this.constructor.name}][${this.id},-> ${this.parentId} <-, ${this.className}].update =`
                + ` { id: ${update.id}, parentId: ${this.parentId}, className: ${update.className} }`);
        if (update.className != this.className)
            throw new Error(`SetupBase[${this.constructor.name}][${this.id}, ${this.parentId}, -> ${this.className} <-].update =`
                + ` { id: ${update.id}, parentId: ${this.parentId}, className: ${update.className} }`);

        for (const propertyName in update) {
            const currentValue = this[propertyName];
            const newValue = update[propertyName];
            const currentType = typeof currentValue;
            const newType = typeof newValue;

            switch (newType) {
                case 'boolean':
                case 'number':
                case 'string':
                    if (currentValue != newValue) {
                        // console.log(`SetupBase[${this.constructor.name}].update:[${propertyName}/${typeof currentValue}]==${currentValue} = ${newValue}`);
                        this[propertyName] = newValue;
                    } else {
                        // console.log(`SetupBase[${this.constructor.name}].update:[${propertyName}/${typeof currentValue}]==${currentValue} == ${newValue}`);
                    }
                    break;
                case 'undefined':
                    throw new Error(`SetupBase[${this.constructor.name}].update:[${propertyName}/${currentType}]==${currentValue} = ${newValue}/${newType}`);
                case 'object':
                    if (currentValue instanceof ObservableSetupBaseMap) {
                        const map = currentValue as ObservableSetupBaseMap<SetupBase>;
                        const newMap = newValue as Dictionary<SetupBaseInterface>;

                        for (const [id, plainObject] of Object.entries(newMap)) {
                            const object = map.get(id);

                            if (plainObject) {
                                if (object) {
                                    // console.log(`SetupBase[${this.constructor.name}][${this.id}].update:[${propertyName}/Map][${id}].update` /* , plainObject */);
                                    object.update(plainObject);
                                } else {
                                    // console.log(`SetupBase[${this.constructor.name}][${this.id}].update:[${propertyName}/Map][${id}]=create` /* , plainObject */);
                                    currentValue.set(
                                        id,
                                        create(plainObject)
                                    );
                                }
                            } else if (!currentValue.has(id)) {
                                // console.log(`SetupBase[${this.constructor.name}].update:[${propertyName}/Map][${id}] add null`);
                                currentValue.set(id, null);
                            }
                        }
                        for (const deleted of map.keys()) {
                            if (!(deleted in newMap)) {
                                // console.log(`SetupBase[${this.constructor.name}][${this.id}].update:[${propertyName}/Map] delete ${deleted}`);
                                map.delete(deleted);
                            }
                        }
                    } else if ((newValue as SetupBaseInterface).id) {
                        const updateSetup = newValue as SetupBaseInterface;
                        if (currentValue?.id == updateSetup.id) {
                            // console.log(`SetupBase[${this.constructor.name}][${this.id}].update:[${propertyName}/Setup].update[${updateSetup.id}]` /*, updateSetup */);
                            currentValue.update(updateSetup);
                        } else {
                            // console.log(`SetupBase[${this.constructor.name}][${this.id}].update:[${propertyName}/Setup]=create[${updateSetup.id}]` /*, updateSetup */);
                            this[propertyName] = create(updateSetup);
                        }
                    } else {
                        throw new Error(`SetupBase[${this.constructor.name}][${this.id}].update:[${propertyName}/${currentType}]==${currentValue} = ${newValue}/${newType}`);
                    }
                    break;
                case 'function':
                case 'symbol':
                    console.warn(`SetupBase[${this.constructor.name}].update: ignore ${propertyName} ${currentValue}/${currentType}=${newValue}/${newType}`);
                    break;
                case 'bigint':
                    throw new Error(`SetupBase[${this.constructor.name}].update: Invalid for ${propertyName} ${currentValue}/${currentType}=${newValue}/${newType}`);
                default:
                    throw new Error(`SetupBase[${this.constructor.name}].update: Unkown for ${propertyName} ${currentValue}/${currentType}=${newValue}/${newType}`);
            }
        }

        // console.log(`SetupBase[${this.constructor.name}][${this.id}].update end`);

        return this;
    }

    static getPlainValue = (objectValue: PropertyType): InterfacePropertyType => {
        switch (typeof objectValue) {
            case 'boolean':
            case 'number':
            case 'string':
                return objectValue;
                break;
            case 'object':
                if (objectValue instanceof SetupBase) {
                    return objectValue.getShallow();
                } else if (objectValue instanceof ObservableSetupBaseMap) {
                    // console.log(`ControllerImpl[${this.constructor.name}].getPlainValue: copy ${propertyName} of ObservableSetupBaseMap`);

                    const shallow = {};
                    for (const id of objectValue.keys()) {
                        shallow[id] = null;
                    }
                    return shallow;
                }
                throw new Error(`SetupBase.getPlainValue(${objectValue}) not supported so far: ${typeof objectValue}`);
            default:
                throw new Error(`SetupBase.getPlainValue(${objectValue}) not supported so far: ${typeof objectValue}`);
        }
    }



    private static instances: { [index: string]: SetupBase } = {};

    public static getNewId(prefix: string): string {
        return prefix + '-' + shortid.generate();
    }

    protected static register<SetupClass extends SetupBase>(factory: SetupConstructor<SetupClass>, schema: JSONSchema7): void {
        if (!schema.$id) throw new Error(`SetupBase.register() no $id: ${JSON.stringify(schema)}`);

        // if (schema.$id != ('#' + factory.name))
        //     throw new Error(`SetupBase.register(): (Class name) #factory.name != schema.$id: #${factory.name} != ${schema.$id} schema=${JSON.stringify(schema)}`);
        SetupBase.addSchema(schema);

        if (schema.$id != factory.name) {
            console.warn(`SetupBase.register: register ${factory.name} as ${schema.$id}`);
            register(factory, schema.$id);
        } else {
            register(factory);
        }
    }
}
