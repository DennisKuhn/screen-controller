import { SetupBase, SetupConstructor, SetupBaseInterface } from '../SetupBase';
import { Rectangle } from '../Default/Rectangle';
import { JSONSchema7 } from 'json-schema';

export type { SetupBaseInterface };

export abstract class Plugin extends SetupBase {
    relativeBounds: Rectangle;
    scaledBounds: Rectangle | undefined;

    protected static readonly schema: JSONSchema7 = {
        $id: '#' + Plugin.name,
        title: 'Plugin base',
        description: 'Abstract base for plugins',
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
    }

    // static register = (): void => SetupBase.register(Plugin, Plugin.schema);
    static register = (): void => SetupBase.addSchema(Plugin.schema);

    static add<SetupType extends Plugin>(factory: SetupConstructor<SetupType>, schema: JSONSchema7): void {
        SetupBase.register(factory, schema);
    }
}

Plugin.register();