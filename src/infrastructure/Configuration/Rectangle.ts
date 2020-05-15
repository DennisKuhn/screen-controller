import { observable } from 'mobx';
import { SetupItem } from './SetupItem';
import { SimpleRectangle } from './RectangleInterface';
import { SetupItemId, SetupBaseInterface } from './SetupBaseInterface';
import { JSONSchema7 } from 'json-schema';


export class Rectangle extends SetupItem {
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
            id: SetupItem.getNewId(Rectangle),
            parentId: parentId,
            className: Rectangle.name,
            ...source
        });
    }

    static register(): void {
        SetupItem.register({
            factory: Rectangle,
            schema: Rectangle.schema
        });
    }
}

Rectangle.register();
