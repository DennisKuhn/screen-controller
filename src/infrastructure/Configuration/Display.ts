import { Browser } from './Browser';
import { DisplayInterface } from './DisplayInterface';
import { register } from './SetupFactory';
import { SetupItem } from './SetupItem';
import { ObservableSetupBaseMap } from './Container';
import { SetupBaseInterface, SetupItemId } from './SetupBaseInterface';

export class Display extends SetupItem {

    browsers: ObservableSetupBaseMap<Browser> = new ObservableSetupBaseMap<Browser>();

    constructor(source: DisplayInterface) {
        super(source);
        super.update(source);
    }

    static createNew(displayId: SetupItemId): Display {
        return new Display({ id: displayId, parentId: 'Screen', className: 'Display', browsers: {} });
    }
}

let registered = false;

export const registerWithFactory = (): void => {
    // console.log(`Display.registerWithFactory registered=${registered}`);
    if (!registered) {
        register(
            'Display',
            {
                factory: (config: SetupBaseInterface): Display => {
                    return new Display(config as DisplayInterface);
                }
            }
        );
        registered = true;
    }
};

registerWithFactory();
