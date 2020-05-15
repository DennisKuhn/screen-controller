import { SetupItem } from './SetupItem';
import { Rectangle } from './Rectangle';
import { JSONSchema7 } from 'json-schema';
import { PluginInterface } from './PluginInterface';

export abstract class Plugin extends SetupItem {
    relativeBounds: Rectangle;
    scaledBounds: Rectangle | undefined;

    protected static readonly schema: JSONSchema7 = {
        $schema: 'http://json-schema.org/draft/2019-09/schema#',
        $id: 'https://github.com/DennisKuhn/screen-controller/schemas/PluginSchema.json',
        definitions: {
            Rectangle: {
                $id: '#Rectangle',
                type: 'object',
                properties: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                    width: { type: 'number' },
                    height: { type: 'number' }
                },
                required: ['x', 'y', 'width', 'height']
            },
            SetupItem: {
                $id: '#SetupItem',
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
            },
            PluginSetupItem: {
                $id: '#PluginSetupItem',
                allOf: [
                    {
                        $ref: '#SetupItem'
                    },
                    {
                        properties: {
                            relativeBounds: { $ref: '#Rectangle' },
                            scaledBounds: { $ref: '#Rectangle' }
                        },
                        required: ['relativeBounds', 'scaledBounds']
                    }
                ]
            }
        }
    }

    constructor(setup: PluginInterface) {
        super(setup);

        this.relativeBounds = new Rectangle(setup.relativeBounds);

        if (setup.scaledBounds) {
            this.scaledBounds = new Rectangle(setup.scaledBounds);
        }
    }
}
