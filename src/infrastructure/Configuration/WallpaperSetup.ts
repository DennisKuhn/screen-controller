import { observable, ObservableMap, reaction, IReactionPublic } from 'mobx';
import { Dictionary, isEqual } from 'lodash';

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

export interface RectangleInterface {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class Rectangle implements RectangleInterface {
    @observable x: number;
    @observable y: number;
    @observable width: number;
    @observable height: number;

    constructor(source: RectangleInterface) {
        this.x = source.x;
        this.y = source.y;
        this.width = source.width;
        this.height = source.height;
    }

    get plain(): RectangleInterface {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

export interface BrowserInterface {
    id: string;
    relative: RectangleInterface;
    scaled?: RectangleInterface;
    device?: RectangleInterface;
    config?: Config;
}



/**
 * Bounds in %, relativ to display. Application unique id, e.g. auto increment from 1. 
 * config for Browser usually ommited for performance, request explictly from Configuration/Controller
 * @example {rx:0, ry:0, rWidth:1, rHeight:1} fills the entire display
 **/
export class Browser implements BrowserInterface {
    /** Application unique persistent, e.g. auto increment from 1 */
    @observable id: string;

    @observable relative: Rectangle;
    @observable scaled?: Rectangle;
    @observable device?: Rectangle;

    @observable config?: Config;

    constructor(source: BrowserInterface) {
        this.id = source.id;
        this.relative = new Rectangle(source.relative);

        if (source.scaled) {
            this.scaled = new Rectangle(source.scaled);
        }
        if (source.device) {
            this.device = new Rectangle(source.device);
        }

        this.config = source.config;
    }

    get plain(): BrowserInterface {
        return {
            id: this.id,
            relative: this.relative.plain,
            scaled: this.scaled ? this.scaled.plain : undefined,
            device: this.device ? this.device.plain : undefined,
            config: this.config,
        };
    }

    update(update: BrowserInterface): void {
        if (!isEqual(this.relative.plain, update.relative)) {
            console.log(`${this.constructor.name}[${this.id}].update(): relative`, { ...this.relative.plain }, { ...update.relative });

            this.relative = new Rectangle(update.relative);
        }
        if (update.device) {
            if (!isEqual(this.device?.plain, update.device)) {
                console.log(`${this.constructor.name}[${this.id}].update(): device`, { ...this.device?.plain }, { ...update.device });

                this.device = new Rectangle(update.device);
            }
        }
        if (update.scaled) {
            if (!isEqual(this.scaled?.plain, update.scaled)) {
                console.log(`${this.constructor.name}[${this.id}].update(): scaled`, { ...this.scaled?.plain }, { ...update.scaled });

                this.scaled = new Rectangle(update.scaled);
            }
        }
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
        const newDisplay: DisplayInterface = { id: this.id, browsers: {} };

        for (const browser of this.browsers.values()) {
            newDisplay.browsers[browser.id] = browser.plain;
        }

        return newDisplay;
    }
}

export interface SetupInterface {
    displays: Dictionary<DisplayInterface>;
}

export class Setup {
    @observable displays: DisplayIterableDictionary;

    constructor() {
        this.displays = new DisplayIterableDictionary();
    }

    get plain(): SetupInterface {
        const plainSetup: SetupInterface = { displays: {} };

        for (const display of this.displays.values()) {
            plainSetup.displays[display.id] = display.plain;
        }

        return plainSetup;
    }

    fromPlain(plainSetup: SetupInterface, onLocalBrowsersChange, onLocalBrowserChange: (browser: BrowserInterface, r: IReactionPublic) => void): void {
        for (const display of Object.values(plainSetup.displays)) {
            const newDisplay = new Display(display.id);

            this.displays.set(display.id, newDisplay);

            for (const browser of Object.values(display.browsers)) {
                const newBrowser = observable(new Browser(browser));
                newDisplay.browsers.set(browser.id, newBrowser);

                reaction(
                    () => newBrowser.plain,
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

