export type SetupItemId = string;

export interface SetupLinkInterface {
    /** Application unique, persistent, e.g. <ClassName>-<auto increment> */
    id: SetupItemId;
}

export interface SetupBaseInterface {
    /** Application unique, persistent, e.g. <ClassName>-<auto increment> */
    id: SetupItemId;
    parentId: SetupItemId;
    className: string;

    //@todo Ensured sub interface only use known types,
    // creates problem when used by a class as implements
    //[key: string]: SetupBaseInterface | Dictionary<SetupBaseInterface> | string | number | boolean;
}

export interface Dictionary<T> {
    [index: string]: T;
}

export type PropertyKey = string;

export type PropertyType =
    SetupLinkInterface |
    SetupBaseInterface |
    Dictionary<SetupBaseInterface> |
    string |
    number |
    boolean;
