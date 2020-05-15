import { SetupBase } from './SetupBase';
import { SetupBaseInterface } from './SetupBaseInterface';
import { create } from './SetupFactory';
import { ObservableSetupBaseMap } from './Container';
import { JSONSchema7 } from 'json-schema';
import { Dictionary } from 'lodash';

export abstract class SetupItem extends SetupBase {
    constructor(source: SetupBaseInterface, schema: JSONSchema7) {
        super(source, schema);
    }
    /**
     * Returns a plain javascript object.
     */
    getShallow(): SetupBaseInterface {
        return this.getPlain(0);
    }

    getPlain(depth: number): SetupBaseInterface {
        const shallow = super.getShallow();
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
                                    shallow[propertyName][id] = (child as SetupItem).getPlain(depth - 1);
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

    getDeep(): SetupBaseInterface {
        return this.getPlain(-1);
    }

    update(update: SetupBaseInterface): SetupItem {
        super.update(update);
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
}
