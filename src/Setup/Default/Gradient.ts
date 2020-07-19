import { SetupBase } from '../SetupBase';
import { SetupBaseInterface } from '../SetupInterface';
import { JSONSchema7 } from 'json-schema';
import { observable } from 'mobx';
import { Gradient as GradientInterface } from './GradientInterface';
import { ObservableArray } from '../Container';
import { asScSchema7 } from '../ScSchema7';

export class Gradient extends SetupBase implements GradientInterface {
    static readonly schema: JSONSchema7 = {
        $id: Gradient.name,
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
                properties: {
                    className: { const: Gradient.name },
                    name: asScSchema7({scHidden: true}),
                    type: { type: 'string', enum: ['Solid', 'Circular', 'Horizontal', 'Vertical'], default: 'Circular' },
                    colors: {
                        type: 'array',
                        items: asScSchema7({
                            type: 'string',
                            scFormat: 'color',
                            default: '#ff0000'
                        }),
                        minItems: 2,
                        default: ['#00ff00', '#0000ff']
                    }
                },
                required: ['type', 'colors']
            }
        ]
    }

    @observable type: 'Solid' | 'Circular' | 'Horizontal' | 'Vertical';
    @observable colors: ObservableArray<string>;

    constructor(source: SetupBaseInterface) {
        super(source);

        this.type = source['type'];
        this.colors = this.createArray(source['colors'], 'colors');
    }


    static register(): void {
        SetupBase.register(Gradient, Gradient.schema);
    }
}

Gradient.register();