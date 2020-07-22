import { SetupBaseInterface, Dictionary } from '../SetupInterface';
import { PluginInterface } from './PluginInterface';
import { RectangleInterface as Rectangle } from '../Default/RectangleInterface';
import { PerformanceInterface } from './PerformanceInterface';

export interface Browser extends SetupBaseInterface {
    relative: Rectangle;
    scaled?: Rectangle;
    device?: Rectangle;
    plugins: Dictionary<PluginInterface>;
    performance: PerformanceInterface;
    performanceInterval: number;
    cpuUsage?: number;
    pid?: number;
}