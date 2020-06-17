import { Display } from './Display';
import { SetupBase } from '../SetupBase';
import { SetupBaseInterface, SetupItemId } from '../SetupInterface';
import { ObservableSetupBaseMap } from '../Container';
import { JSONSchema7 } from 'json-schema';
import { Gradient } from '../Default/Gradient';
import { observable } from 'mobx';
import { UiSchema } from '@rjsf/core';

export class Screen extends SetupBase {
    static schema: JSONSchema7 = {
        $id: Screen.name,
        title: 'Screen',
        description: 'Screen element for setup',
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
                properties: {
                    id: { const: Screen.name },
                    className: { const: Screen.name },
                    parentId: { const: 'Root' },
                    rotateColors: { type: 'boolean', default: true },
                    fps: { type: 'number', default: 25 },
                    startGradient: { $ref: Gradient.name },
                    activeGradient: { $ref: Gradient.name },
                    displays: {
                        type: 'object',
                        additionalProperties: {
                            oneOf: [
                                { $ref: Display.name },
                                { type: 'null' }
                            ]
                        }
                    }
                },
                required: ['displays', 'fps', 'rotateColors', 'startGradient' ]
            }
        ]
    };

    public static readonly uiSchema: UiSchema = {
        ...SetupBase.uiSchema,
        activeGradient: { 'ui:widget': 'hidden' }
    };


    displays: ObservableSetupBaseMap<Display>;
    @observable rotateColors = true;
    @observable fps: number;
    startGradient: Gradient;
    activeGradient?: Gradient;

    constructor(source: SetupBaseInterface) {
        super(source);
        
        this.displays = this.createMap<Display>(source['displays'], 'displays');

        this.rotateColors = source['rotateColors'];
        this.fps = source['fps'];

        this.startGradient = new Gradient(source['startGradient']);
        if (source['activeGradient']) {
            this.activeGradient = new Gradient(source['activeGradient']);
        }
    }

    static newInterface = (parentId: SetupItemId): SetupBaseInterface => ({
        ...SetupBase.createNewInterface(Screen.name, parentId, Screen.name),
        displays: {}
    } as SetupBaseInterface);


    static createNewBlank = (parentId: SetupItemId): Screen =>
        new Screen(
            Screen.newInterface(parentId)
        );

    static register(): void {
        SetupBase.register(Screen, Screen.schema, Screen.uiSchema);
    }
}

Screen.register();