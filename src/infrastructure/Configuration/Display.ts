import { Browser } from './Browser';
import { SetupBase } from './SetupBase';
import { ObservableSetupBaseMap } from './Container';
import { SetupBaseInterface, SetupItemId } from './SetupBaseInterface';
import { JSONSchema7 } from 'json-schema';

export class Display extends SetupBase {
    static schema: JSONSchema7 = {
        $id: Display.name,
        title: 'Display',
        description: 'Represent a monitor containing browsers',
        allOf: [
            {
                $ref: '#' + SetupBase.name
            },
            {
                properties: {
                    className: { const: Display.name },
                    parentId: { const: 'Screen' },
                    browsers: {
                        type: 'object',
                        additionalProperties: { $ref: '#' + Browser.name }
                    }
                },
                required: ['browsers']
            }
        ]
    };

    browsers: ObservableSetupBaseMap<Browser> = new ObservableSetupBaseMap<Browser>();

    constructor(source: SetupBaseInterface) {
        super(source);
        super.update(source);
    }

    static createNew(displayId: SetupItemId): Display {
        return new Display({ id: displayId, parentId: 'Screen', className: Display.name, browsers: {} });
    }

    static register= (): void => SetupBase.register( Display, Display.schema );
}

Display.register();
