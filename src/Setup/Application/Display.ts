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
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
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

    addBrowser = (): void => {
        const newBrowser = Browser.create(
            this.id, {
                x: 0,
                y: 0,
                height: 1,
                width: 1
            });
        this.browsers.set(
            newBrowser.id,
            newBrowser
        );
    }

    deleteChild(id: SetupItemId): void {
        console.log(`${this.constructor.name}[${this.id}].deleteChild(${id})`);

        if (!this.browsers.has(id))
            throw new Error(`${this.constructor.name}[${this.id}].deleteChild(${id}) not found in [${Array.from(this.browsers.keys()).join(', ')}]`);
        
        this.browsers.delete(id);
    }


    static createNew(displayId: SetupItemId, parentId: SetupItemId): Display {
        return new Display(
            {
                ...SetupBase.createNewInterface(Display.name, parentId, displayId ),
                browsers: {}
            } as SetupBaseInterface
        );
    }

    static register(): void {
        SetupBase.register(Display, Display.schema, {});
    }
}

Display.register();
