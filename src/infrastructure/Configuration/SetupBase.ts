import { SetupItemId, SetupBaseInterface } from './SetupBaseInterface';
import { JSONSchema7, validate } from 'json-schema';
import { ObservableSetupBaseMap } from './Container';
import { create, register } from './SetupFactory';
import { Dictionary, omit } from 'lodash';

export interface SetupConstructor<SetupType extends SetupBase> {
    new(config: SetupBaseInterface): SetupType;
}

export abstract class SetupBase {
    readonly id: SetupItemId;
    readonly parentId: SetupItemId;
    readonly className: string;

    public static activeSchema: JSONSchema7 = {
        $schema: 'http://json-schema.org/draft/2019-09/schema#',
        $id: 'https://github.com/DennisKuhn/screen-controller/schemas/SetupSchema.json',
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

    protected static addSchema(schema: JSONSchema7): void {
        if (!SetupBase.activeSchema.definitions) throw new Error(`SetupBase.addSchema(${schema.$id}) no definitions`);

        if (!schema.$id) throw new Error(`SetupBase.addSchema() no $id: ${JSON.stringify(schema)}`);

        if (schema.$id in SetupBase.activeSchema.definitions) {
            console.warn(`SetupBase.addSchema(${schema.$id}) already registered`, SetupBase.activeSchema.definitions[schema.$id], schema);
        } else {
            SetupBase.activeSchema.definitions[schema.$id] = schema;
        }
    }

    constructor(source: SetupBaseInterface) {
        if (SetupBase.usedIDs.includes(source.id))
            throw new Error(`SetupBase[${this.constructor.name}] id=${source.id} already in use`);
        
        if (!SetupBase.activeSchema.definitions)
            throw new Error(`SetupBase[${this.constructor.name}] no definitions in activeSchema: ${JSON.stringify(SetupBase.activeSchema)}`);

        if (this.constructor.name != source.className)
            throw new Error(`SetupBase[${this.constructor.name}] does not match className=${source.className}: ${JSON.stringify(source)}`);
        
        const schema = SetupBase.activeSchema.definitions[source.className];

        //const validation = validate(source, schema as JSONSchema7);
        const validation = validate(source, SetupBase.activeSchema);

        if (!validation.valid) {
            throw new Error(
                `SetupBase[${this.constructor.name}@${source.id}]: Validation errors:\n` +
                `${validation.errors.map(error => error.property + ':' + error.message).join(';\n')} `);
        }

        const invalidSource = { ...omit(source, 'id', 'parentId'), className: 'InvalidClassName' };

        const invalidation1 = validate(invalidSource, SetupBase.activeSchema);

        console.warn(
            `SetupBase[${this.constructor.name}@${source.id}]: Invalid1 errors:${invalidation1.valid}:\n` +
            `${invalidation1.errors.map(error => error.property + ':' + error.message).join(';\n')} `);

        const invalidation2 = validate(invalidSource, schema as JSONSchema7);

        console.warn(
            `SetupBase[${this.constructor.name}@${source.id}]: Invalid2 errors:${invalidation2.valid}:\n` +
            `${invalidation2.errors.map(error => error.property + ':' + error.message).join(';\n')} `);

        this.id = source.id;
        this.parentId = source.parentId;
        this.className = source.className;
        SetupBase.usedIDs.push(this.id);
    }

    /**
     * Returns a shallow(ish) plain javascript object.
     * Children/values in Maps are set to null
     */
    getShallow(): SetupBaseInterface {
        return this.getPlain(0);
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
                console.log(`${this.constructor.name}.getShallow: ${propertyName} exists`);
            } else {
                const value = this[propertyName];
                switch (typeof value) {
                    case 'boolean':
                    case 'number':
                    case 'string':
                        console.log(`${this.constructor.name}.getShallow: copy ${propertyName} of type ${typeof value}`);
                        shallow[propertyName] = value;
                        break;
                    case 'object':
                        if (value instanceof SetupBase) {
                            console.log(`${this.constructor.name}.getShallow: copy ${propertyName} of SetupBase`);
                            shallow[propertyName] = value.getShallow();
                        } else if (value instanceof ObservableSetupBaseMap) {
                            console.log(`${this.constructor.name}.getShallow: copy ${propertyName} of ObservableSetupBaseMap`);
                            shallow[propertyName as string] = {};
                            for (const [id, child] of value.entries()) {
                                if (depth == 0) {
                                    shallow[propertyName][id] = null;
                                } else {
                                    shallow[propertyName][id] = (child as SetupBase).getPlain(depth - 1);
                                }
                            }
                        } else {
                            throw new Error(`${this.constructor.name}.getShallow: Invalid class type ${typeof value} for ${propertyName}`);
                        }
                        break;
                    case 'function':
                    case 'symbol':
                        console.log(`${this.constructor.name}.getShallow: ignore ${propertyName} of type ${typeof value}`);
                        break;
                    case 'bigint':
                    case 'undefined':
                        throw new Error(`${this.constructor.name}.getShallow: Invalid type ${typeof value} for ${propertyName}`);
                    default:
                        throw new Error(`${this.constructor.name}.getShallow: Unkown type ${typeof value} for ${propertyName}`);
                }
            }
        }
        return shallow;
    }

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
                        console.log(`${this.constructor.name}.update:[${propertyName}/${typeof currentValue}]==${currentValue} = ${newValue}`);
                        this[propertyName] = newValue;
                    } else {
                        console.log(`${this.constructor.name}.update:[${propertyName}/${typeof currentValue}]==${currentValue} == ${newValue}`);
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
                                    console.log(`${this.constructor.name}.update:[${propertyName}/Map][${id}].update`, plainObject);
                                    object.update(plainObject);
                                } else {
                                    console.log(`${this.constructor.name}.update:[${propertyName}/Map][${id}]=create`, plainObject);
                                    currentValue.set(
                                        id,
                                        create(plainObject as SetupBaseInterface)
                                    );
                                }
                            } else if (!currentValue.has(id)) {
                                console.log(`${this.constructor.name}.update:[${propertyName}/Map][${id}] add null`);
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
                            console.log(`${this.constructor.name}.update:[${propertyName}/Setup].update[${updateSetup.id}]`, updateSetup);
                            currentValue.update(updateSetup);
                        } else {
                            console.log(`${this.constructor.name}.update:[${propertyName}/Setup]=create[${updateSetup.id}]`, updateSetup);
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

        if (schema.$id != factory.name)
            throw new Error(`SetupBase.register(): (Class name) factory.name != schema.$id: ${factory.name} != ${schema.$id} schema=${JSON.stringify(schema)}`);

        SetupBase.addSchema(schema);
        register(factory);
    }
}
