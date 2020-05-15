import { observable } from 'mobx';
import { SetupItem } from './SetupItem';
import { Screen } from './Screen';
import { SetupBaseInterface } from './SetupBaseInterface';
import { JSONSchema7 } from 'json-schema';

export class Root extends SetupItem {
    static id: 'Root' = 'Root';

    static schema: JSONSchema7 = {
        $id: 'Root',
        title: 'Root',
        description: 'Root element for setup',
        allOf: [
            {
                $ref: '#' + SetupBase.name
            },
            {
                properties: {
                    id: { const: 'Root' },
                    className: { const: 'Root' },
                    parentId: { const: 'Root' },
                    screen: { $ref: '#' + Screen.name }
                },
                required: ['screen']
            }
        ]
    };

    @observable
    screen: Screen;

    constructor(source: SetupBaseInterface) {
        super(source);

        const { screen } = (super.update(source) as Root);
        this.screen = screen;
    }

    static createNewBlank(): Root {
        return new Root({
            id: 'Root',
            parentId: 'Root',
            className: 'Root',
            screen: { id: Screen.name, parentId: 'Root', className: Screen.name, displays: {} }
        });
    }

    static register(): void {
        SetupItem.register({
            factory: Root,
            schema: Root.schema
        });
    }
}

Root.register();
