import { Display } from './Display';
import { SetupBase } from '../SetupBase';
import { SetupBaseInterface, SetupItemId } from '../SetupInterface';
import { ObservableSetupBaseMap } from '../Container';
import { JSONSchema7 } from 'json-schema';
import { Gradient } from '../Default/Gradient';
import { observable } from 'mobx';

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
                required: ['displays', 'rotateColors', 'startGradient' ]
            }
        ]
    };

    displays: ObservableSetupBaseMap<Display>;
    @observable rotateColors = true;
    startGradient: Gradient;
    activeGradient?: Gradient;

    constructor(source: SetupBaseInterface) {
        super(source);

        this.displays = this.createMap<Display>(source['displays'], 'displays');
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
        SetupBase.register(Screen, Screen.schema, {});
    }
}

Screen.register();