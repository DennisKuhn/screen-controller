export type SetupItemId = string;

export interface SetupBaseInterface {
    /** Application unique, persistent, e.g. <ClassName>-<auto increment> */
    id: SetupItemId;
    parentId: SetupItemId;
    className: string;
}
