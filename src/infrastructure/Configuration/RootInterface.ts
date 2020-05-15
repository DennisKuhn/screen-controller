import { ScreenInterface } from './ScreenInterface';
import { SetupItemInterface } from './SetupItemInterface';

export type RootID = 'Root';

export interface RootInterface extends SetupItemInterface {
    id: RootID;
    parentId: RootID;
    className: 'Root';
    screen: ScreenInterface;
}

