import { Rectangle } from '../Default/Rectangle';
import { SimpleRectangle } from '../Default/RectangleInterface';
import { ObservableSetupBaseMap } from '../Container';
import { Plugin } from './Plugin';
import { SetupBase } from '../SetupBase';
import { SetupItemId, SetupBaseInterface } from '../SetupInterface';
import { JSONSchema7 } from 'json-schema';
import { observable } from 'mobx';
import { RelativeRectangle } from '../Default/RelativeRectangle';
import { UiSchema } from '@rjsf/core';


export class Browser extends SetupBase {

    static readonly schema: JSONSchema7 = {
        $id: Browser.name,
        title: 'Browser',
        description: 'Container for plugins',
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
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

    public static readonly uiSchema: UiSchema = {
        scaled: { 'ui:widget': 'hidden' },
        device: { 'ui:widget': 'hidden' }
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


    static create(parentId: SetupItemId, relative: SimpleRectangle): Browser {
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
        SetupBase.register(Browser, Browser.schema, Browser.uiSchema);
    }

    addPlugin = (schema: JSONSchema7 ): void => { 
        const plugin = Plugin.create(this.id, schema);

        this.plugins.set(
            plugin.id,
            plugin
        );
    }

    deleteChild(id: SetupItemId): void {
        console.log(`${this.constructor.name}[${this.id}].deleteChild(${id})`);

        if (!this.plugins.has(id))
            throw new Error(`${this.constructor.name}.deleteChild(${id}) not found in [${Array.from(this.plugins.keys()).join(', ')}]`);

        this.plugins.delete(id);
    }

}

Browser.register();
