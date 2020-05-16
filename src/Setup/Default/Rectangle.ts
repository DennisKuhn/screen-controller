import { observable } from 'mobx';
import { SetupBase, SetupItemId, SetupBaseInterface } from '../SetupBase';
import { SimpleRectangle } from './RectangleInterface';
import { JSONSchema7 } from 'json-schema';

export class Rectangle extends SetupBase {
    static readonly schema: JSONSchema7 = {
        $id: '#' + Rectangle.name,
        allOf: [
            {
                $ref: '#' + SetupBase.name
            },
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

    @observable
    x: number;

    @observable
    y: number;

    @observable
    width: number;

    @observable
    height: number;

    className: 'Rectangle' = 'Rectangle';

    constructor(source: SetupBaseInterface) {
        super(source);

        const {x, y, width, height } = (super.update(source) as Rectangle);

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    get simple(): SimpleRectangle {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    static createNew(parentId: SetupItemId, source: SimpleRectangle): Rectangle {
        return new Rectangle({
            id: SetupBase.getNewId(Rectangle),
            parentId: parentId,
            className: Rectangle.name,
            ...source
        });
    }

    static register= (): void => SetupBase.register( Rectangle, Rectangle.schema );
}

Rectangle.register();