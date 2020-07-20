import { SetupBase } from '../SetupBase';
import { SetupBaseInterface, Dictionary } from '../SetupInterface';
import { Rectangle } from '../Default/Rectangle';
import { JSONSchema7 } from 'json-schema';
import { PluginInterface } from './PluginInterface';
import { create } from '../SetupFactory';
import { extendObservable, observable } from 'mobx';
import { RelativeRectangle } from '../Default/RelativeRectangle';
import { setOptionals } from '../JsonSchemaTools';
import { callerAndfName } from '../../utils/debugging';
import { asScSchema7 } from '../ScSchema7';
import Performance from './Performance';
import { resolve } from '../JsonSchemaTools';

/**
 * Template for plugin setup. Registered under plugin-className
 */
export class Plugin extends SetupBase implements PluginInterface {
    @observable relativeBounds: RelativeRectangle;
    @observable scaledBounds?: Rectangle;
    @observable performance: Performance;

    private static readonly schema: JSONSchema7 = {
        $id: Plugin.name,
        title: 'Plugin base',
        description: 'Base and wrapper for plugins',
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
                properties: {
                    relativeBounds: { $ref: RelativeRectangle.name },
                    scaledBounds: { allOf: [{ $ref: Rectangle.name }, asScSchema7({ scHidden: true })] },
                    performance: {
                        allOf: [
                            { $ref: Performance.name },
                            asScSchema7({ scViewOnly: true })
                        ]
                    },
                },
                required: ['relativeBounds', 'performance' ]
            }
        ]
    }

    constructor(setup: SetupBaseInterface) {        
        super(setup);
        const source = setup as PluginInterface;

        this.relativeBounds = new RelativeRectangle(source.relativeBounds);
        this.performance = new Performance(source.performance);

        if (source.scaledBounds) {
            this.scaledBounds = new Rectangle(source.scaledBounds);
        }
        this.init(setup);
    }

    init(setup: SetupBaseInterface): SetupBase {
        // console.log(`SetupBase[${this.constructor.name}][${this.id}].update`);

        const observables = {};

        for (const propertyName in setup) {
            if (this[propertyName] === undefined) {
                const value = setup[propertyName];
                const type = typeof value;

                switch (type) {
                    case 'boolean':
                    case 'number':
                    case 'string':
                        // console.log(`${this.constructor.name}[${setup.className}][${this.id}].init:[${propertyName}/${typeof value}]= ${value}`);
                        observables[propertyName] = value;
                        break;
                    case 'undefined':
                        throw new Error(`${this.constructor.name}[${setup.className}][${this.id}].init:[${propertyName}]= ${value}/${type}`);
                    case 'object':
                        if ((value as SetupBaseInterface).id) {
                            // console.log(
                            //     `${this.constructor.name}[${setup.className}][${this.id}].init:[${propertyName}/Setup]=create[${(value as SetupBaseInterface).id}]`
                            // /*, updateSetup */);
                            observables[propertyName] = create(value as SetupBaseInterface);
                        } else {
                            //TODO Implement array
                            console.warn(`${this.constructor.name}[${setup.className}][${this.id}].init:[${propertyName}/Dictionary]=create` /*, updateSetup */);
                            this[propertyName] = this.createMap<SetupBase>(value as Dictionary<SetupBaseInterface>, propertyName);
                        }
                        break;
                    case 'function':
                    case 'symbol':
                        console.warn(`${this.constructor.name}[${setup.className}][${this.id}].init: Invalid ${propertyName}=${value}/${type}`);
                        break;
                    case 'bigint':
                        throw new Error(`${this.constructor.name}[${setup.className}][${this.id}].init: Unsupported for ${propertyName}=${value}/${type}`);
                    default:
                        throw new Error(`${this.constructor.name}[${setup.className}][${this.id}].init: Unkown for ${propertyName}=${value}/${type}`);
                }
            } else {
                // console.log(`${this.constructor.name}[${setup.className}][${this.id}].init: skip ${propertyName}=${this[propertyName]}` /*, updateSetup */);
            }
        }
        setOptionals(this, observables, this.getSchema(), this.getSchema());
        // console.log(`${this.constructor.name}[${setup.className}][${this.id}].init extendObservable( ${observables} )`);
        extendObservable(this, observables);

        // for (const [property, value] of Object.entries(this)) {
        //     if (value === undefined) {
        //         console.log(`${callerAndfName()}[${setup.className}][${this.id}] make undefined ${property} observable`);
        //         decorate(this, { [property as any]: observable });
        //     }
        // }
        return this;
    }


    static storagePrefix = 'PluginSchema-';
    static storageListKey = Plugin.storagePrefix + 'List';
    static storageKey(schemaId: string): string {
        return Plugin.storagePrefix + schemaId;
    }

    static persistSchema(schema: JSONSchema7): void {
        if (!schema.$id) throw new Error(`Plugin.persistSchema() no $id: ${JSON.stringify(schema)}`);
        const key = Plugin.storageKey(schema.$id);

        // console.log(`Plugin.persistSchema(${schema.$id}) @ ${key}`);

        localStorage.setItem(key, JSON.stringify(schema));

        if (!Plugin.storedSchemaKeys.includes(key)) {
            // console.log(`Plugin.persistSchema(${schema.$id}) Add ${key} to ${Plugin.storedSchemaKeys}`, Plugin.storedSchemaKeys);
            Plugin.storedSchemaKeys.push(key);
            localStorage.setItem(
                Plugin.storageListKey,
                JSON.stringify(Plugin.storedSchemaKeys));
        }
    }

    static storedSchemaKeys: string[] = [];

    static loadAllSchemas(): void {
        const storedSchemaKeysString = localStorage.getItem(Plugin.storageListKey);

        if (storedSchemaKeysString) {
            try {
                Plugin.storedSchemaKeys = JSON.parse(storedSchemaKeysString);
                const schemas = new Array<JSONSchema7>();

                for (const key of Plugin.storedSchemaKeys) {
                    const schemaString = localStorage.getItem(key);

                    if (schemaString) {
                        schemas.push(JSON.parse(schemaString));
                    } else {
                        console.error(`Plugin.loadAllSchemas() null for ${key}`, storedSchemaKeysString);
                    }
                }
                // console.log(`${callerAndfName()} add direct plugins [${schemas.length}]`);

                /// First add all schema directly referencing Plugin
                for (let i = 0; i < schemas.length; i++) {
                    const schema = schemas[i]
                    if (schema.allOf === undefined) throw new Error(`${callerAndfName()} no allOf in loaded plugin schema: ${JSON.stringify(schema)}`);

                    if (schema.allOf.some(oneSchema => typeof oneSchema === 'object' && oneSchema.$ref === Plugin.name)) {
                        console.log(`${callerAndfName()} add direct plugin ${schema.$id} @${i}/${schemas.length}`);
                        Plugin.add(schema);
                        schemas.splice(i, 1);
                        i -= 1;
                    }
                }
                // console.log(`${callerAndfName()} add indirect plugins [${schemas.length}]`);
                for (const schema of schemas) {
                    if (schema.allOf === undefined) throw new Error(`${callerAndfName()} no allOf in loaded plugin schema: ${JSON.stringify(schema)}`);

                    console.log(`${callerAndfName()} add indirect plugin ${schema.$id}`);
                    Plugin.add(schema);
                }
            } catch (error) {
                console.error(`Plugin.loadAllSchemas(): caught ${error}`, error);
            }
        } else {
            console.warn('Plugin.loadAllSchemas() no stored schemas');
        }
    }

    public static readonly SCHEMA_REF_VALUE = Plugin.name;

    private static pluginSchemaIds: string[] = [];

    static isPluginSchema = (schema: JSONSchema7, root: JSONSchema7): boolean =>
        schema.allOf != undefined
        && schema.allOf.some(pluginRefProspect =>
            (typeof pluginRefProspect == 'object')
            && ((pluginRefProspect.$ref == Plugin.name)
                || Plugin.isPluginSchema(resolve(pluginRefProspect, root), root))
        );

    static add(schema: JSONSchema7): void {
        if (!schema.$id) throw new Error(`Plugin.add() no $id: ${JSON.stringify(schema)}`);

        if (!Plugin.isPluginSchema( schema, SetupBase.activeSchema))
            console.error(`Plugin.addSchema(${schema.$id}) not a plugin schema`, schema);
        //throw new Error(`Plugin.addSchema(${schema.$id}) missing: allOf $ref = ${Plugin.SCHEMA_REF_VALUE}`);

        SetupBase.register(Plugin, schema);

        Plugin.pluginSchemaIds.includes(schema.$id) || Plugin.pluginSchemaIds.push(schema.$id);


        if (process.type == 'renderer') {
            Plugin.persistSchema(schema);
        }
    }


    static register(): void {
        SetupBase.addSchema(Plugin.schema);

        if (process.type == 'renderer') {
            Plugin.loadAllSchemas();
        } else {
            // console.log(`Plugin.register: not loading schema, ${process.type} != 'renderer'`);
        }
    }
}
Plugin.register();
