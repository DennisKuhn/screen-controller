import { observable } from 'mobx';
import { SetupItem } from './SetupItem';
import { Screen } from './Screen';
import { SetupBaseInterface } from './SetupBaseInterface';
import { register } from './SetupFactory';
import { JSONSchema7 } from 'json-schema';

export class Root extends SetupItem {
    static id: 'Root' = 'Root';

    static schema: JSONSchema7 = {
        $id: 'Root',
        title: 'Root',
        description: 'Root element for setup',
        allOf: [
            {
                $ref: '#SetupBase'
            },
            {
                properties: {
                    id: { const: 'Root' },
                    className: { const: 'Root' },
                    parentId: { const: 'Root' },
                    screen: { $ref: '#Screen' }
                },
                required: ['screen']
            }
        ]
    };

    @observable
    screen: Screen;

    constructor(source: SetupBaseInterface) {
        super(source, Root.schema);

        const { screen } = (super.update(source) as Root);
        this.screen = screen;
    }

    static createNewBlank(): Root {
        return new Root({
            id: 'Root',
            parentId: 'Root',
            className: 'Root',
            screen: { id: 'Screen', parentId: 'Root', className: 'Screen', displays: {} }
        });
    }
}


let registered = false;

export const registerWithFactory = (): void => {
    // console.log(`Root.registerWithFactory registered=${registered}`);
    if (!registered) {
        register(
            'Root',
            {
                factory: (config: SetupBaseInterface): Root => {
                    return new Root(config);
                }
            }
        );
        registered = true;
    }
};

registerWithFactory();
