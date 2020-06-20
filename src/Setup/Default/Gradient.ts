import { SetupBase } from '../SetupBase';
import { SetupBaseInterface } from '../SetupInterface';
import { JSONSchema7 } from 'json-schema';
import { observable } from 'mobx';
import { UiSchema } from '@rjsf/core';


export class Gradient extends SetupBase {
    static readonly schema: JSONSchema7 = {
        $id: Gradient.name,
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
                properties: {
                    className: { const: Gradient.name },
                    type: { type: 'string', enum: ['Solid', 'Circular', 'Horizontal', 'Vertical'], default: 'Circular' },
                    colors: {
                        type: 'array',
                        items: {
                            type: 'string',
                            default: '#ff0000'
                        },
                        minItems: 2,
                        default: ['#00ff00', '#0000ff']
                    }
                },
                required: ['type', 'colors']
            }
        ]
    }

    public static readonly uiSchema: UiSchema = {
        ...SetupBase.uiSchema,
        name: { 'ui:widget': 'hidden' },
        colors: { items: { 'ui:widget': 'color' }}
    };

    @observable type: 'Solid' | 'Circular' | 'Horizontal' | 'Vertical';
    @observable colors: string[];

    constructor(source: SetupBaseInterface) {
        super(source);

        this.type = source['type'];
        this.colors = this.createArray(source['colors'], 'colors');
    }


    static register(): void {
        SetupBase.register(Gradient, Gradient.schema, Gradient.uiSchema);
    }
}

Gradient.register();