import { observable } from 'mobx';
import { Dictionary, NumericDictionary } from 'lodash';

export class IterableNumberDictionary<T> implements NumericDictionary<T>, Iterable<T> {
    [key: number]: T;

    *[Symbol.iterator](): Iterator<T> {

        for (const itemId in this) {
            yield this[itemId];
        }
    }

    get values(): T[] {
        return Object.values(this);
    }

    get keys(): number[] {
        return Object.keys(this).map( s => Number(s) );
    }

    /**
     * 
     * @param source Create a shallow copy
     */
    constructor(source?: IterableNumberDictionary<T>) {
        if (source) {
            for (const key in source) {
                this[key] = { ...source[key] };
            }
        }
    }
}


export interface SetupInterface {
    displays: DisplayInterfaceDictionary;
}

export type DisplayInterfaceDictionary = NumericDictionary<DisplayInterface>;
export type DisplayDiffInterfaceDictionary = NumericDictionary<DisplayDiffInterface | null>;
export type BrowserInterfaceDictionary = NumericDictionary<Browser>;
export type BrowserDiffInterfaceDictionary = NumericDictionary<Partial<Browser> | null>;

export class DisplayIterableDictionary extends IterableNumberDictionary<Display> { 

}
export class DisplayDiffIterableDictionary extends IterableNumberDictionary<DisplayDiff | null> {

}
export class BrowserDiffIterableDictionary extends IterableNumberDictionary<Partial<Browser> | null> {

}
export class BrowserIterableDictionary extends IterableNumberDictionary<Browser> {

}

/**
 * Bounds in %, relativ to display. Application unique id, e.g. auto increment from 1. 
 * config for Browser usually ommited for performance, request explictly from Configuration/Controller
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

export class Browser implements Browser {
    /** Application unique, e.g. auto increment from 1 */
    @observable id: number;
    @observable rx: number;
    @observable ry: number;
    @observable rWidth: number;
    @observable rHeight: number;
    @observable config?: Config;

    constructor(source: Browser) {
        this.id = source.id;
        this.rx = source.rx;
        this.ry = source.ry;
        this.rWidth = source.rWidth;
        this.rHeight = source.rHeight;
        this.config = source.config;
    }
}


export interface DisplayInterface {
    id: number;
    browsers: BrowserInterfaceDictionary;
}

export class Display implements DisplayInterface {
    @observable public id: number
    constructor(display: DisplayInterface) {
        this.id = display.id;
        for (const sourceBrowser of Object.values( display.browsers )) {
            this.browsers[sourceBrowser.id] = new Browser(sourceBrowser);
        }
    }

    @observable browsers: BrowserIterableDictionary = new BrowserIterableDictionary();
}


export class Setup implements SetupInterface {
    @observable displays: DisplayIterableDictionary = new DisplayIterableDictionary();

    constructor(setup?: SetupInterface) {
        if (setup) {
            for (const sourceDisplay of Object.values(setup.displays)) {
                const display = new Display(sourceDisplay);
                this.displays[sourceDisplay.id] = display;
            }
        }
    }
}


export interface SetupDiffInterface {
    displays: DisplayDiffInterfaceDictionary;
}

export interface DisplayDiffInterface {
    id: number;
    browsers: BrowserDiffInterfaceDictionary;
}

export class DisplayDiff implements DisplayDiffInterface {
    constructor(id: number) {
        this.id = id;
    }
    id: number;

    browsers: BrowserDiffIterableDictionary = new BrowserDiffIterableDictionary();
}

export class SetupDiff implements SetupDiffInterface {
    displays: DisplayDiffIterableDictionary = new DisplayDiffIterableDictionary();

    constructor(setup?: SetupDiffInterface) {
        if (setup) {
            for (const [displayId, sourceDisplay] of Object.entries(setup.displays)) {
                if (sourceDisplay) {
                    const display = new DisplayDiff(Number(displayId));
                    this.displays[Number(displayId)] = display;

                    for (const [browserId, sourceBrowser] of Object.entries(sourceDisplay.browsers)) {
                        display.browsers[browserId] = sourceBrowser;
                    }
                } else {
                    this.displays[Number(displayId)] = null;
                }
            }
        }
    }

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

export type Properties = Dictionary<Property>;

export interface Option {
    label: string;
    value: string | number | boolean;
}

export interface Property {
    condition?: string;
    order: number;
    text: string;
    type: string; // ['bool' | 'slider' | 'textinput' | 'directory'];
    max?: number;
    min?: number;
    value?: string | number | boolean;
    options?: Option[];
}

