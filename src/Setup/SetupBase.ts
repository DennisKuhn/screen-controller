import shortid from 'shortid';
import { JSONSchema7 } from 'json-schema';
import { ObservableSetupBaseMap } from './Container';
import { create, register } from './SetupFactory';
import { Dictionary } from 'lodash';
import Ajv, { ValidateFunction } from 'ajv';
import { observable, toJS } from 'mobx';
import { SetupItemId, SetupBaseInterface, PropertyType as InterfacePropertyType } from './SetupInterface';
import { remote } from 'electron';
import { UiSchema } from '@rjsf/core';
import deref from 'json-schema-deref-sync';
import mergeAllOf from 'json-schema-merge-allof';

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

interface ClassInfo {
    schema: JSONSchema7;
    uiSchema: UiSchema;
    plainSchema?: JSONSchema7;
    validate?: ValidateFunction;
}

export abstract class SetupBase {    
    readonly id: SetupItemId;
    readonly parentId: SetupItemId;
    readonly className: string;

    @observable name: string;

    private static notSerialisedProperties = [ '_parent', 'parent'];

    static readonly schemaUri = 'https://github.com/maoriora/screen-controller/schemas/SetupSchema.json#';

    public static baseSchema: JSONSchema7 = {
        $id: SetupBase.name,
        type: 'object',
        properties: {
            id: { type: 'string' },
            parentId: { type: 'string' },
            className: { type: 'string' },
            name: { type: 'string' }
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

    protected static infos: { [key: string]: ClassInfo } = {};


    protected static addSchema(schema: JSONSchema7): void {
        if (!SetupBase.activeSchema.definitions) throw new Error(`SetupBase.addSchema(${schema.$id}) no definitions`);

        if (!schema.$id) throw new Error(`SetupBase.addSchema() no $id: ${JSON.stringify(schema)}`);

        if (schema.$id in SetupBase.activeSchema.definitions) {
            // console.log(`SetupBase.addSchema(${schema.$id}) already registered`, SetupBase.activeSchema.definitions[schema.$id], schema);
        } else {
            console.log(`SetupBase.addSchema(${schema.$id}) @${Object.keys(SetupBase.activeSchema.definitions).length}`);
            SetupBase.activeSchema.definitions[schema.$id] = schema;

            if (schema.$id in SetupBase.infos)
                throw new Error(`SetupBase.addSchema(${schema.$id}) info already exists: ${JSON.stringify(SetupBase.infos)}`);

            SetupBase.infos[schema.$id] = {
                schema: {
                    definitions: SetupBase.activeSchema.definitions,
                    $ref: '#/definitions/' + schema.$id
                },
                uiSchema: SetupBase.uiSchema
            };
        }
    }

    private static fixRefs(item: JSONSchema7): JSONSchema7 {

        if (item.$ref) {
            if (item.$ref.startsWith('#/definitions/')) {
                // console.log(`${module.id}.fixRefs: skip ${item.$id} = ${item.$ref}`);
            } else {
                // console.log(`${module.id}.fixRefs: ${item.$id} ${item.$ref} => ${'#/definitions/' + item.$ref}`);
                item.$ref = '#/definitions/' + item.$ref;
            }
        }
        for (const child of Object.values(item)) {
            if (child instanceof Object) {
                SetupBase.fixRefs(child);
            }
        }

        return item;
    }


    private initClassInfo(source: SetupBaseInterface): ClassInfo {
        if (!(source.className in SetupBase.infos))
            throw new Error(`SetupBase[${this.constructor.name}].initClassInfo(${source.className}) no info: ${JSON.stringify(SetupBase.infos)}`);

        const info = SetupBase.infos[source.className];

        if (info.validate == undefined) {
            console.log(`SetupBase[${this.constructor.name}].initClassInfo(${source.className}) create validator` /*, toJS( this.schema, {recurseEverything: true})*/);

            info.validate = SetupBase.ajv.compile(info.schema);
        }

        return info;
    }    

    public getPlainSchema(): JSONSchema7 {
        if (!(this.className in SetupBase.infos))
            throw new Error(`SetupBase[${this.constructor.name}].getPlainSchema(${this.className}) no info: ${JSON.stringify(SetupBase.infos)}`);

        const info = SetupBase.infos[this.className];

        if (info.plainSchema == undefined) {
            const plainSchema = toJS(info.schema, { recurseEverything: true });
            SetupBase.fixRefs(plainSchema);

            const derefed = deref(plainSchema);

            if (derefed instanceof Error) {
                console.error(`SetupBase[${this.constructor.name}].getPlainSchema(${this.className}).resolved error: ${derefed}`, derefed, { ...plainSchema });   
            } else {
                console.log(`SetupBase[${this.constructor.name}].getPlainSchema(${this.className}).resolved schema:`, { ...derefed }, { ...plainSchema });

                info.plainSchema = mergeAllOf(derefed);

                console.log(
                    `SetupBase[${this.constructor.name}].getPlainSchema(${this.className}).merged schema:`,
                    { ...info.plainSchema }, { ...derefed }, { ...plainSchema });
            }            
        }
        if (info.plainSchema == undefined)
            throw new Error(`SetupBase[${this.constructor.name}][${this.className}]: no plainSchema`);
        
        return info.plainSchema;
    }

    protected constructor(source: SetupBaseInterface) {
        if (source.id in SetupBase.instances)
            throw new Error(`SetupBase[${this.constructor.name}] id=${source.id} already in use`);

        if (!SetupBase.activeSchema.definitions)
            throw new Error(`SetupBase[${this.constructor.name}] no definitions in activeSchema: ${JSON.stringify(SetupBase.activeSchema)}`);

        if (this.constructor.name != source.className)
            if (this.constructor.name == 'Plugin') {
                // console.log(`SetupBase[${this.constructor.name}] for ${source.className}: ${JSON.stringify(source)}`);
            } else
                throw new Error(`SetupBase[${this.constructor.name}] does not match className=${source.className}: ${JSON.stringify(source)}`);

        const info = this.initClassInfo(source);

        //TODO remove:> source.name = source.name ?? source.id;
        source.name = source.name ?? source.id;

        if (info.validate == undefined)
            throw new Error(`SetupBase[${this.constructor.name}@${source.id}, ${source.className}]: no validate`);

        if (info.validate(source) != true) {
            throw new Error(
                `SetupBase[${this.constructor.name}@${source.id}, ${source.className}]: Validation error:\n` +
                `${info.validate.errors?.map(
                    error => error.schemaPath + ' // ' + error.dataPath + ' @' + error.propertyName + ': ' + error.message + ':' + JSON.stringify(error.params)
                ).join(';\n')}\n` +
                `source:\n${JSON.stringify}`);
        }
        // console.log(`SetupBase[${this.constructor.name}@${source.id}, ${source.className}]: validated`);

        this.id = source.id;
        this.parentId = source.parentId;
        this.className = source.className;
        this.name = source.name;
        SetupBase.instances[this.id] = this;
    }

    get parent(): (SetupBase | undefined) {
        return SetupBase.instances[this.parentId];
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
        const shallow: SetupBaseInterface = { id: this.id, parentId: this.parentId, className: this.className, name: this.name };

        for (const propertyName in this) {
            if (propertyName in shallow) {
                // console.log(`SetupBase[${this.constructor.name}].getShallow: ${propertyName} exists`);
            } else if (SetupBase.notSerialisedProperties.includes( propertyName ) ) {
                // console.log(`SetupBase[${this.constructor.name}].getShallow: ignore ${propertyName}`);
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
                        // console.warn(`SetupBase[${this.constructor.name}].getShallow: ignore ${propertyName} of type ${typeof value}`);
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
        const shallow: SetupBaseInterface = { id: this.id, parentId: this.parentId, className: this.className, name: this.name };

        for (const propertyName in this) {
            if (propertyName in shallow) {
                // console.log(`SetupBase[${this.constructor.name}].getPlain: ${propertyName} exists`);
            } else if (SetupBase.notSerialisedProperties.includes(propertyName)) {
                // console.log(`SetupBase[${this.constructor.name}].getPlain: ignore ${propertyName}`);
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
                        // console.warn(`SetupBase[${this.constructor.name}].getPlain: ignore ${propertyName} of type ${typeof value}`);
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

    protected static createNewInterface(className: string, parentId: SetupItemId, id?: SetupItemId): SetupBaseInterface {
        id = id == undefined ? SetupBase.getNewId(className) : id;

        return {
            id,
            parentId,
            className,
            name: id,
        };     
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
