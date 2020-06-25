import { Display } from './Display';
import { SetupBase } from '../SetupBase';
import { PropertyKey, SetupBaseInterface, SetupItemId } from '../SetupInterface';
import { ObservableSetupBaseMap } from '../Container';
import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { Gradient } from '../Default/Gradient';
import { observable } from 'mobx';
import { UiSchema } from '@rjsf/core';
import { create } from '../SetupFactory';
import { Time } from '../Default/Time';
import { cloneDeep } from 'lodash';

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
                    time: { allOf: [{ $ref: Time.name }, { 'sc-persist': false }] } as JSONSchema7Definition,
                    fps: { type: 'number', default: 5 },
                    rotateColors: { type: 'boolean', default: true },
                    rotateSteps: { type: 'number', default: 3, minimum: 1, maximum: 359 },
                    startGradient: { $ref: Gradient.name },
                    activeGradient: { allOf: [{ $ref: Gradient.name }, { 'sc-persist': false }] } as JSONSchema7Definition,
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
        
        this.displays = this.createMap<Display>(source['displays'], 'displays');

        this.rotateColors = source['rotateColors'];
        this.rotateSteps = source['rotateSteps'];

        this.fps = source['fps'];

        this.startGradient = new Gradient(source['startGradient']);
        if (source['activeGradient']) {
            this.activeGradient = new Gradient(source['activeGradient']);
        }
        if (source['longitude']) {
            this.longitude = source['longitude'];
        }
        if (source['latitude']) {
            this.latitude = source['latitude'];
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