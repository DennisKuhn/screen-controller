import { SetupBase } from '../SetupBase';
import { SetupBaseInterface } from '../SetupInterface';
import { Rectangle } from '../Default/Rectangle';
import { JSONSchema7 } from 'json-schema';
import { observable } from 'mobx';
import { PluginInterface } from './PluginInterface';

/**
 * Template for plugin setup. Registered under plugin-className
 */
export class Plugin extends SetupBase implements PluginInterface {
    relativeBounds: Rectangle;
    scaledBounds?: Rectangle;

    private static readonly schema: JSONSchema7 = {
        $id: '#' + Plugin.name,
        title: 'Plugin base',
        description: 'Base and wrapper for plugins',
        allOf: [
            {
                $ref: '#' + SetupBase.name
            },
            {
                properties: {
                    relativeBounds: { $ref: '#' + Rectangle.name },
                    scaledBounds: { $ref: '#' + Rectangle.name }
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

        for (const propertyName in this) {
            console.log(`${this.constructor.name}[${setup.className}][${setup.id}] observable(${propertyName})`);
            observable(this, propertyName);
        }
    }

    // static register = (): void => SetupBase.register(Plugin, Plugin.schema);
    static register = (): void => SetupBase.addSchema(Plugin.schema);

    static add(schema: JSONSchema7): void {
        SetupBase.register(Plugin, schema);
    }
}

Plugin.register();