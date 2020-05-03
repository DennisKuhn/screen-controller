import { observable, action, computed, ObservableMap } from 'mobx';
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

export class ObservableSetupItemMap<V extends SetupItem> extends ObservableArrayMap<SetupItemId, V | null> {
}

export class DisplayMap extends ObservableSetupItemMap<Display> {

}

export class BrowserMap extends ObservableSetupItemMap<Browser> {

}

export type SetupItemInterfaceDictionary<V extends SetupItemInterface> = Dictionary<V | null>;
export type DisplayDictionary = SetupItemInterfaceDictionary<DisplayInterface>;
export type BrowserDictionary = SetupItemInterfaceDictionary<BrowserInterface>;


export type SetupItemId = string;

export interface SetupItemInterface {
    /** Application unique, persistent, e.g. <ClassName>-<auto increment> */
    id: SetupItemId;
    parentId: SetupItemId;
    className: string;
}

export interface SetupContainerInterface<ChildInterface extends SetupItemInterface> extends SetupItemInterface {
    children: SetupItemInterfaceDictionary<ChildInterface>;
}

export abstract class SetupItem {

    readonly id: SetupItemId;
    readonly parentId: SetupItemId;
    readonly className: string;

    constructor(source: SetupItemInterface) {
        if (SetupItem.usedIDs.includes(source.id))
            throw new Error(`SetupItem[${this.constructor.name}] id=${source.id} already in use`);

        this.id = source.id;
        this.parentId = source.parentId;
        this.className = source.className;

        SetupItem.usedIDs.push(this.id);
    }

    /**
     * Returns a plain javascript object. Needs be implemented by any extending class calling super.
     * @example 
     * class Rectangle extends SetupItem implements RectangleInterface {
     * getPlain(): RectangleInterface {
     *   return {
     *       ... super.getPlain(),
     *       x: this.x,
     *       y: this.y,
     *       width: this.width,
     *       height: this.height
     *   };
     * }
     */
    getPlainFlat(): SetupItemInterface {
        return { id: this.id, parentId: this.parentId, className: this.className };
    }
    getPlainDeep(): SetupItemInterface {
        return { id: this.id, parentId: this.parentId, className: this.className };
    }


    update(update: SetupItemInterface): void {
        if (update.id != this.id)
            throw new Error(`SetupItem[${this.constructor.name}][-> ${this.id} <-, ${this.parentId}, ${this.className}].update =`
                + ` { id: ${update.id}, parentId: ${this.parentId}, className: ${update.className} }`);
        if (update.parentId != this.parentId)
            throw new Error(`SetupItem[${this.constructor.name}][${this.id},-> ${this.parentId} <-, ${this.className}].update =`
                + ` { id: ${update.id}, parentId: ${this.parentId}, className: ${update.className} }`);
        if (update.className != this.className)
            throw new Error(`SetupItem[${this.constructor.name}][${this.id}, ${this.parentId}, -> ${this.className} <-].update =`
                + ` { id: ${update.id}, parentId: ${this.parentId}, className: ${update.className} }`);
    }


    static usedIDs = new Array<string>();

    public getNewId(): string {
        let id = 0;
        return SetupItem.usedIDs.reduce(
            (result: string, usedId: string): string => {
                const parts = usedId.split('-');

                if ((parts.length == 2) && (parts[0] == this.constructor.name)) {
                    const usedIdNumber = Number(parts[1]);
                    id = usedIdNumber >= id ? usedIdNumber + 1 : id;
                }
                return `${this.constructor.name}-${id}`;
            }
        );
    }
    public static getNewId(className: string): string {
        let id = 0;
        return SetupItem.usedIDs.reduce(
            (result: string, usedId: string): string => {
                const parts = usedId.split('-');

                if ((parts.length == 2) && (parts[0] == className)) {
                    const usedIdNumber = Number(parts[1]);
                    id = usedIdNumber >= id ? usedIdNumber + 1 : id;
                }
                return `${className}-${id}`;
            }
        );
    }
}

export abstract class SetupContainer<ChildType extends SetupItem, ChildInterface extends SetupItemInterface> extends SetupItem {
    readonly children: ObservableSetupItemMap<ChildType>;

    constructor(source: SetupContainerInterface<ChildInterface>) {
        super(source);
        this.children = new ObservableSetupItemMap<ChildType>();

        this.updateDictionary(source.children as SetupItemInterfaceDictionary<ChildInterface>);
    }

    abstract createChild(source: ChildInterface): ChildType;

    protected updateDictionary(source: SetupItemInterfaceDictionary<ChildInterface>): void {

        if (!this.children) throw new Error(`SetupItem[${this.constructor.name}].updateDictionary no children`);

        for (const [id, plainObject] of Object.entries(source)) {
            const object = this.children.get(id);
            if (plainObject) {
                if (object) {
                    object.update(plainObject);
                } else {
                    this.children.set(
                        id,
                        this.createChild(plainObject)
                    );
                }
            } else if (!this.children.has(id)) {
                this.children.set(id, null);
            }
        }
        for (const deleted of this.children.keys()) {
            if (!(deleted in source)) {
                this.children.delete(deleted);
            }
        }
    }

    // @computed
    getPlainDeep(): SetupContainerInterface<ChildInterface> {
        const plainObject: SetupContainerInterface<ChildInterface> = { ...super.getPlainDeep(), children: {} };

        for (const [id, child] of this.children.entries()) {
            plainObject.children[id] = child?.getPlainDeep() as ChildInterface;
        }

        return plainObject;
    }

    // @computed
    getPlainFlat(): SetupContainerInterface<ChildInterface> {
        const plainObject: SetupContainerInterface<ChildInterface> = { ...super.getPlainFlat(), children: {} };

        for (const id of this.children.keys()) {
            plainObject.children[id] = null;
        }

        return plainObject;
    }

    @action
    update(source: SetupContainerInterface<ChildInterface>): void {
        super.update(source);

        this.updateDictionary(
            source.children as SetupItemInterfaceDictionary<ChildInterface>
        );
    }
}


export interface RectangleInterface extends SetupItemInterface {
    className: 'Rectangle';
    x: number;
    y: number;
    width: number;
    height: number;
}

export class Rectangle extends SetupItem implements RectangleInterface {
    @observable x: number;
    @observable y: number;
    @observable width: number;
    @observable height: number;

    className: 'Rectangle' = 'Rectangle';

    constructor(source: RectangleInterface) {
        super(source);
        this.x = source.x;
        this.y = source.y;
        this.width = source.width;
        this.height = source.height;
    }

    // @computed
    getPlainDeep(): RectangleInterface {
        return {
            ... super.getPlainDeep() as RectangleInterface,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    // @computed
    getPlainFlat(): RectangleInterface {
        return {
            ... super.getPlainFlat() as RectangleInterface,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    @action
    update(update: RectangleInterface): void {
        super.update(update);

        if (this.x != update.x) this.x = update.x;
        if (this.y != update.y) this.y = update.y;
        if (this.width != update.width) this.width = update.width;
        if (this.height != update.height) this.height = update.height;
    }
}

export interface BrowserInterface extends SetupItemInterface {
    className: 'Browser';

    /**
     * Relative to display
     * @example {x:0, y:0, width:1, height:1} // fills the entire display
     */
    relative: RectangleInterface;

    /**
     * Scaled pixels as the browser perceives it
     */
    scaled?: RectangleInterface;
    /**
     * Device pixels
     */
    device?: RectangleInterface;

    config?: Config;
}

export class Browser extends SetupItem implements BrowserInterface {

    className: 'Browser' = 'Browser';

    @observable relative: Rectangle;
    @observable scaled?: Rectangle;
    @observable device?: Rectangle;

    @observable config?: Config;

    constructor(source: BrowserInterface) {
        super(source);

        this.relative = new Rectangle(source.relative);

        this.scaled = source.scaled ? new Rectangle(source.scaled) : undefined;
        this.device = source.device ? new Rectangle(source.device) : undefined;

        this.config = source.config;
    }

    // @computed
    getPlainDeep(): BrowserInterface {
        return {
            ... super.getPlainDeep() as BrowserInterface,
            relative: this.relative.getPlainDeep(),
            scaled: this.scaled?.getPlainDeep(),
            device: this.device?.getPlainDeep(),
            config: this.config,
        };
    }

    // @computed
    getPlainFlat(): BrowserInterface {
        return {
            ... super.getPlainFlat() as BrowserInterface,
            relative: this.relative.getPlainFlat(),
            scaled: this.scaled?.getPlainFlat(),
            device: this.device?.getPlainFlat(),
            config: this.config,
        };
    }

    @action
    update(update: BrowserInterface): void {
        if (!isEqual(this.relative.getPlainDeep(), update.relative)) {
            console.log(`${this.constructor.name}[${this.id}].update(): relative`, { ...this.relative.getPlainDeep() }, { ...update.relative });

            this.relative = new Rectangle(update.relative);
        }
        if (update.device) {
            if (!isEqual(this.device?.getPlainDeep(), update.device)) {
                console.log(`${this.constructor.name}[${this.id}].update(): device`, { ...this.device?.getPlainDeep() }, { ...update.device });

                this.device = new Rectangle(update.device);
            }
        }
        if (update.scaled) {
            if (!isEqual(this.scaled?.getPlainDeep(), update.scaled)) {
                console.log(`${this.constructor.name}[${this.id}].update(): scaled`, { ...this.scaled?.getPlainDeep() }, { ...update.scaled });

                this.scaled = new Rectangle(update.scaled);
            }
        }
    }
}

export interface DisplayInterface extends SetupContainerInterface<BrowserInterface> {
    className: 'Display';
}


export class Display extends SetupContainer<Browser, BrowserInterface> {

    createChild(source: BrowserInterface): Browser {
        return new Browser(source);
    }
}

export type SetupID = 'Setup';

export interface SetupInterface extends SetupContainerInterface<DisplayInterface> {
    id: SetupID;
    className: 'Setup';
}

export class Setup extends SetupContainer<Display, DisplayInterface> {

    createChild(source: DisplayInterface): Display {
        return new Display(source);
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

export const createSetupItem = (plain: SetupItemInterface): Setup | Display | Browser => {
    switch (plain.className) {
        case 'Setup': return new Setup(plain as SetupInterface);
        case 'Display': return new Display(plain as DisplayInterface);
        case 'Browser': return new Browser(plain as BrowserInterface);
    }
    throw new Error(`createSetupItem( -> ${plain.className} <-, ${JSON.stringify(plain)}) unkown className`);
};
