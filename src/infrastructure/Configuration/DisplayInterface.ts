import { ScreenID } from './ScreenInterface';
import { SetupItemInterface } from './SetupItemInterface';
import { Dictionary } from 'lodash';
import { BrowserInterface } from './BrowserInterface';

export interface DisplayInterface extends SetupItemInterface {
    parentId: ScreenID;
    className: 'Display';

    browsers: Dictionary<BrowserInterface>;
}

