import { SetupBase } from './SetupBase';
import { SetupBaseInterface } from './SetupBaseInterface';
import { create } from './SetupFactory';
import { SetupItemInterface } from './SetupItemInterface';
import { ObservableSetupBaseMap } from './Container';

export abstract class SetupItem extends SetupBase {
    constructor(source: SetupItemInterface) {
        super(source);

        // this.update(source);
    }
    /**
     * Returns a plain javascript object.
     */
    getShallow(): SetupItemInterface {
        return this.getPlain(0);
    }

    getPlain(depth: number): SetupItemInterface {
        const shallow = super.getShallow();
        for (const propertyName in this) {
            if (propertyName in shallow) {
                console.log(`${this.constructor.name}.getShallow: ${propertyName} exists`);
            } else {
                const value = this[propertyName];
                switch (typeof value) {
                    case 'bigint':
                    case 'boolean':
                    case 'number':
                    case 'string':
                    case 'undefined':
                        console.log(`${this.constructor.name}.getShallow: copy ${propertyName} of type ${typeof value}`);
                        shallow[propertyName as string] = value;
                        break;
                    case 'object':
                        if (value instanceof SetupBase) {
                            console.log(`${this.constructor.name}.getShallow: copy ${propertyName} of SetupBase`);
                            shallow[propertyName as string] = value.getShallow();
                        } else if (value instanceof Map) {
                            console.warn(`${this.constructor.name}.getShallow: copy ${propertyName} of Map`);
                            for (const [id /*, child*/] of value.entries()) {
                                shallow[propertyName as string][id] = null;
                            }
                        } else if (value instanceof ObservableSetupBaseMap) {
                            console.log(`${this.constructor.name}.getShallow: copy ${propertyName} of ObservableSetupBaseMap`);
                            shallow[propertyName as string] = {};
                            for (const [id, child] of value.entries()) {
                                if (depth == 0) {
                                    shallow[propertyName as string][id] = null;
                                } else {
                                    shallow[propertyName as string][id] = (child as SetupItem).getPlain(depth - 1);
                                }
                            }
                        } else {
                            console.warn(`${this.constructor.name}.getShallow: copy ${propertyName} of Object`, value);
                            shallow[propertyName as string] = { ...value };
                        }
                        break;
                    case 'function':
                    case 'symbol':
                        console.log(`${this.constructor.name}.getShallow: ignore ${propertyName} of type ${typeof value}`);
                        break;
                    default:
                        throw new Error(`${this.constructor.name}.getShallow: Unkown type ${typeof value} for ${propertyName}`);
                }
            }
        }
        return shallow;
    }
    
    getDeep(): SetupItemInterface {
        return this.getPlain(-1);
    }

    update(update: SetupItemInterface): void {
        super.update(update);
        for (const propertyName in update) {
            const currentValue = this[propertyName];
            const newValue = update[propertyName];
            switch (typeof currentValue) {
                case 'bigint':
                case 'boolean':
                case 'number':
                case 'string':
                case 'undefined':
                    if (currentValue != newValue) {
                        console.log(`${this.constructor.name}.update:[${propertyName}/${typeof currentValue}]==${currentValue} = ${newValue}`);
                        this[propertyName] = newValue;
                    } else {
                        console.log(`${this.constructor.name}.update:[${propertyName}/${typeof currentValue}]==${currentValue} == ${newValue}`);
                    }
                    break;
                case 'object':
                    if (currentValue instanceof SetupBase) {
                        if (currentValue.id == newValue.id) {
                            currentValue.update(newValue);
                        } else {
                            this[propertyName] = create(newValue);
                        }
                    } else if (currentValue instanceof ObservableSetupBaseMap) {
                        for (const [id, plainObject] of Object.entries(newValue)) {
                            const object = currentValue.get(id);
                            if (plainObject) {
                                if (object) {
                                    object.update(plainObject);
                                } else {
                                    currentValue.set(
                                        id,
                                        create(plainObject as SetupBaseInterface)
                                    );
                                }
                            } else if (!currentValue.has(id)) {
                                currentValue.set(id, null);
                            }
                        }
                        for (const deleted of currentValue.keys()) {
                            if (!(deleted in newValue)) {
                                currentValue.delete(deleted);
                            }
                        }
                    } else {
                        this[propertyName] = { ...newValue };
                    }
                    break;
                case 'function':
                case 'symbol':
                    console.log(`${this.constructor.name}.getShallow: ignore ${propertyName} of type ${typeof currentValue}=${newValue}`);
                    break;
                default:
                    throw new Error(`${this.constructor.name}.getShallow: Unkown type ${typeof currentValue} for ${propertyName}`);
            }
        }
    }
}
