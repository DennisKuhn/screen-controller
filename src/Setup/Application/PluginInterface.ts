import { SetupBaseInterface } from '../SetupInterface';
import { RectangleInterface } from '../Default/RectangleInterface';

export interface PluginInterface extends SetupBaseInterface {
    relativeBounds: RectangleInterface;
    scaledBounds?: RectangleInterface;
}
