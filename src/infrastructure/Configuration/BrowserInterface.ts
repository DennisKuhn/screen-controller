import { SetupItemInterface } from './SetupItemInterface';
import { RectangleInterface } from './RectangleInterface';
import { Dictionary } from 'lodash';
import { PluginInterface } from './PluginInterface';

export interface BrowserInterface extends SetupItemInterface {
    readonly className: 'Browser';

    /**
     * Relative to display
     * @example {x:0, y:0, width:1, height:1} // fills the entire display
     */
    relative: RectangleInterface;

    /**
     * Scaled pixels as the browser perceives it
     */
    scaled?: RectangleInterface;
    /**
     * Device pixels
     */
    device?: RectangleInterface;

    plugins: Dictionary<PluginInterface>;
}

