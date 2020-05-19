import { SetupBase } from '../SetupBase';
import { SetupBaseInterface, SetupItemId } from '../SetupInterface';
import { Rectangle } from '../Default/Rectangle';
import { JSONSchema7 } from 'json-schema';
import { PluginInterface } from './PluginInterface';
import { observable } from 'mobx';

/**
 * Template for plugin setup. Registered under plugin-className
 */
export class Plugin extends SetupBase implements PluginInterface {
    @observable relativeBounds: Rectangle;
    @observable scaledBounds?: Rectangle;

    private static readonly schema: JSONSchema7 = {
        $id: Plugin.name,
        title: 'Plugin base',
        description: 'Base and wrapper for plugins',
        allOf: [
            {
                $ref: SetupBase.name
            },
            {
                properties: {
                    relativeBounds: { $ref: Rectangle.name },
                    scaledBounds: { $ref: Rectangle.name }
                },
                required: ['relativeBounds']
            }
        ]
    }

    constructor(setup: SetupBaseInterface) {
        super(setup);

        const { relativeBounds, scaledBounds } = (super.update(setup) as Plugin);

        this.relativeBounds = relativeBounds;
        this.scaledBounds = scaledBounds;

        // for (const propertyName in this) {
        //     console.log(`${this.constructor.name}[${setup.className}][${setup.id}] observable(${propertyName})=${this[propertyName]}`);
        //     // observable(this, propertyName);
        // }
    }

    static storagePrefix = 'PluginSchema-';
    static storageListKey = Plugin.storagePrefix + 'List';
    static storageKey = (schemaId: string): string => Plugin.storagePrefix + schemaId;

    static persistSchema = (schema: JSONSchema7): void => {
        if (!schema.$id) throw new Error(`Plugin.persistSchema() no $id: ${JSON.stringify(schema)}`);
        const key = Plugin.storageKey(schema.$id);

        console.log(`Plugin.persistSchema(${schema.$id}) @ ${key}`);

        localStorage.setItem( key, JSON.stringify(schema));

        if (!Plugin.storedSchemaKeys.includes(key)) {
            console.log(`Plugin.persistSchema(${schema.$id}) Add ${key} to ${Plugin.storedSchemaKeys}`, Plugin.storedSchemaKeys);
            Plugin.storedSchemaKeys.push( key );
            localStorage.setItem(
                Plugin.storageListKey,
                JSON.stringify(Plugin.storedSchemaKeys));
        }
    }

    static storedSchemaKeys: string[] = [];

    static loadAllSchemas = (): void => {
        const storedSchemaKeysString = localStorage.getItem(Plugin.storageListKey);

        if (storedSchemaKeysString) {
            try {
                Plugin.storedSchemaKeys = JSON.parse(storedSchemaKeysString);

                for (const key of Plugin.storedSchemaKeys) {
                    const schemaString = localStorage.getItem(key);

                    if (schemaString) {
                        SetupBase.register(
                            Plugin, 
                            JSON.parse(schemaString)
                        );
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

    static add = (schema: JSONSchema7): void => {
        if (!schema.allOf?.some(pluginRefProspect => (pluginRefProspect as JSONSchema7).$ref == Plugin.name))
            throw new Error(`Plugin.addSchema(${schema.$id}) missing: allOf $ref = ${Plugin.name}`);

        SetupBase.register(Plugin, schema);

        if (process.type == 'renderer') {
            Plugin.persistSchema(schema);
        }
    }

    static createNew(parentId: SetupItemId, schema: JSONSchema7): Plugin {

        if (!schema.$id) throw new Error(`Plugin.createNew(${parentId}, ${schema.$id}) no schema.$id`);
        if (!schema.allOf) throw new Error(`Plugin.createNew(${parentId}, ${schema.$id}) no schema.allOf`);

        const newID = SetupBase.getNewId(Plugin);

        const defaultSetup = {};

        for (const entry of schema.allOf) {
            const subschema = entry as JSONSchema7;
            if (subschema.properties) {
                for (const [name, value] of Object.entries ( subschema.properties )) {
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
            id: newID,
            parentId: parentId,
            className: schema.$id,
            relativeBounds: {
                id: SetupBase.getNewId(Rectangle),
                className: Rectangle.name,
                parentId: newID,
                x: 0,
                y: 0,
                width: 1,
                height: 1
            } as SetupBaseInterface
        } as SetupBaseInterface;

        console.log(`Plugin.createNew(${parentId}, ${schema.$id})`, {...plain});

        return new Plugin( plain );
    }

    static register = (): void => {
        SetupBase.addSchema(Plugin.schema);

        if (process.type == 'renderer') {
            Plugin.loadAllSchemas();
        } else {
            console.log(`Plugin.register: not loading schema, ${process.type} != 'renderer'`);
        }
    }
}
Plugin.register();
