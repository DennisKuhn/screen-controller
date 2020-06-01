import { SetupBase } from '../SetupBase';
import { SetupItemId, SetupBaseInterface } from '../SetupInterface';
import { SimpleRectangle, RectangleInterface } from './RectangleInterface';
import { JSONSchema7 } from 'json-schema';
import { observable } from 'mobx';

export class Rectangle extends SetupBase implements SimpleRectangle, RectangleInterface {
    public static readonly SCHEMA_REF = { $ref: SetupBase.name };

    static readonly schema: JSONSchema7 = {
        $id: Rectangle.name,
        allOf: [
            SetupBase.SCHEMA_REF,
            {
                properties: {
                    className: { const: Rectangle.name },
                    x: { type: 'number' },
                    y: { type: 'number' },
                    width: { type: 'number' },
                    height: { type: 'number' }
                },
                required: ['x', 'y', 'width', 'height']
            }
        ]
    }

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

    static newInterface = (parentId: SetupItemId, source: SimpleRectangle): SetupBaseInterface => ({
        ...SetupBase.createNewInterface(Rectangle.name, parentId),
        ...source
    });

    static createNew = (parentId: SetupItemId, source: SimpleRectangle): Rectangle => new Rectangle(Rectangle.newInterface(parentId, source));

    static register(): void {
        SetupBase.register(Rectangle, Rectangle.schema);
    }
}

Rectangle.register();