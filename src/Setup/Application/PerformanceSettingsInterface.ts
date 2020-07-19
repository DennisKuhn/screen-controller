import { SetupBaseInterface } from '../SetupInterface';

export interface PerformanceSettingsInterface extends SetupBaseInterface {
    updateInterval: number;
    bufferSize: number;
}
