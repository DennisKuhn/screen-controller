import { JSONSchema7 } from 'json-schema';
import { ObservableSetupBaseMap } from './Container';
import { create, register } from './SetupFactory';
import { Dictionary } from 'lodash';
import Ajv, { ValidateFunction } from 'ajv';
import { action } from 'mobx';
import { SetupItemId, SetupBaseInterface } from './SetupInterface';

export interface SetupConstructor<SetupType extends SetupBase> {
    new(config: SetupBaseInterface): SetupType;
}

export abstract class SetupBase {
    readonly id: SetupItemId;
    readonly parentId: SetupItemId;
    readonly className: string;

    static readonly schemaUri = 'https://github.com/DennisKuhn/screen-controller/schemas/SetupSchema.json#';

    public static activeSchema: JSONSchema7 = {
        // $schema: 'http://json-schema.org/draft/2019-09/schema#',
        $id: SetupBase.schemaUri,
        definitions: {
            SetupBase: {
                $id: '#' + SetupBase.name,
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
            }
        }
    };
    private static ajv = new Ajv();
    private static validate: ValidateFunction | undefined;


    protected static addSchema(schema: JSONSchema7): void {
        if (!SetupBase.activeSchema.definitions) throw new Error(`SetupBase.addSchema(${schema.$id}) no definitions`);

        if (!schema.$id) throw new Error(`SetupBase.addSchema() no $id: ${JSON.stringify(schema)}`);

        const schemaName = schema.$id.substr(1);

        if (schemaName in SetupBase.activeSchema.definitions) {
            // console.warn(`SetupBase.addSchema(${schema.$id}) already registered (${schemaName})`, SetupBase.activeSchema.definitions[schema.$id], schema);
        } else {
            console.log(`SetupBase.addSchema(${schema.$id}) @${Object.keys(SetupBase.activeSchema.definitions).length}`);
            SetupBase.activeSchema.definitions[schemaName] = schema;

            if (SetupBase.validate != undefined) {
                console.warn(`SetupBase.addSchema(${schema.$id}) already compiled`, schema, SetupBase.activeSchema);
                SetupBase.validate = undefined;
                // SetupBase.validate = SetupBase.ajv.compile(SetupBase.activeSchema);
            }
        }
    }

    constructor(source: SetupBaseInterface) {
        if (SetupBase.usedIDs.includes(source.id))
            throw new Error(`SetupBase[${this.constructor.name}] id=${source.id} already in use`);
        
        if (!SetupBase.activeSchema.definitions)
            throw new Error(`SetupBase[${this.constructor.name}] no definitions in activeSchema: ${JSON.stringify(SetupBase.activeSchema)}`);

        if (this.constructor.name != source.className)
            throw new Error(`SetupBase[${this.constructor.name}] does not match className=${source.className}: ${JSON.stringify(source)}`);
        
        if (SetupBase.validate == undefined) {
            console.log(`SetupBase[${this.constructor.name}] compile schema`, SetupBase.activeSchema);
            SetupBase.validate = SetupBase.ajv.compile(SetupBase.activeSchema);
        }

        try {
            const valid = SetupBase.ajv.validate(SetupBase.schemaUri + '/definitions/' + source.className, source);

            if (!valid) {
                console.error(
                    `SetupBase[${this.constructor.name}@${source.id}, ${source.className}]: Validation error:\n` +
                    `${SetupBase.ajv.errors?.map(
                        error => error.schemaPath + ' // ' + error.dataPath + ' @' + error.propertyName + ': ' + error.message + ':' + JSON.stringify(error.params)
                    ).join(';\n')}\n`,
                    source,
                    { ...SetupBase.ajv.errors });
                throw new Error(
                    `SetupBase[${this.constructor.name}@${source.id}, ${source.className}]: Validation error:\n` +
                    `${SetupBase.ajv.errors?.map(
                        error => error.schemaPath + ' // ' + error.dataPath + ' @' + error.propertyName + ': ' + error.message + ':' + JSON.stringify(error.params)
                    ).join(';\n')}\n` +
                    `source:\n${JSON.stringify}`);
            } else {
                console.log( `SetupBase[${this.constructor.name}@${source.id}, ${source.className}]: validated` );
            }
        } catch (e) {
            console.error(`SetupBase[${this.constructor.name}@${source.id}, ${source.className}]: Validation exception: ${e.message}`, source, { ...e });
        }


        this.id = source.id;
        this.parentId = source.parentId;
        this.className = source.className;
        SetupBase.usedIDs.push(this.id);
    }

    /**
     * Returns a shallow(ish) plain javascript object.
     * Child objects like screen, rectangle are included as plain.
     * Children/values in Maps are set to null.
     * This does only iterate/accesses keys of Maps,
     * value changes (like null to object) are ignored
     */
    getShallow(): SetupBaseInterface {
        const shallow: SetupBaseInterface = { id: this.id, parentId: this.parentId, className: this.className };

        for (const propertyName in this) {
            if (propertyName in shallow) {
                // console.log(`${this.constructor.name}.getShallow: ${propertyName} exists`);
            } else {
                const value = this[propertyName];
                switch (typeof value) {
                    case 'boolean':
                    case 'number':
                    case 'string':
                        // console.log(`${this.constructor.name}.getShallow: copy ${propertyName} of type ${typeof value}`);
                        shallow[propertyName as string] = value;
                        break;
                    case 'object':
                        if (value instanceof SetupBase) {
                            // console.log(`${this.constructor.name}.getShallow: copy ${propertyName} of SetupBase`);
                            shallow[propertyName as string] = value.getShallow();
                        } else if (value instanceof ObservableSetupBaseMap) {
                            // console.log(`${this.constructor.name}.getShallow: copy ${propertyName} of ObservableSetupBaseMap`);
                            shallow[propertyName as string] = {};
                            for (const id of value.keys()) {
                                shallow[propertyName as string][id] = null;
                            }
                        } else {
                            throw new Error(`${this.constructor.name}.getShallow: Invalid class type ${typeof value} for ${propertyName}`);
                        }
                        break;
                    case 'function':
                    case 'symbol':
                        console.log(`${this.constructor.name}.getShallow: ignore ${propertyName} of type ${typeof value}`);
                        break;
                    case 'undefined':
                        console.log(`${this.constructor.name}.getShallow: ignore ${propertyName} of type ${typeof value}`);
                        break;
                    case 'bigint':
                        throw new Error(`${this.constructor.name}.getShallow: Invalid type ${typeof value} for ${propertyName}`);
                    default:
                        throw new Error(`${this.constructor.name}.getShallow: Unkown type ${typeof value} for ${propertyName}`);
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
                // console.log(`${this.constructor.name}.getShallow: ${propertyName} exists`);
            } else {
                const value = this[propertyName];
                switch (typeof value) {
                    case 'boolean':
                    case 'number':
                    case 'string':
                        // console.log(`${this.constructor.name}.getShallow: copy ${propertyName} of type ${typeof value}`);
                        shallow[propertyName as string] = value;
                        break;
                    case 'object':
                        if (value instanceof SetupBase) {
                            // console.log(`${this.constructor.name}.getShallow: copy ${propertyName} of SetupBase`);
                            shallow[propertyName as string] = value.getShallow();
                        } else if (value instanceof ObservableSetupBaseMap) {
                            // console.log(`${this.constructor.name}.getShallow: copy ${propertyName} of ObservableSetupBaseMap`);
                            shallow[propertyName as string] = {};
                            for (const [id, child] of value.entries()) {
                                if (depth == 0) {
                                    shallow[propertyName as string][id] = null;
                                } else {
                                    shallow[propertyName as string][id] = (child as SetupBase).getPlain(depth - 1);
                                }
                            }
                        } else {
                            throw new Error(`${this.constructor.name}.getPlain: Invalid class type ${typeof value} for ${propertyName}`);
                        }
                        break;
                    case 'function':
                    case 'symbol':
                        console.log(`${this.constructor.name}.getPlain: ignore ${propertyName} of type ${typeof value}`);
                        break;
                    case 'undefined':
                        console.log(`${this.constructor.name}.getPlain: ignore ${propertyName} of type ${typeof value}`);
                        break;
                    case 'bigint':
                        throw new Error(`${this.constructor.name}.getPlain: Invalid type ${typeof value} for ${propertyName}`);
                    default:
                        throw new Error(`${this.constructor.name}.getPlain: Unkown type ${typeof value} for ${propertyName}`);
                }
            }
        }
        return shallow;
    }

    @action
    update(update: SetupBaseInterface): SetupBase {
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
                        // console.log(`${this.constructor.name}.update:[${propertyName}/${typeof currentValue}]==${currentValue} = ${newValue}`);
                        this[propertyName] = newValue;
                    } else {
                        // console.log(`${this.constructor.name}.update:[${propertyName}/${typeof currentValue}]==${currentValue} == ${newValue}`);
                    }
                    break;
                case 'undefined':
                    throw new Error(`${this.constructor.name}.update:[${propertyName}/${currentType}]==${currentValue} = ${newValue}/${newType}`);
                case 'object':
                    if (currentValue instanceof ObservableSetupBaseMap) {
                        for (const [id, plainObject] of Object.entries(newValue)) {
                            const object = currentValue.get(id);
                            if (plainObject) {
                                if (object) {
                                    // console.log(`${this.constructor.name}.update:[${propertyName}/Map][${id}].update`, plainObject);
                                    object.update(plainObject);
                                } else {
                                    // console.log(`${this.constructor.name}.update:[${propertyName}/Map][${id}]=create`, plainObject);
                                    currentValue.set(
                                        id,
                                        create(plainObject as SetupBaseInterface)
                                    );
                                }
                            } else if (!currentValue.has(id)) {
                                // console.log(`${this.constructor.name}.update:[${propertyName}/Map][${id}] add null`);
                                currentValue.set(id, null);
                            }
                        }
                        for (const deleted of currentValue.keys()) {
                            if (!(deleted in (newValue as Dictionary<SetupBaseInterface>))) {
                                console.log(`${this.constructor.name}.update:[${propertyName}/Map] delete ${deleted}`);
                                currentValue.delete(deleted);
                            }
                        }
                    } else if ((newValue as SetupBaseInterface).id) {
                        const updateSetup = newValue as SetupBaseInterface;
                        if (currentValue?.id == updateSetup.id) {
                            // console.log(`${this.constructor.name}.update:[${propertyName}/Setup].update[${updateSetup.id}]`, updateSetup);
                            currentValue.update(updateSetup);
                        } else {
                            // console.log(`${this.constructor.name}.update:[${propertyName}/Setup]=create[${updateSetup.id}]`, updateSetup);
                            this[propertyName] = create(updateSetup);
                        }
                    } else {
                        throw new Error(`${this.constructor.name}.update:[${propertyName}/${currentType}]==${currentValue} = ${newValue}/${newType}`);
                    }
                    break;
                case 'function':
                case 'symbol':
                    console.log(`${this.constructor.name}.update: ignore ${propertyName} ${currentValue}/${currentType}=${newValue}/${newType}`);
                    break;
                case 'bigint':
                    throw new Error(`${this.constructor.name}.update: Invalid for ${propertyName} ${currentValue}/${currentType}=${newValue}/${newType}`);
                default:
                    throw new Error(`${this.constructor.name}.update: Unkown for ${propertyName} ${currentValue}/${currentType}=${newValue}/${newType}`);
            }
        }
        return this;
        
    }

    static usedIDs = new Array<string>();

    public static getNewId<SetupType extends SetupBase>(classConstructor: SetupConstructor<SetupType>): string {
        let id = 0;
        return SetupBase.usedIDs.reduce((result: string, usedId: string): string => {
            const parts = usedId.split('-');
            if ((parts.length == 2) && (parts[0] == classConstructor.name)) {
                const usedIdNumber = Number(parts[1]);
                id = usedIdNumber >= id ? usedIdNumber + 1 : id;
            }
            return `${classConstructor.name}-${id}`;
        });
    }

    protected static register<SetupClass extends SetupBase>(factory: SetupConstructor<SetupClass>, schema: JSONSchema7 ): void {
        if (!schema.$id) throw new Error(`SetupBase.register() no $id: ${JSON.stringify(schema)}`);

        // if (schema.$id != ('#' + factory.name))
        //     throw new Error(`SetupBase.register(): (Class name) #factory.name != schema.$id: #${factory.name} != ${schema.$id} schema=${JSON.stringify(schema)}`);
        SetupBase.addSchema(schema);

        if (schema.$id != ('#' + factory.name)) {
            console.warn(`SetupBsae.register: register ${factory.name} as ${schema.$id.substr(1)}`);
            register(factory, schema.$id.substr(1));
        } else {
            register(factory);
        }
    }
}
