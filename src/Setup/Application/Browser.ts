import { Rectangle } from '../Default/Rectangle';
import { SimpleRectangle } from '../Default/RectangleInterface';
import { ObservableSetupBaseMap } from '../Container';
import { Plugin } from './Plugin';
import { SetupBase } from '../SetupBase';
import { SetupItemId, SetupBaseInterface } from '../SetupInterface';
import { JSONSchema7 } from 'json-schema';
import { observable } from 'mobx';
import { RelativeRectangle } from '../Default/RelativeRectangle';


export class Browser extends SetupBase {

    static readonly schema: JSONSchema7 = {
        $id: Browser.name,
        title: 'Browser',
        description: 'Container for plugins',
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                properties: {
                    className: { const: Browser.name },
                    relative: { $ref: RelativeRectangle.name },
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

    @observable relative: RelativeRectangle;
    @observable scaled?: Rectangle;
    @observable device?: Rectangle;

    plugins: ObservableSetupBaseMap<Plugin>;

    constructor(source: SetupBaseInterface) {
        super(source);
        
        this.relative = new RelativeRectangle(source['relative']);
        if (source['scaled']) {
            this.scaled = new Rectangle(source['scaled']);
        }
        if (source['device']) {
            this.device = new Rectangle(source['device']);
        }
        this.plugins = SetupBase.createMap<Plugin>(source['plugins']);
    }


    static createNew(parentId: SetupItemId, relative: SimpleRectangle): Browser {
        const newConfig = SetupBase.createNewInterface(Browser.name, parentId);

        return new Browser( 
            {
                ...newConfig,
                plugins: {},
                relative: RelativeRectangle.newInterface(newConfig.id, relative)
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
