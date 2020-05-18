import { observable } from 'mobx';
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
            {
                $ref: SetupBase.name
            },
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

    @observable
    screen: Screen;

    constructor(source: SetupBaseInterface) {
        super(source);

        const { screen } = (super.update(source) as Root);
        this.screen = screen;
    }

    static createNewBlank(): Root {
        return new Root(
            {
                id: Root.name,
                parentId: Root.name,
                className: Root.name,
                screen: { id: Screen.name, parentId: Root.name, className: Screen.name, displays: {} }
            } as SetupBaseInterface
        );
    }

    static register = (): void => SetupBase.register(Root, Root.schema);
}

Root.register();