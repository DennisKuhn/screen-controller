import { Rectangle } from './Rectangle';
import { SimpleRectangle } from './RectangleInterface';
import { observable } from 'mobx';
import { SetupItem } from './SetupItem';
import { ObservableSetupBaseMap } from './Container';
import { Plugin } from './Plugin';
import { SetupBase } from './SetupBase';
import { SetupItemId, SetupBaseInterface } from './SetupBaseInterface';
import { register } from './SetupFactory';
import { JSONSchema7 } from 'json-schema';


export class Browser extends SetupItem {

    static schema: JSONSchema7 = {
        $id: 'Browser',
        title: 'Browser',
        description: 'Container for plugins',
        allOf: [
            {
                $ref: '#SetupBase'
            },
            {
                properties: {
                    className: { const: 'Browser' },
                    relative: { $ref: '#Rectangle' },
                    scaled: { $ref: '#Rectangle' },
                    device: { $ref: '#Rectangle' },
                    plugins: {
                        type: 'object',
                        additionalProperties: { $ref: '#Plugin' }
                    }
                },
                required: ['relative', 'plugins']
            }
        ]
    };

    readonly className: 'Browser' = 'Browser';

    @observable relative: Rectangle;
    @observable scaled?: Rectangle;
    @observable device?: Rectangle;

    plugins: ObservableSetupBaseMap<Plugin> = new ObservableSetupBaseMap<Plugin>();

    constructor(source: SetupBaseInterface) {
        super(source, Browser.schema);
        
        const { relative, scaled, device } = (super.update(source) as Browser);
        this.relative = relative;
        this.scaled = scaled;
        this.device = device;

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
                    return new Browser(config);
                }
            }
        );
        registered = true;
    }
};

registerWithFactory();
