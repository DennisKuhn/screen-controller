import { Browser } from './Browser';
import { SetupItem } from './SetupItem';
import { ObservableSetupBaseMap } from './Container';
import { SetupBaseInterface, SetupItemId } from './SetupBaseInterface';
import { JSONSchema7 } from 'json-schema';

export class Display extends SetupItem {
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

    static register(): void {
        SetupItem.register({
            factory: Display,
            schema: Display.schema
        });
    }
}

Display.register();
