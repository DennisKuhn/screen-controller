import { Display } from './Display';
import { ScreenInterface } from './ScreenInterface';
import { SetupItem } from './SetupItem';
import { ObservableSetupBaseMap } from './Container';
import { SetupBaseInterface } from './SetupBaseInterface';
import { register } from './SetupFactory';

export class Screen extends SetupItem {

    displays = new ObservableSetupBaseMap<Display>();

    constructor(source: ScreenInterface) {
        super(source);
        super.update(source);
    }

    static createNewBlank(): Screen {
        return new Screen({ id: 'Screen', parentId: 'Root', className: 'Screen', displays: {} });
    }
}

let registered = false;

export const registerWithFactory = (): void => {
    // console.log(`Screen.registerWithFactory registered=${registered}`);
    if (!registered) {
        register(
            'Screen',
            {
                factory: (config: SetupBaseInterface): Screen => {
                    return new Screen(config as ScreenInterface);
                }
            }
        );
        registered = true;
    }
};

registerWithFactory();
