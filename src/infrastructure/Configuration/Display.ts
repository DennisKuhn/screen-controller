import { Browser } from './Browser';
import { register } from './SetupFactory';
import { SetupItem } from './SetupItem';
import { ObservableSetupBaseMap } from './Container';
import { SetupBaseInterface, SetupItemId } from './SetupBaseInterface';
import { JSONSchema7 } from 'json-schema';

export class Display extends SetupItem {
    static schema: JSONSchema7 = {
        $id: 'Display',
        title: 'Display',
        description: 'Represent a monitor containing browsers',
        allOf: [
            {
                $ref: '#SetupBase'
            },
            {
                properties: {
                    className: { const: 'Display' },
                    parentId: { const: 'Screen' },
                    browsers: {
                        type: 'object',
                        additionalProperties: { $ref: '#Browser' }
                    }
                },
                required: ['browsers']
            }
        ]
    };

    browsers: ObservableSetupBaseMap<Browser> = new ObservableSetupBaseMap<Browser>();

    constructor(source: SetupBaseInterface) {
        super(source, Display.schema);
        super.update(source);
    }

    static createNew(displayId: SetupItemId): Display {
        return new Display({ id: displayId, parentId: 'Screen', className: 'Display', browsers: {} });
    }
}

let registered = false;

export const registerWithFactory = (): void => {
    // console.log(`Display.registerWithFactory registered=${registered}`);
    if (!registered) {
        register(
            'Display',
            {
                factory: (config: SetupBaseInterface): Display => {
                    return new Display(config);
                }
            }
        );
        registered = true;
    }
};

registerWithFactory();
