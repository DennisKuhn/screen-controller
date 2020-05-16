import { SetupBase } from './SetupBase';
import { Rectangle } from './Rectangle';
import { JSONSchema7 } from 'json-schema';
import { SetupBaseInterface } from './SetupBaseInterface';

export abstract class Plugin extends SetupBase {
    relativeBounds: Rectangle;
    scaledBounds: Rectangle | undefined;

    protected static readonly schema: JSONSchema7 = {
        $id: '#' + Plugin.name,
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
        SetupBase.addSchema(Plugin.schema);
    }
}