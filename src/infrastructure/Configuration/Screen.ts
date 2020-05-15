import { Display } from './Display';
import { SetupItem } from './SetupItem';
import { ObservableSetupBaseMap } from './Container';
import { SetupBaseInterface } from './SetupBaseInterface';
import { register } from './SetupFactory';
import { JSONSchema7 } from 'json-schema';

export class Screen extends SetupItem {
    static id: 'Screen' = 'Screen';

    static schema: JSONSchema7 = {
        $id: 'Screen',
        title: 'Screen',
        description: 'Screen element for setup',
        allOf: [
            {
                $ref: '#SetupBase'
            },
            {
                properties: {
                    id: { const: 'Screen' },
                    className: { const: 'Screen' },
                    parentId: { const: 'Root' },
                    displays: {
                        type: 'object',
                        additionalProperties: { $ref: '#Display' }
                    }
                },
                required: ['displays']
            }
        ]
    };

    displays = new ObservableSetupBaseMap<Display>();

    constructor(source: SetupBaseInterface) {
        super(source, Screen.schema);
        super.update(source);
    }

    static createNewBlank(): Screen {
        return new Screen({ id: 'Screen', parentId: 'Root', className: 'Screen', displays: {} });
    }
}

let registered = false;

export const registerWithFactory = (): void => {
    // console.log(`Screen.registerWithFactory registered=${registered}`);
    if (!registered) {
        register(
            'Screen',
            {
                factory: (config: SetupBaseInterface): Screen => {
                    return new Screen(config);
                }
            }
        );
        registered = true;
    }
};

registerWithFactory();
