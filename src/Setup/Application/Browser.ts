import { Rectangle } from '../Default/Rectangle';
import { SimpleRectangle } from '../Default/RectangleInterface';
import { ObservableSetupBaseMap } from '../Container';
import { Plugin } from './Plugin';
import { SetupBase } from '../SetupBase';
import { SetupItemId, SetupBaseInterface } from '../SetupInterface';
import { JSONSchema7 } from 'json-schema';
import { observable } from 'mobx';


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
                        additionalProperties: {
                            oneOf: [
                                { $ref: Plugin.name },
                                { type: 'null' }
                            ]
                        }
                    }
                },
                required: ['relative', 'plugins']
            }
        ]
    };

    @observable relative: Rectangle;
    @observable scaled?: Rectangle;
    @observable device?: Rectangle;

    plugins: ObservableSetupBaseMap<Plugin>;

    constructor(source: SetupBaseInterface) {
        super(source);
        
        this.relative = new Rectangle(source['relative']);
        if (source['scaled']) {
            this.scaled = new Rectangle(source['scaled']);
        }
        if (source['device']) {
            this.device = new Rectangle(source['device']);
        }
        this.plugins = SetupBase.createMap<Plugin>(source['plugins']);
    }


    static createNew(parentId: SetupItemId, relative: SimpleRectangle): Browser {
        const newID = SetupBase.getNewId(Browser.name);
        return new Browser( 
            {
                id: newID,
                parentId: parentId,
                className: Browser.name,
                plugins: {},
                relative: {
                    id: SetupBase.getNewId(Rectangle.name),
                    className: Rectangle.name,
                    parentId: newID,
                    ...relative
                } as SetupBaseInterface
            } as SetupBaseInterface
        );
    }

    static register(): void {
        SetupBase.register(Browser, Browser.schema);
    }

    addPlugin = (schema: JSONSchema7 ): void => { 
        const plugin = Plugin.createNew(this.id, schema);

        this.plugins.set(
            plugin.id,
            plugin
        );
    }
}

Browser.register();
