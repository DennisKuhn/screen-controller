import { Display } from './Display';
import { SetupBase } from './SetupBase';
import { ObservableSetupBaseMap } from './Container';
import { SetupBaseInterface } from './SetupBaseInterface';
import { JSONSchema7 } from 'json-schema';

export class Screen extends SetupBase {
    static schema: JSONSchema7 = {
        $id: '#' + Screen.name,
        title: 'Screen',
        description: 'Screen element for setup',
        allOf: [
            {
                $ref: '#' + SetupBase.name
            },
            {
                properties: {
                    id: { const: Screen.name },
                    className: { const: Screen.name },
                    parentId: { const: 'Root' },
                    displays: {
                        type: 'object',
                        additionalProperties: {
                            oneOf: [
                                { $ref: '#' + Display.name },
                                { type: 'null' }
                            ]
                        }
                    }
                },
                required: ['displays']
            }
        ]
    };

    displays = new ObservableSetupBaseMap<Display>();

    constructor(source: SetupBaseInterface) {
        super(source);
        super.update(source);
    }

    static createNewBlank(): Screen {
        return new Screen({ id: Screen.name, parentId: 'Root', className: Screen.name, displays: {} });
    }

    static register = (): void => SetupBase.register( Screen, Screen.schema );
}

Screen.register();