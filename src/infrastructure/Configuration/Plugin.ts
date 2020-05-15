import { SetupItem } from './SetupItem';
import { Rectangle } from './Rectangle';
import { JSONSchema7 } from 'json-schema';
import { SetupBase } from './SetupBase';
import { SetupBaseInterface } from './SetupBaseInterface';

export abstract class Plugin extends SetupItem {
    relativeBounds: Rectangle;
    scaledBounds: Rectangle | undefined;

    protected static readonly schema: JSONSchema7 = {
        $id: '#PluginSetupItem',
        allOf: [
            {
                $ref: '#SetupBase'
            },
            {
                properties: {
                    relativeBounds: { $ref: '#Rectangle' },
                    scaledBounds: { $ref: '#Rectangle' }
                },
                required: ['relativeBounds']
            }
        ]
    }

    constructor(setup: SetupBaseInterface, schema: JSONSchema7) {
        super(setup, schema);
        SetupBase.addSchema(Plugin.schema);
    }
}
