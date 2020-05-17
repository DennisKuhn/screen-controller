import { Rectangle } from '../Default/Rectangle';
import { SimpleRectangle } from '../Default/RectangleInterface';
import { observable } from 'mobx';
import { ObservableSetupBaseMap } from '../Container';
import { Plugin } from './Plugin';
import { SetupBase } from '../SetupBase';
import { SetupItemId, SetupBaseInterface } from '../SetupInterface';
import { JSONSchema7 } from 'json-schema';


export class Browser extends SetupBase {

    static readonly schema: JSONSchema7 = {
        $id: Browser.name,
        title: 'Browser',
        description: 'Container for plugins',
        allOf: [
            {
                $ref: SetupBase.name
            },
            {
                properties: {
                    className: { const: Browser.name },
                    relative: { $ref: Rectangle.name },
                    scaled: { $ref: Rectangle.name },
                    device: { $ref: Rectangle.name },
                    plugins: {
                        type: 'object',
                        additionalProperties: { $ref: Plugin.name }
                    }
                },
                required: ['relative', 'plugins']
            }
        ]
    };

    @observable relative: Rectangle;
    @observable scaled?: Rectangle;
    @observable device?: Rectangle;

    plugins: ObservableSetupBaseMap<Plugin> = new ObservableSetupBaseMap<Plugin>();

    constructor(source: SetupBaseInterface) {
        super(source);

        const { relative, scaled, device } = (super.update(source) as Browser);
        this.relative = relative;
        this.scaled = scaled;
        this.device = device;

    }


    static createNew(parentId: SetupItemId, relative: SimpleRectangle): Browser {
        const newID = SetupBase.getNewId(Browser);
        return new Browser(
            {
                id: newID,
                parentId: parentId,
                className: Browser.name,
                plugins: {},
                relative: {
                    id: SetupBase.getNewId(Rectangle),
                    className: Rectangle.name,
                    parentId: newID,
                    ...relative
                }
            } as SetupBaseInterface
        );
    }

    static register = (): void => SetupBase.register(Browser, Browser.schema);
}

Browser.register();
