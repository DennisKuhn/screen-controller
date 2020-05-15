import { DisplayInterface } from './DisplayInterface';
import { RootID } from './RootInterface';
import { SetupItemInterface } from './SetupItemInterface';
import { Dictionary } from 'lodash';

export type ScreenID = 'Screen';

export interface ScreenInterface extends SetupItemInterface {
    id: ScreenID;
    parentId: RootID;
    className: 'Screen';
    displays: Dictionary<DisplayInterface>;
}

