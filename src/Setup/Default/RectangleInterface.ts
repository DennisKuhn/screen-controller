import { SetupBaseInterface } from '../SetupInterface';

export interface SimpleRectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RectangleInterface extends SetupBaseInterface, SimpleRectangle {

}