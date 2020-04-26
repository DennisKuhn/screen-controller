import { observable, ObservableMap, reaction } from 'mobx';
import { Dictionary } from 'lodash';

export class ObservableArrayMap<K, V> extends ObservableMap<K, V> {

    map<O>(mapper: (value: V) => O): O[] {
        const result: O[] = new Array<O>(this.size);
        let i = 0;

        for (const value of this.values()) {
            result[i] = mapper(value);
            i += 1;
        }

        return result;
    }
}

export class DisplayIterableDictionary extends ObservableArrayMap<string, Display> {

}
export class BrowserIterableDictionary extends ObservableArrayMap<string, Browser> {

}

export interface BrowserInterface {
    id: string;
    rx: number;
    ry: number;
    rWidth: number;
    rHeight: number;
    config?: Config;
}

/**
 * Bounds in %, relativ to display. Application unique id, e.g. auto increment from 1. 
 * config for Browser usually ommited for performance, request explictly from Configuration/Controller
 * @example {rx:0, ry:0, rWidth:1, rHeight:1} fills the entire display
 **/
export class Browser {
    /** Application unique, e.g. auto increment from 1 */
    @observable id: string;
    @observable rx: number;
    @observable ry: number;
    @observable rWidth: number;
    @observable rHeight: number;
    @observable config?: Config;

    constructor(source: BrowserInterface) {
        this.id = source.id;
        this.rx = source.rx;
        this.ry = source.ry;
        this.rWidth = source.rWidth;
        this.rHeight = source.rHeight;
        this.config = source.config;
    }
}

export interface DisplayInterface {
    id: string;

    browsers: Dictionary<BrowserInterface>;
}


export class Display {
    @observable public id: string;
    @observable browsers: BrowserIterableDictionary;

    constructor(displayId: string, onLocalBrowsersChange?) {
        this.id = displayId;
        this.browsers = new BrowserIterableDictionary();
        if (onLocalBrowsersChange) {
            this.browsers.observe(onLocalBrowsersChange, false);
        }
    }

    get plain(): DisplayInterface {
        return { id: this.id, browsers: {} };
    }
}

export interface SetupInterface {
    displays: Dictionary<DisplayInterface>;
}

export class Setup {
    @observable displays: DisplayIterableDictionary;

    constructor() {
        this.displays = new DisplayIterableDictionary();
        // this.displays = new DisplayIterableDictionary();
    }

    getPlainSetup = (): SetupInterface => {
        const plainSetup: SetupInterface = { displays: {} };

        for (const display of this.displays.values()) {
            const newDisplay: DisplayInterface = { id: display.id, browsers: {} };
            plainSetup.displays[display.id] = newDisplay;

            for (const browser of display.browsers.values()) {
                const newBrowser: BrowserInterface = { ...browser };
                newDisplay.browsers[browser.id] = newBrowser;
            }
        }

        return plainSetup;
    }

    fromPlain(plainSetup: SetupInterface, onLocalBrowsersChange, onLocalBrowserChange): void {
        // debugger;

        for (const display of Object.values(plainSetup.displays)) {
            const newDisplay = new Display(display.id);

            this.displays.set(display.id, newDisplay);

            for (const browser of Object.values(display.browsers)) {
                const newBrowser = observable(new Browser(browser));
                newDisplay.browsers.set(browser.id, newBrowser);

                reaction(
                    () => {
                        return { ...newBrowser };
                    },
                    onLocalBrowserChange,
                    { name: this.constructor.name + ' browser change', delay: 1 }
                );
            }
            newDisplay.browsers.observe(onLocalBrowsersChange, false);
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

