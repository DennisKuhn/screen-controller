import { SetupBase } from '../SetupBase';
import { SetupBaseInterface } from '../SetupInterface';
import { Screen } from './Screen';
import { observable } from 'mobx';
import { asScSchema7, ScSchema7 } from '../ScSchema7';
import { PerformanceSettings } from './PerformanceSettings';
import Performance from './Performance';
import { ObservableSetupBaseMap } from '../Container';

export class Root extends SetupBase {
    static schema: ScSchema7 = {
        $id: Root.name,
        title: 'Root',
        description: 'Root element for setup',
        scIcon: 'settings_applications',
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
                properties: {
                    id: { const: Root.name },
                    className: { const: Root.name },
                    parentId: { const: Root.name },
                    screen: { $ref: Screen.name },
                    performanceSettings: { $ref: PerformanceSettings.name },
                    mainPerformance: {
                        allOf: [
                            { $ref: Performance.name },
                            asScSchema7({ scViewOnly: true })
                        ]
                    },
                    mainPid: asScSchema7({ type: 'number', scViewOnly: true }),
                    performanceMonitors: asScSchema7( {
                        $id: Screen.name + '.displays',
                        type: 'object',
                        scViewOnly: true,
                        additionalProperties: {
                            oneOf: [
                                { $ref: Performance.name },
                                { type: 'null' }
                            ]
                        }
                    }),
                },
                required: ['screen', 'mainPerformance', 'performanceMonitors', 'performanceSettings']
            }
        ]
    };

    screen: Screen;
    mainPerformance: Performance;
    performanceSettings: PerformanceSettings;
    performanceMonitors: ObservableSetupBaseMap<Performance>;
    @observable mainPid?: number;

    constructor(source: SetupBaseInterface) {
        super(source);
        this.mainPerformance = new Performance(source['mainPerformance']);
        this.performanceSettings = new PerformanceSettings(source['performanceSettings']);
        this.screen = new Screen(source['screen']);
        this.performanceMonitors = super.createMap(source['performanceMonitors'], 'performanceMonitors');
    }

    static createNewBlank = (): Root => new Root(
        {
            ...SetupBase.createNewInterface(Root.name, Root.name, 'parentId', Root.name),
            screen: Screen.newInterface(Root.name, 'screen'),
            mainPerformance: Performance.newInterface(Root.name, 'mainPerformance', 'mainPerformance'),
            performanceSettings: PerformanceSettings.newInterface(Root.name, 'performanceSettings', PerformanceSettings.name),
        } as SetupBaseInterface
    );

    static register(): void {
        SetupBase.register(Root, Root.schema);
    }
}

Root.register();
