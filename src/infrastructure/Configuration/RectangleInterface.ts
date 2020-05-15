import { SetupItemInterface } from './SetupItemInterface';

export interface RectangleInterface extends SetupItemInterface {
    className: 'Rectangle';
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface SimpleRectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}
