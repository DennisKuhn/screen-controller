import { SetupBase } from '../SetupBase';
import { PropertyKey, SetupItemId, SetupBaseInterface } from '../SetupInterface';
import { SimpleRectangle, RectangleInterface } from './RectangleInterface';
import { JSONSchema7 } from 'json-schema';
import { observable } from 'mobx';
import { UiSchema } from '@rjsf/core';
import { asScSchema7 } from '../ScSchema7';

export class Rectangle extends SetupBase implements SimpleRectangle, RectangleInterface {
    public static readonly SCHEMA_REF = { $ref: Rectangle.name };

    static readonly schema: JSONSchema7 = {
        $id: Rectangle.name,
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                type: 'object',
                properties: {
                    className: { default: Rectangle.name },
                    name: asScSchema7({ scHidden: true }),
                    x: { type: 'number' },
                    y: { type: 'number' },
                    width: { type: 'number' },
                    height: { type: 'number' }
                },
                required: ['x', 'y', 'width', 'height']
            }
        ]
    }

    public static readonly uiSchema: UiSchema = {
        ...SetupBase.uiSchema,
        name: { 'ui:widget': 'hidden' }
    };

    @observable x: number;
    @observable y: number;
    @observable width: number;
    @observable height: number;

    constructor(source: SetupBaseInterface) {
        super(source);

        const sourceRect = source as RectangleInterface;

        this.x = sourceRect.x;
        this.y = sourceRect.y;
        this.width = sourceRect.width;
        this.height = sourceRect.height;
    }

    toSimple(): SimpleRectangle {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    static newInterface = (parentId: SetupItemId, parentProperty: PropertyKey, source: SimpleRectangle): SetupBaseInterface => ({
        ...SetupBase.createNewInterface(Rectangle.name, parentId, parentProperty),
        ...source
    });

    static create = (parentId: SetupItemId, parentProperty: PropertyKey, source: SimpleRectangle): Rectangle =>
        new Rectangle(Rectangle.newInterface(parentId, parentProperty, source));

    static register(): void {
        SetupBase.register(Rectangle, Rectangle.schema, Rectangle.uiSchema);
    }
}

Rectangle.register();