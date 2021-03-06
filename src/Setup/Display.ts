import { Browser } from './Browser';
import { SetupBase } from '../SetupBase';
import { SetupBaseInterface } from '../SetupInterface';
import { ObservableSetupBaseMap } from '../Container';
import { ScSchema7 } from '../ScSchema7';

export class Display extends SetupBase {
    static schema: ScSchema7 = {
        $id: Display.name,
        title: 'Display',
        description: 'Represent a monitor containing browsers',
        scIcon: 'desktop_windows',
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
                properties: {
                    className: { const: Display.name },
                    parentId: { const: 'Screen' },
                    browsers: {
                        $id: Display.name + '.browsers',
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

        this.browsers = this.createMap<Browser>(source['browsers'], 'browsers');
    }

    static register(): void {
        SetupBase.register(Display, Display.schema);
    }
}

Display.register();
