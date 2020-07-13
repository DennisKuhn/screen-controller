import { UiSchema } from '@rjsf/core';
import { JSONSchema7 } from 'json-schema';
import { observable } from 'mobx';
import { callerAndfName } from '../../utils/debugging';
import { ObservableSetupBaseMap } from '../Container';
import { Rectangle } from '../Default/Rectangle';
import { SimpleRectangle } from '../Default/RectangleInterface';
import { RelativeRectangle } from '../Default/RelativeRectangle';
import { SetupBase } from '../SetupBase';
import { PropertyKey, SetupBaseInterface, SetupItemId } from '../SetupInterface';
import { Browser as BrowserInterface } from './BrowserInterface';
import { Plugin } from './Plugin';
import { asScSchema7, ScSchema7 } from '../ScSchema7';

export class Browser extends SetupBase {

    static readonly schema: ScSchema7 = {
        $id: Browser.name,
        title: 'Browser',
        description: 'Container for plugins',
        scIcon: 'web',
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
                properties: {
                    className: { const: Browser.name },
                    relative: { $ref: RelativeRectangle.name },
                    scaled: {
                        allOf: [
                            { $ref: Rectangle.name },
                            asScSchema7({ scHidden: true })
                        ]
                    },
                    device: {
                        allOf: [
                            { $ref: Rectangle.name },
                            asScSchema7({ scHidden: true })
                        ]
                    },
                    performanceInterval: { type: 'number', default: 1000 },
                    cpuUsage: asScSchema7({ type: 'number', scViewOnly: true, scVolatile: true }),
                    pid: asScSchema7({ type: 'number', scViewOnly: true }),
                    plugins: {
                        $id: Browser.name + '.plugins',
                        type: 'object',
                        additionalProperties: {
                            oneOf: [
                                { $ref: Plugin.name },
                                { type: 'null' }
                            ]
                        }
                    }
                },
                required: ['relative', 'plugins', 'performanceInterval']
            }
        ]
    };

    public static readonly uiSchema: UiSchema = {
        scaled: { 'ui:widget': 'hidden' },
        device: { 'ui:widget': 'hidden' },
        pid: { 'ui:readonly': true },
        cpuUsage: { 'ui:readonly': true }
    };


    @observable relative: RelativeRectangle;
    @observable scaled?: Rectangle;
    @observable device?: Rectangle;
    @observable performanceInterval: number;
    @observable cpuUsage?: number;
    @observable pid?: number;

    plugins: ObservableSetupBaseMap<Plugin>;

    constructor(source: SetupBaseInterface) {
        super(source);
        const setup = source as BrowserInterface;
        
        this.performanceInterval = setup.performanceInterval;        

        this.relative = new RelativeRectangle(source['relative']);
        if (setup.scaled !== undefined) {
            this.scaled = new Rectangle(setup.scaled);
        }
        if (setup.device !== undefined) {
            this.device = new Rectangle(setup.device);
        }
        if (setup.pid !== undefined) {
            this.pid = setup.pid;
        }
        if (setup.cpuUsage !== undefined) {
            this.cpuUsage = setup.cpuUsage;
        }
        this.plugins = this.createMap<Plugin>(setup.plugins, 'plugins');
    }


    static create(parentId: SetupItemId, parentProperty: PropertyKey, relative: SimpleRectangle): Browser {
        const newConfig = SetupBase.createNewInterface(Browser.name, parentId, parentProperty);

        return new Browser( 
            {
                ...newConfig,
                plugins: {},
                relative: RelativeRectangle.newInterface(newConfig.id, 'relative', relative)
            } as SetupBaseInterface
        );
    }

    static register(): void {
        SetupBase.register(Browser, Browser.schema, Browser.uiSchema);
    }

    addPlugin = (schema: JSONSchema7 ): void => { 
        const plugin = Plugin.create(this.id, 'plugins', schema);

        this.plugins.set(
            plugin.id,
            plugin
        );
    }

    deleteChild(id: SetupItemId): void {
        console.log(`${this.constructor.name}[${this.id}].deleteChild(${id})`);

        if (!this.plugins.has(id))
            throw new Error(`${callerAndfName()}(${id}) not found in [${Array.from(this.plugins.keys()).join(', ')}]`);

        this.plugins.delete(id);
    }

}

Browser.register();
