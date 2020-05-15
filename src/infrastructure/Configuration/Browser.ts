import { Rectangle } from './Rectangle';
import { SimpleRectangle } from './RectangleInterface';
import { observable } from 'mobx';
import { SetupItem } from './SetupItem';
import { BrowserInterface } from './BrowserInterface';
import { ObservableSetupBaseMap } from './Container';
import { Plugin } from './Plugin';
import { SetupBase } from './SetupBase';
import { SetupItemId, SetupBaseInterface } from './SetupBaseInterface';
import { register } from './SetupFactory';


export class Browser extends SetupItem {

    readonly className: 'Browser' = 'Browser';

    @observable relative: Rectangle;
    @observable scaled?: Rectangle;
    @observable device?: Rectangle;

    plugins: ObservableSetupBaseMap<Plugin> = new ObservableSetupBaseMap<Plugin>();

    constructor(source: BrowserInterface) {
        super(source);

        this.relative = new Rectangle(source.relative);

        this.scaled = source.scaled ? new Rectangle(source.scaled) : undefined;
        this.device = source.device ? new Rectangle(source.device) : undefined;
        
        super.update(source);
    }


    static createNew(parentId: SetupItemId, relative: SimpleRectangle): Browser {
        const newID = SetupBase.getNewId('Browser');
        return new Browser({
            id: newID,
            parentId: parentId,
            className: 'Browser',
            plugins: {},
            relative: {
                id: SetupBase.getNewId('Rectangle'),
                className: 'Rectangle',
                parentId: newID,

                ...relative
            }
        });
    }
}


let registered = false;

export const registerWithFactory = (): void => {
    // console.log(`Browser.registerWithFactory registered=${registered}`);
    if (!registered) {
        register(
            'Browser',
            {
                factory: (config: SetupBaseInterface): Browser => {
                    return new Browser(config as BrowserInterface);
                }
            }
        );
        registered = true;
    }
};

registerWithFactory();
