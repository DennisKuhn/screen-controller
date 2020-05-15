import { observable } from 'mobx';
import { SetupItem } from './SetupItem';
import { RectangleInterface, SimpleRectangle } from './RectangleInterface';
import { SetupItemId } from './SetupBaseInterface';


export class Rectangle extends SetupItem implements RectangleInterface {
    @observable
    x: number;

    @observable
    y: number;

    @observable
    width: number;

    @observable
    height: number;

    className: 'Rectangle' = 'Rectangle';

    constructor(source: RectangleInterface) {
        super(source);
        this.x = source.x;
        this.y = source.y;
        this.width = source.width;
        this.height = source.height;
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
            id: SetupItem.getNewId('Rectangle'),
            parentId: parentId,
            className: 'Rectangle',
            ...source
        });
    }
}
