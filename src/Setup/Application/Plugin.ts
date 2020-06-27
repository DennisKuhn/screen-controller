import { SetupBase } from '../SetupBase';
import { PropertyKey, SetupBaseInterface, SetupItemId, Dictionary } from '../SetupInterface';
import { Rectangle } from '../Default/Rectangle';
import { JSONSchema7 } from 'json-schema';
import { PluginInterface } from './PluginInterface';
import { create } from '../SetupFactory';
import { extendObservable, observable } from 'mobx';
import { UiSchema } from '@rjsf/core';
import { RelativeRectangle } from '../Default/RelativeRectangle';
import { setOptionals } from '../JsonSchemaTools';
import {  } from '../../utils/debugging';

/**
 * Template for plugin setup. Registered under plugin-className
 */
export class Plugin extends SetupBase implements PluginInterface {
    @observable relativeBounds: RelativeRectangle;
    @observable scaledBounds?: Rectangle;

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
                    scaledBounds: { $ref: Rectangle.name }
                },
                required: ['relativeBounds']
            }
        ]
    }

    public static readonly uiSchema: UiSchema = {
        scaledBounds: { 'ui:widget': 'hidden' }
    };

    constructor(setup: SetupBaseInterface) {
        super(setup);

        this.relativeBounds = new RelativeRectangle(setup['relativeBounds']);

        if (setup['scaledBounds']) {
            this.scaledBounds = new Rectangle(setup['scaledBounds']);
        }

        this.init(setup);
        // for (const propertyName in this) {
        //     console.log(`${this.constructor.name}[${setup.className}][${setup.id}] observable(${propertyName})=${this[propertyName]}`);
        //     // observable(this, propertyName);
        // }
    }

    init(setup: SetupBaseInterface): SetupBase {
        // console.log(`SetupBase[${this.constructor.name}][${this.id}].update`);

        const observables = {};

        for (const propertyName in setup) {
            if (!(propertyName in this)) {
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

    static get pluginSchemas(): JSONSchema7[] {
        if (!SetupBase.activeSchema.definitions)
            throw new Error('Plugin.schemas: no SetupBase.activeSchema.definitions');

        const schemas = Object.entries(SetupBase.infos)
            .filter(([className,]) => Plugin.pluginSchemaIds.includes(className))
            .map(([, info]) => info.schema);

        console.log(`Plugin.pluginSchemas [${Plugin.pluginSchemaIds.length}]`, { ...schemas });

        return schemas;
    }

    static get hasPluginSchemas(): boolean {
        if (!SetupBase.activeSchema.definitions)
            throw new Error('Plugin.hasSchemas: no SetupBase.activeSchema.definitions');

        const result = Plugin.pluginSchemaIds.length > 0;

        console.log(`Plugin.hasPluginSchemas ${result}/${Plugin.pluginSchemaIds.length}`);

        return result;
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

                for (const key of Plugin.storedSchemaKeys) {
                    const schemaString = localStorage.getItem(key);

                    if (schemaString) {
                        Plugin.add(JSON.parse(schemaString));
                    } else {
                        console.error(`Plugin.loadAllSchemas() null for ${key}`, storedSchemaKeysString);
                    }
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

    static add(schema: JSONSchema7): void {
        if (!schema.$id) throw new Error(`Plugin.add() no $id: ${JSON.stringify(schema)}`);

        if (!schema.allOf?.some(pluginRefProspect =>
            ((pluginRefProspect as JSONSchema7).$ref == Plugin.SCHEMA_REF_VALUE)))
            console.warn(`Plugin.addSchema(${schema.$id}) missing: allOf $ref = ${Plugin.SCHEMA_REF_VALUE}` /* , schema */);
        //throw new Error(`Plugin.addSchema(${schema.$id}) missing: allOf $ref = ${Plugin.SCHEMA_REF_VALUE}`);

        SetupBase.register(Plugin, schema, Plugin.uiSchema);

        Plugin.pluginSchemaIds.includes(schema.$id) || Plugin.pluginSchemaIds.push(schema.$id);


        if (process.type == 'renderer') {
            Plugin.persistSchema(schema);
        }
    }

    static create(parentId: SetupItemId, parentProperty: PropertyKey, schema: JSONSchema7): Plugin {

        if (!schema.$id) throw new Error(`Plugin.createNew(${parentId}, ${schema.$id}) no schema.$id`);
        if (!schema.allOf) throw new Error(`Plugin.createNew(${parentId}, ${schema.$id}) no schema.allOf`);

        const className = schema.$id;

        const baseSetup = SetupBase.createNewInterface(className, parentId, parentProperty);
        const defaultSetup = {};

        for (const entry of schema.allOf) {
            const subschema = entry as JSONSchema7;
            if (subschema.properties) {
                for (const [name, value] of Object.entries(subschema.properties)) {
                    const propertyDescriptor = value as JSONSchema7;

                    if (propertyDescriptor.default) {
                        defaultSetup[name] = propertyDescriptor.default;
                    }
                }
            }
        }

        // console.log(`Plugin.createNew(${parentId}, ${schema.$id}) defaults=`, { ...defaultSetup });

        const plain: SetupBaseInterface = {
            ...defaultSetup,
            ...baseSetup,
            relativeBounds: RelativeRectangle.newInterface(
                baseSetup.id,
                'relativeBounds',
                {
                    x: 0,
                    y: 0,
                    width: 1,
                    height: 1
                }
            )
        } as SetupBaseInterface;

        // console.log(`Plugin.createNew(${parentId}, ${schema.$id})`, { ...plain });

        return new Plugin(plain);
    }

    static register(): void {
        SetupBase.addSchema(Plugin.schema, Plugin.uiSchema);

        if (process.type == 'renderer') {
            Plugin.loadAllSchemas();
        } else {
            // console.log(`Plugin.register: not loading schema, ${process.type} != 'renderer'`);
        }
    }
}
Plugin.register();
