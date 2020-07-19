import { observable } from 'mobx';
import { ObservableSetupBaseMap } from '../Container';
import { Rectangle } from '../Default/Rectangle';
import { SimpleRectangle } from '../Default/RectangleInterface';
import { RelativeRectangle } from '../Default/RelativeRectangle';
import { SetupBase } from '../SetupBase';
import { PropertyKey, SetupBaseInterface, SetupItemId } from '../SetupInterface';
import { Browser as BrowserInterface } from './BrowserInterface';
import { Plugin } from './Plugin';
import { asScSchema7, ScSchema7 } from '../ScSchema7';
import Performance from './Performance';

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
                    performance: { $ref: Performance.name },

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
                required: ['relative', 'plugins', 'performance']
            }
        ]
    };


    @observable relative: RelativeRectangle;
    @observable scaled?: Rectangle;
    @observable device?: Rectangle;
    @observable performance: Performance;
    @observable pid?: number;

    plugins: ObservableSetupBaseMap<Plugin>;

    constructor(source: SetupBaseInterface) {
        super(source);
        const setup = source as BrowserInterface;
        
        this.performance = new Performance(setup.performance);

        this.relative = new RelativeRectangle(setup.relative);

        if (setup.scaled !== undefined) {
            this.scaled = new Rectangle(setup.scaled);
        }
        if (setup.device !== undefined) {
            this.device = new Rectangle(setup.device);
        }
        if (setup.pid !== undefined) {
            this.pid = setup.pid;
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
        SetupBase.register(Browser, Browser.schema);
    }
}

Browser.register();
