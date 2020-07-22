import { SetupBaseInterface } from '../SetupInterface';
import { RectangleInterface } from '../Default/RectangleInterface';
import { PerformanceInterface } from './PerformanceInterface';

export interface PluginInterface extends SetupBaseInterface {
    relativeBounds: RectangleInterface;
    scaledBounds?: RectangleInterface;
    performance: PerformanceInterface;
}
