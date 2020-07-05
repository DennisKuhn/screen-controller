import { Display } from './Display';
import { SetupBase } from '../SetupBase';
import { PropertyKey, SetupBaseInterface, SetupItemId } from '../SetupInterface';
import { Screen as ScreenInterface } from './ScreenInterface';
import { ObservableSetupBaseMap } from '../Container';
import { JSONSchema7 } from 'json-schema';
import { Gradient } from '../Default/Gradient';
import { observable } from 'mobx';
import { UiSchema } from '@rjsf/core';
import { create } from '../SetupFactory';
import { Time } from '../Default/Time';
import { asScSchema7 } from '../ScSchema7';

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
                    longitude: { type: 'number' },
                    latitude: { type: 'number' },
                    time: { allOf: [{ $ref: Time.name }, asScSchema7({ scVolatile: true })] },
                    fps: { type: 'number', default: 5 },
                    rotateColors: { type: 'boolean', default: true },
                    rotateSteps: { type: 'number', default: 3, minimum: 1, maximum: 359 },
                    startGradient: { $ref: Gradient.name },
                    activeGradient: { allOf: [{ $ref: Gradient.name }, asScSchema7({ scHidden: true, scVolatile: true })] },
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
    @observable rotateSteps: number;
    @observable fps: number;
    @observable startGradient: Gradient;
    @observable activeGradient?: Gradient;
    @observable time?: Time;
    @observable longitude?: number;
    @observable latitude?: number;

    constructor(source: SetupBaseInterface) {
        super(source);
        const setup = source as ScreenInterface;
        
        this.displays = this.createMap<Display>(setup.displays, 'displays');

        this.rotateColors = setup.rotateColors;
        this.rotateSteps = setup.rotateSteps;

        this.fps = setup.fps;

        this.startGradient = new Gradient(setup.startGradient);
        if (setup.activeGradient) {
            this.activeGradient = new Gradient(setup.activeGradient);
        }
        if (setup.longitude) {
            this.longitude = setup.longitude;
        }
        if (setup.latitude) {
            this.latitude = setup.latitude;
        }
        if (setup.time) {
            this.time = new Time(setup.time);
        }
    }

    static newInterface = (parentId: SetupItemId, parentProperty: PropertyKey): SetupBaseInterface => ({
        ...SetupBase.createNewInterface(Screen.name, parentId, parentProperty, Screen.name),
        displays: {}
    } as SetupBaseInterface);

    createActiveGradient(): void {
        this.activeGradient = create(
            {
                ...this.startGradient,
                ...SetupBase.createNewInterface(Gradient.name, this.id, 'activeGradient')
            }) as Gradient;
    }

    static createNewBlank = (parentId: SetupItemId, parentProperty: PropertyKey): Screen =>
        new Screen(
            Screen.newInterface(parentId, parentProperty)
        );

    static register(): void {
        SetupBase.register(Screen, Screen.schema, Screen.uiSchema);
    }
}

Screen.register();