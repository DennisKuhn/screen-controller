import { SetupBase } from '../SetupBase';
import { PerformanceInterface } from './PerformanceInterface';
import { observable } from 'mobx';
import { asScSchema7, ScSchema7 } from '../ScSchema7';
import { SetupItemId, PropertyKey } from '../SetupInterface';

export default class Performance extends SetupBase implements PerformanceInterface {
    static readonly schema: ScSchema7 = {
        $id: Performance.name,
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
                properties: {
                    className: { const: Performance.name },
                    name: asScSchema7({ scHidden: true }),
                    failing: asScSchema7({ type: 'boolean', minimum: 0, scViewOnly: true, scVolatile: true }),
                    failsPerSecond: asScSchema7({ type: 'number', minimum: 0, scViewOnly: true, scVolatile: true }),
                    ticksPerSecond: asScSchema7({ type: 'number', minimum: 0, scViewOnly: true, scVolatile: true }),
                    timePerSecond: asScSchema7({ type: 'number', minimum: 0, scViewOnly: true, scVolatile: true }),
                }
            }
        ]
    }

    @observable failing?: boolean;
    @observable failsPerSecond?: number;
    @observable ticksPerSecond?: number;
    @observable timePerSecond?: number;

    constructor(source: PerformanceInterface) {
        super(source);

        this.failing = source.failing;
        this.failsPerSecond = source.failsPerSecond;
        this.ticksPerSecond = source.ticksPerSecond;
        this.timePerSecond = source.timePerSecond;
    }

    static newInterface = (parentId: SetupItemId, parentProperty: PropertyKey, id?: SetupItemId): PerformanceInterface => ({
        ...SetupBase.createNewInterface(Performance.name, parentId, parentProperty, id)
    });


    static register(): void {
        SetupBase.register(Performance, Performance.schema);
    }
}

Performance.register();