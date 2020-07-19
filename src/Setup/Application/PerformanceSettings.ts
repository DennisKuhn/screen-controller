import { SetupBase } from '../SetupBase';
import { observable } from 'mobx';
import { ScSchema7, asScSchema7 } from '../ScSchema7';
import { SetupBaseInterface, PropertyKey, SetupItemId } from '../SetupInterface';
import { PerformanceSettingsInterface } from './PerformanceSettingsInterface';


export class PerformanceSettings extends SetupBase implements PerformanceSettingsInterface {
    static readonly schema: ScSchema7 = {
        $id: PerformanceSettings.name,
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
                properties: {
                    className: { const: PerformanceSettings.name },
                    name: asScSchema7({ scHidden: true }),
                    updateInterval: { type: 'number', minimum: 0, default: 1000 },
                    bufferSize: { type: 'number', minimum: 2, default: 60 },
                },
                required: ['updateInterval', 'bufferSize']
            }
        ]
    }

    @observable updateInterval: number;
    @observable bufferSize: number;

    constructor(source: SetupBaseInterface) {
        super(source);

        this.updateInterval = source['updateInterval'];
        this.bufferSize = source['bufferSize'];
    }

    static newInterface = (parentId: SetupItemId, parentProperty: PropertyKey, id?: SetupItemId): PerformanceSettingsInterface => ({
        ...SetupBase.createNewInterface(PerformanceSettings.name, parentId, parentProperty, id),
        bufferSize: 60,
        updateInterval: 1000
    });

    static register(): void {
        SetupBase.register(PerformanceSettings, PerformanceSettings.schema);
    }
}

PerformanceSettings.register();