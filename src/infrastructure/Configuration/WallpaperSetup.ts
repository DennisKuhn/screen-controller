import { Dictionary, NumericDictionary } from 'lodash';

class IterableMap<T> implements NumericDictionary<T>, Iterable<T> {
    [key: number]: T;

    *[Symbol.iterator](): Iterator<T> {

        for (const itemId in this) {
            yield this[itemId];
        }
    }
}


export interface SetupInterface {
    displays: DisplayMapInterface;
}
export type DisplayMapInterface = NumericDictionary<DisplayInterface>;
export type DisplayDiffMapInterface = NumericDictionary<DisplayInterface| null>;
export type BrowserMapInterface = NumericDictionary<Browser>;
export type BrowserDiffMapInterface = NumericDictionary<Partial<Browser> | null>;

export class Setup implements SetupInterface {
    displays: IterableMap<Display> = new IterableMap<Display>();
}

export interface DisplayInterface {
    id: number;
    browsers: BrowserMapInterface;
}

export class Display implements DisplayInterface {
    constructor(id: number) {
        this.id = id;
    }
    id: number;

    browsers: IterableMap<Browser> = new IterableMap<Browser>();
}

export interface SetupDiffInterface {
    displays: DisplayDiffMapInterface;
}

export class SetupDiff {
    displays: IterableMap<DisplayDiff | null> = new IterableMap<DisplayDiff | null>();
}

export interface DisplayDiffInterface {
    id: number;
    browsers: BrowserDiffMapInterface;
}

export class DisplayDiff implements DisplayDiffInterface {
    constructor(id: number) {
        this.id = id;
    }
    id: number;

    browsers: IterableMap<Partial<Browser> | null> = new IterableMap<Partial<Browser> | null>();
}


/**
 * Bounds in %, relativ to display. Application unique id, e.g. auto increment from 1. 
 * config for paper usually ommited for performance, request explictly from Configuration/Controller
 * @example {rx:0, ry:0, rWidth:1, rHeight:1} fills the entire display
 **/
export interface Browser {
    /** Application unique, e.g. auto increment from 1 */
    id: number;
    rx: number;
    ry: number;
    rWidth: number;
    rHeight: number;
    config?: Config;
}

export interface Config {
    contentrating: string;
    description: string;
    file: string;
    preview: string;
    title: string;
    type: string;
    visibility: string;
    tags: string[];
    general: {
        supportsaudioprocessing: boolean;
        properties: Properties;
    };
}

type Properties = Dictionary<Property>;

export interface Option {
    label: string;
    value: string;
}

export interface Property {
    condition: string;
    order: number;
    text: string;
    type: string;
    max: number;
    min: number;
    value: string;
    options: Option[];
}

