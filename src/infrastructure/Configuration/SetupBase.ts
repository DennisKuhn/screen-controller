import { SetupItemId, SetupBaseInterface } from './SetupBaseInterface';
import { JSONSchema7 } from 'json-schema';

export interface SetupConstructor<SetupType extends SetupBase> {
    new(config: SetupBaseInterface): SetupType;
}

export abstract class SetupBase {
    readonly id: SetupItemId;
    readonly parentId: SetupItemId;
    readonly className: string;

    public static activeSchema: JSONSchema7 = {
        $schema: 'http://json-schema.org/draft/2019-09/schema#',
        $id: 'https://github.com/DennisKuhn/screen-controller/schemas/SetupSchema.json',
        definitions: {
            SetupBase: {
                $id: '#' + SetupBase.name,
                type: 'object',
                properties: {
                    id: {
                        type: 'string'
                    },
                    parentId: {
                        type: 'string'
                    },
                    className: {
                        type: 'string'
                    }
                },
                required: ['id', 'parentId', 'className']
            }
        }
    };

    protected static addSchema(schema: JSONSchema7): void {
        if (!SetupBase.activeSchema.definitions) throw new Error(`SetupBase.addSchema(${schema.$id}) no definitions`);
        
        if (!schema.$id) throw new Error(`SetupBase.addSchema() no $id: ${JSON.stringify(schema)}`);

        if (schema.$id in SetupBase.activeSchema.definitions) {
            console.log(`SetupBase.addSchema(${schema.$id}) already registered`, SetupBase.activeSchema.definitions[schema.$id], schema);
        } else {
            SetupBase.activeSchema.definitions[schema.$id] = schema;
        }
    }

    constructor(source: SetupBaseInterface) {
        if (SetupBase.usedIDs.includes(source.id))
            throw new Error(`SetupItem[${this.constructor.name}] id=${source.id} already in use`);
        
        this.id = source.id;
        this.parentId = source.parentId;
        this.className = source.className;
        SetupBase.usedIDs.push(this.id);
    }

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

    public static getNewId<SetupType extends SetupBase>(classConstructor: SetupConstructor<SetupType>): string {
        let id = 0;
        return SetupBase.usedIDs.reduce((result: string, usedId: string): string => {
            const parts = usedId.split('-');
            if ((parts.length == 2) && (parts[0] == classConstructor.name)) {
                const usedIdNumber = Number(parts[1]);
                id = usedIdNumber >= id ? usedIdNumber + 1 : id;
            }
            return `${classConstructor.name}-${id}`;
        });
    }
}
