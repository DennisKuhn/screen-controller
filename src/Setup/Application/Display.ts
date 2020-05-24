import { Browser } from './Browser';
import { SetupBase } from '../SetupBase';
import { SetupItemId, SetupBaseInterface } from '../SetupInterface';
import { ObservableSetupBaseMap } from '../Container';
import { JSONSchema7 } from 'json-schema';

export class Display extends SetupBase {
    static schema: JSONSchema7 = {
        $id: Display.name,
        title: 'Display',
        description: 'Represent a monitor containing browsers',
        allOf: [
            {
                $ref: SetupBase.name
            },
            {
                properties: {
                    className: { const: Display.name },
                    parentId: { const: 'Screen' },
                    browsers: {
                        type: 'object',
                        additionalProperties: {
                            oneOf: [
                                { $ref: Browser.name },
                                { type: 'null' }
                            ]
                        }
                    }
                },
                required: ['browsers']
            }
        ]
    };

    browsers: ObservableSetupBaseMap<Browser>;

    constructor(source: SetupBaseInterface) {
        super(source);

        this.browsers = SetupBase.createMap<Browser>(source['browsers']);
    }

    static createNew(displayId: SetupItemId): Display {
        return new Display(
            {
                id: displayId,
                parentId: 'Screen',
                className: Display.name,
                browsers: {}
            } as SetupBaseInterface
        );
    }

    static register(): void {
        SetupBase.register(Display, Display.schema);
    }
}

Display.register();
