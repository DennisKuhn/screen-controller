import { SetupItemInterface } from './SetupItemInterface';
import { RectangleInterface } from './RectangleInterface';

export interface PluginInterface extends SetupItemInterface {
    relativeBounds: RectangleInterface;
    scaledBounds: RectangleInterface | undefined;
}

