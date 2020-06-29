import { SetupBaseInterface, Dictionary } from '../SetupInterface';
import { PluginInterface } from './PluginInterface';
import { RectangleInterface as Rectangle } from '../Default/RectangleInterface';

export interface Browser extends SetupBaseInterface {
    relative: Rectangle;
    scaled?: Rectangle;
    device?: Rectangle;
    plugins: Dictionary<PluginInterface>;
    performanceInterval: number;
    cpuUsage?: number;
}