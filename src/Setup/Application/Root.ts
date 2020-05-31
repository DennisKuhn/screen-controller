import { SetupBase } from '../SetupBase';
import { SetupBaseInterface } from '../SetupInterface';
import { Screen } from './Screen';
import { JSONSchema7 } from 'json-schema';

export class Root extends SetupBase {
    static schema: JSONSchema7 = {
        $id: Root.name,
        title: 'Root',
        description: 'Root element for setup',
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                properties: {
                    id: { const: Root.name },
                    className: { const: Root.name },
                    parentId: { const: Root.name },
                    screen: { $ref: Screen.name },
                },
                required: ['screen']
            }
        ]
    };

    screen: Screen;

    constructor(source: SetupBaseInterface) {
        super(source);

        this.screen = new Screen(source['screen']);
    }

    static createNewBlank = (): Root => new Root(
        {
            ...SetupBase.createNewInterface(Root.name, Root.name, Root.name),
            screen: Screen.newInterface(Root.name)
        } as SetupBaseInterface
    );

    static register(): void {
        SetupBase.register(Root, Root.schema);
    }
}

Root.register();