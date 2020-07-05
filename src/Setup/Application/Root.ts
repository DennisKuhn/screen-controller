import { SetupBase } from '../SetupBase';
import { SetupBaseInterface } from '../SetupInterface';
import { Screen } from './Screen';
import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { observable } from 'mobx';

export class Root extends SetupBase {
    static schema: JSONSchema7 = {
        $id: Root.name,
        title: 'Root',
        description: 'Root element for setup',
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
                properties: {
                    id: { const: Root.name },
                    className: { const: Root.name },
                    parentId: { const: Root.name },
                    screen: { $ref: Screen.name },
                    mainPerformanceInterval: { type: 'number', default: 1000 },
                    mainCpuUsage: { type: 'number', scPersist: false } as JSONSchema7Definition,
                    mainPid: { type: 'number' },
                },
                required: ['screen', 'mainPerformanceInterval']
            }
        ]
    };

    screen: Screen;
    @observable mainPerformanceInterval: number;
    @observable mainCpuUsage?: number;
    @observable mainPid?: number;

    constructor(source: SetupBaseInterface) {
        super(source);
        this.mainPerformanceInterval = source['mainPerformanceInterval'];
        this.screen = new Screen(source['screen']);
    }

    static createNewBlank = (): Root => new Root(
        {
            ...SetupBase.createNewInterface(Root.name, Root.name, 'parent', Root.name),
            screen: Screen.newInterface(Root.name, 'screen'),
            mainPerformanceInterval: 1000
        } as SetupBaseInterface
    );

    static register(): void {
        SetupBase.register(Root, Root.schema, {});
    }
}

Root.register();