import { Dictionary } from 'lodash';

export type SetupItemId = string;

export interface SetupBaseInterface {
    /** Application unique, persistent, e.g. <ClassName>-<auto increment> */
    id: SetupItemId;
    parentId: SetupItemId;
    className: string;

    [key: string]: SetupBaseInterface | Dictionary<SetupBaseInterface> | string | number | boolean;
}
