import { Dictionary, NumericDictionary } from 'lodash';

class IterableNumberMap<T> implements NumericDictionary<T>, Iterable<T> {
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
export type DisplayDiffMapInterface = NumericDictionary<DisplayDiffInterface | null>;
export type BrowserMapInterface = NumericDictionary<Browser>;
export type BrowserDiffMapInterface = NumericDictionary<Partial<Browser> | null>;

export interface DisplayInterface {
    id: number;
    browsers: BrowserMapInterface;
}

export class Display implements DisplayInterface {
    constructor(id: number) {
        this.id = id;
    }
    id: number;

    browsers: IterableNumberMap<Browser> = new IterableNumberMap<Browser>();
}

export class Setup implements SetupInterface {
    displays: IterableNumberMap<Display> = new IterableNumberMap<Display>();

    constructor(setup?: SetupInterface) {
        if (setup) {
            for (const displayPair of Object.entries(setup.displays)) {
                const display = new Display(Number(displayPair[0]));
                this.displays[Number(displayPair[0])] = display;

                for (const browserPair of Object.entries(displayPair[1].browsers)) {
                    display.browsers[browserPair[0]] = browserPair[1];
                }
            }
        }
    }
}



export interface SetupDiffInterface {
    displays: DisplayDiffMapInterface;
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

    browsers: IterableNumberMap<Partial<Browser> | null> = new IterableNumberMap<Partial<Browser> | null>();
}

export class SetupDiff implements SetupDiffInterface {
    displays: IterableNumberMap<DisplayDiff | null> = new IterableNumberMap<DisplayDiff | null>();

    constructor(setup?: SetupDiffInterface) {
        if (setup) {
            for (const displayPair of Object.entries(setup.displays)) {
                if (displayPair[1]) {
                    const display = new DisplayDiff(Number(displayPair[0]));
                    this.displays[Number(displayPair[0])] = display;

                    for (const browserPair of Object.entries(displayPair[1].browsers)) {
                        display.browsers[browserPair[0]] = browserPair[1];
                    }
                } else {
                    this.displays[Number(displayPair[0])] = null;
                }
            }
        }
    }

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

