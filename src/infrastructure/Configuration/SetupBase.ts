import { SetupItemId, SetupBaseInterface } from './SetupBaseInterface';

export abstract class SetupBase {
    readonly id: SetupItemId;
    readonly parentId: SetupItemId;
    readonly className: string;

    constructor(source: SetupBaseInterface) {
        if (SetupBase.usedIDs.includes(source.id))
            throw new Error(`SetupItem[${this.constructor.name}] id=${source.id} already in use`);
        this.id = source.id;
        this.parentId = source.parentId;
        this.className = source.className;
        SetupBase.usedIDs.push(this.id);
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
    getShallow(): SetupBaseInterface {
        return { id: this.id, parentId: this.parentId, className: this.className };
    }

    getDeep(): SetupBaseInterface {
        return { id: this.id, parentId: this.parentId, className: this.className };
    }

    getPlain(reqdepth: number): SetupBaseInterface {
        return this.getShallow();
    }

    update(update: SetupBaseInterface): void {
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
        return SetupBase.getNewId(this.constructor.name);
    }

    public static getNewId(className: string): string {
        let id = 0;
        return SetupBase.usedIDs.reduce((result: string, usedId: string): string => {
            const parts = usedId.split('-');
            if ((parts.length == 2) && (parts[0] == className)) {
                const usedIdNumber = Number(parts[1]);
                id = usedIdNumber >= id ? usedIdNumber + 1 : id;
            }
            return `${className}-${id}`;
        });
    }
}
