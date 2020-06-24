import { SetupBaseInterface, Dictionary } from '../SetupInterface';
import { Gradient } from '../Default/GradientInterface';
import { Time } from '../Default/TimeInterface';
import { Display } from './DisplayInterface';

export interface Screen extends SetupBaseInterface {
    displays: Dictionary<Display>;
    rotateColors: boolean;
    fps: number;
    startGradient: Gradient;
    activeGradient?: Gradient;
    time?: Time;
    longitude?: number;
    latitude?: number;
}