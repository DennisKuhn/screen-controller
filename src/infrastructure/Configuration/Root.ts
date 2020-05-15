import { observable } from 'mobx';
import { SetupItem } from './SetupItem';
import { RootInterface } from './RootInterface';
import { Screen } from './Screen';
import { SetupBaseInterface } from './SetupBaseInterface';
import { register } from './SetupFactory';

export class Root extends SetupItem {

    @observable
    screen: Screen;

    constructor(source: RootInterface) {
        super(source);
        this.screen = new Screen(source.screen);
        super.update(source);
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
                    return new Root(config as RootInterface);
                }
            }
        );
        registered = true;
    }
};

registerWithFactory();
