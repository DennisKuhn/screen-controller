import { SetupBaseInterface } from '../SetupInterface';

export interface PerformanceInterface extends SetupBaseInterface{
    failing?: boolean;
    failsPerSecond?: number;
    ticksPerSecond?: number;
    timePerSecond?: number;
}