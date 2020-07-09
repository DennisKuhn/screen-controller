import { UiSchema } from '@rjsf/core';
import Ajv, { ValidateFunction } from 'ajv';
import { remote } from 'electron';
import { JSONSchema7 } from 'json-schema';
import deref from 'json-schema-deref-sync';
import mergeAllOf from 'json-schema-merge-allof';
import { cloneDeep, Dictionary } from 'lodash';
import { $mobx, isObservableArray, observable, toJS } from 'mobx';
import shortid from 'shortid';
import { callerAndfName } from '../utils/debugging';
import { ObservableArray, ObservableSetupBaseMap } from './Container';
import {
    forEach,
    forEachShallow,
    registerAllOfs,
    replaceAbstractRefsWithOneOfConcrets,
    replaceAbstractWithOneOfConcrets,
    replaceEach,
    resolve,
    resolveRef,
    resolveScAllOf,
    setDefaults
} from './JsonSchemaTools';
import { asScSchema7, ScSchema7 } from './ScSchema7';
import { create, register } from './SetupFactory';
import { PropertyKey, PropertyType as InterfacePropertyType, SetupBaseInterface, SetupItemId } from './SetupInterface';

switch (process.type) {
    case 'browser': // Main
        shortid.worker(0);
        break;
    case 'renderer': {
        shortid.worker(remote.getCurrentWindow().id);
    }
        break;
    case 'worker':
        console.error(`SetupBase[${process.type}]: is not supported`);
        throw new Error(
            `SetupBase: process.type=${process.type} is not supported`
        );
        break;
}
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-~');

type PropertyBaseType = SetupBase |
    ObservableSetupBaseMap<SetupBase> |
    string |
    number |
    boolean;

export type PropertyType =
    PropertyBaseType |
    ObservableArray<PropertyBaseType>;

export interface SetupConstructor<SetupType extends SetupBase> {
    new(config: SetupBaseInterface): SetupType;
}

interface PropertyInfos {
    [key: string]: ScSchema7;
}

interface ClassInfo {
    schema: JSONSchema7;
    uiSchema: UiSchema;
    plainSchema?: JSONSchema7;
    simpleClassSchema?: JSONSchema7;
    validate?: ValidateFunction;
    properties?: PropertyInfos;
}

export abstract class SetupBase {
    readonly id: SetupItemId;
    readonly parentId: SetupItemId;
    readonly className: string;
    readonly parentProperty: PropertyKey;

    @observable name: string;

    private static notSerialisedProperties = ['_parent', 'parent', 'notPersisted', 'info'];

    static readonly schemaUri = 'https://github.com/maoriora/screen-controller/schemas/SetupSchema.json#';

    public static baseSchema: JSONSchema7 = {
        $id: SetupBase.name,
        type: 'object',
        properties: {
            id: asScSchema7({ type: 'string', scHidden: true }),
            parentId: asScSchema7({ type: 'string', scHidden: true }),
            parentProperty: asScSchema7({ type: 'string', scHidden: true }),
            className: asScSchema7({ type: 'string', scHidden: true }),
            name: { type: 'string' }
        },
        required: ['id', 'parentId', 'className']
    };

    public static activeSchema: JSONSchema7 = observable({
        // $schema: 'http://json-schema.org/draft/2019-09/schema#',
        $id: SetupBase.schemaUri,
        definitions: {
            SetupBase: SetupBase.baseSchema,
            Percent: {
                $id: 'Percent',
                type: 'number',
                minimum: 0,
                maximum: 1,
                multipleOf: 0.005
            }
        }
    });

    public static readonly uiSchema: UiSchema = {
        id: { 'ui:widget': 'hidden' },
        parentId: { 'ui:widget': 'hidden' },
        parentProperty: { 'ui:widget': 'hidden' },
        className: { 'ui:widget': 'hidden' },
    };

    public static ajv = (new Ajv())
        .addKeyword( 'scVolatile', { valid: true })
        .addKeyword( 'scViewOnly', { valid: true })
        .addKeyword( 'scHidden', { valid: true })
        .addKeyword( 'scTranslationId', { valid: true })
        .addKeyword( 'scFormat', { valid: true } );

    public volatile(property: string): boolean {
        if (this.info.simpleClassSchema == undefined)
            throw new Error(`${callerAndfName()}[${this.constructor.name}](${this.className}) no simpleClassSchema: ${JSON.stringify(this.info)}`);
        if (this.info.simpleClassSchema.properties == undefined)
            throw new Error(`${callerAndfName()}[${this.constructor.name}](${this.className}) no properties in simpleClassSchema: ${JSON.stringify(this.info.simpleClassSchema)}`);

        if (this.info.simpleClassSchema.properties[property] == undefined)
            throw new Error(
                `${callerAndfName()}[${this.constructor.name}](${this.className}) no ${property} in simpleClassSchema.properties:` +
                `${JSON.stringify(this.info.simpleClassSchema.properties) }`);

        return (this.info.simpleClassSchema.properties[property] as ScSchema7)?.scVolatile == true;
    }

    public static readonly SCHEMA_REF = { $ref: SetupBase.name };
    public static readonly PERCENT_REF = { $ref: 'Percent' };

    protected static infos: { [key: string]: ClassInfo } = {};


    protected static addSchema(schema: JSONSchema7, uiSchema: UiSchema): void {
        if (!SetupBase.activeSchema.definitions) throw new Error(`SetupBase.addSchema(${schema.$id}) no definitions`);

        if (!schema.$id) throw new Error(`SetupBase.addSchema() no $id: ${JSON.stringify(schema)}`);

        if (schema.$id in SetupBase.activeSchema.definitions) {
            // console.log(`SetupBase.addSchema(${schema.$id}) already registered`, SetupBase.activeSchema.definitions[schema.$id], schema);
        } else {
            console.log(`SetupBase.addSchema(${schema.$id}) @${Object.keys(SetupBase.activeSchema.definitions).length}`);
            SetupBase.activeSchema.definitions[schema.$id] = schema;

            if (schema.$id in SetupBase.infos)
                throw new Error(`SetupBase.addSchema(${schema.$id}) info already exists: ${JSON.stringify(SetupBase.infos)}`);

            SetupBase.infos[schema.$id] = {
                schema: {
                    definitions: SetupBase.activeSchema.definitions,
                    $ref: '#/definitions/' + schema.$id
                },
                uiSchema: { ...SetupBase.uiSchema, ...uiSchema }
            };
        }
    }

    private static readonly DEF_REF_PREFIX = '#/definitions/';

    private static fixRefs(item: JSONSchema7): JSONSchema7 {

        if (item.$ref) {
            if (item.$ref.startsWith(SetupBase.DEF_REF_PREFIX)) {
                // console.log(`${module.id}.fixRefs: skip ${item.$id} = ${item.$ref}`);
            } else {
                // console.log(`${module.id}.fixRefs: ${item.$id} ${item.$ref} => ${'#/definitions/' + item.$ref}`);
                item.$ref = SetupBase.DEF_REF_PREFIX + item.$ref;
            }
        }
        for (const child of Object.values(item)) {
            if (child instanceof Object) {
                SetupBase.fixRefs(child);
            }
        }

        return item;
    }


    private initClassInfo(source: SetupBaseInterface): ClassInfo {
        if (!(source.className in SetupBase.infos))
            throw new Error(`SetupBase[${this.constructor.name}].initClassInfo(${source.className}) no info: ${JSON.stringify(SetupBase.infos)}`);

        const info = SetupBase.infos[source.className];

        if (info.validate == undefined) {
            // console.debug(`SetupBase[${this.constructor.name}].initClassInfo(${source.className}) create validator` /*, toJS(info.schema, { recurseEverything: true }) */);

            info.validate = SetupBase.ajv.compile(info.schema);
        }
        if (info.simpleClassSchema == undefined) {
            SetupBase.createSimpleClassSchema(info);
        }
        return info;
    }

    private static buildIdDictionary(schema: JSONSchema7, dictionary: Dictionary<JSONSchema7[]>): void {
        if (schema.$id) {
            dictionary[schema.$id] = dictionary[schema.$id] ?? [];

            dictionary[schema.$id].push(schema);
        }
        if (schema.properties) {
            for (const property of Object.values(schema.properties)) {
                if (typeof property == 'object')
                    this.buildIdDictionary(property, dictionary);
            }
        }
        if (typeof schema.additionalProperties == 'object')
            this.buildIdDictionary(schema.additionalProperties, dictionary);

        if (schema.oneOf) {
            for (const subSchema of schema.oneOf) {
                if (typeof subSchema == 'object')
                    this.buildIdDictionary(subSchema, dictionary);
            }
        }
        if (schema.allOf) {
            for (const subSchema of schema.allOf) {
                if (typeof subSchema == 'object')
                    this.buildIdDictionary(subSchema, dictionary);
            }
        }
        if (schema.anyOf) {
            for (const subSchema of schema.anyOf) {
                if (typeof subSchema == 'object')
                    this.buildIdDictionary(subSchema, dictionary);
            }
        }
    }

    private static moveDuplicateIdsToDefinitions(schema: JSONSchema7, idsDictionary: Dictionary<JSONSchema7[]>): void {
        for (const [id, occurances] of Object.entries(idsDictionary)) {
            /// First occurance becomes definition
            const definition = cloneDeep(occurances[0]);

            schema.definitions = schema.definitions ?? {};

            /// Set first occurance as definition
            schema.definitions[id] = definition;

            // Replace existing (duplicate) declarations
            // by reference to definition
            for (const occurance of occurances) {
                // Delete existing declarations
                Object.keys(occurance)
                    .map(key => delete occurance[key]);

                occurance.$ref = SetupBase.DEF_REF_PREFIX + id;
            }
        }
    }

    private static getOtherOneOfNull(schema: JSONSchema7): JSONSchema7 | undefined {
        if (schema.oneOf?.length == 2) {
            if ((schema.oneOf[0] as JSONSchema7).type == 'null') {
                return schema.oneOf[1] as JSONSchema7;
            } else if ((schema.oneOf[1] as JSONSchema7).type == 'null') {
                return schema.oneOf[0] as JSONSchema7;
            }
        }
        return undefined;
    }

    private static mergeOneOfNulls(schema: JSONSchema7): void {
        replaceEach(
            schema,
            schema,
            SetupBase.getOtherOneOfNull
        );
        forEach(
            schema,
            subSchema =>
                subSchema.oneOf
                && subSchema.oneOf.length > 2
                && subSchema.oneOf.forEach((prospect, index) =>
                    typeof prospect == 'object'
                    && prospect.type == 'null'
                    && subSchema.oneOf?.splice(index, 1).length
                    && console.log('mergeOneOfNull: removed null from', { ...subSchema.oneOf })
                )
        );
    }

    private static fixDuplicateIds(schema: JSONSchema7): void {
        const idsDictionary: Dictionary<JSONSchema7[]> = {};

        SetupBase.buildIdDictionary(schema, idsDictionary);

        for (const [id, schemas] of Object.entries(idsDictionary)) {
            if (schemas.length == 1) {
                // console.log(`SetupBase.fixDuplicateIds(${schema.$id}) remove not duplicate ${id}`);
                delete idsDictionary[id];
            } else {
                // console.log(`SetupBase.fixDuplicateIds(${schema.$id}) keep duplicate ${id} * ${schemas.length}`);
            }
        }

        SetupBase.moveDuplicateIdsToDefinitions(schema, idsDictionary);

        // console.log(`SetupBase.fixDuplicateIds(${schema.$id})`, idsDictionary, schema);
    }

    private static hasRefs = (schema: JSONSchema7): boolean => {
        if (schema.properties) {
            for (const property of Object.values(schema.properties)) {
                if ((typeof property == 'object') && ('$ref' in property))
                    return true;
            }
        }
        return false;
    }

    private static moveRefsToDefsToDefs = (schema: JSONSchema7, root?: JSONSchema7): void => {

        root = root ?? schema;

        if (schema.properties) {
            for (const [name, value] of Object.entries(schema.properties)) {
                if ((typeof value == 'object') && SetupBase.hasRefs(value)) {
                    if (!value.$id)
                        throw new Error(`SetupBase.moveRefsToDefsToDefs: $id is not defined in schema for property ${name} in ${schema.$id}: ${JSON.stringify(value)}`);

                    // console.log(`SetupBase.moveRefsToDefsToDefs: move ${value.$id} from ${schema.$id}.${name} to defs`);
                    root.definitions = root.definitions ?? {};
                    root.definitions[value.$id] = value;
                    schema.properties[name] = { $ref: SetupBase.DEF_REF_PREFIX + value.$id };
                }
            }
        }


        if (typeof schema.additionalProperties == 'object')
            SetupBase.moveRefsToDefsToDefs(schema.additionalProperties, root);

        if (schema.oneOf) {
            for (const subSchema of schema.oneOf) {
                if (typeof subSchema == 'object')
                    SetupBase.moveRefsToDefsToDefs(subSchema, root);
            }
        }
        if (schema.allOf) {
            for (const subSchema of schema.allOf) {
                if (typeof subSchema == 'object')
                    SetupBase.moveRefsToDefsToDefs(subSchema, root);
            }
        }
        if (schema.anyOf) {
            for (const subSchema of schema.anyOf) {
                if (typeof subSchema == 'object')
                    SetupBase.moveRefsToDefsToDefs(subSchema, root);
            }
        }
    }

    /**
     * Create a simple dereferenced schema valid for this class and its non-object properties.
     * @param info 
     * Only the $id of child objects should be used, their properties and further nested may dissapear.
     */
    private static createSimpleClassSchema(info: ClassInfo): void {
        /**
         * Resolve root Element
         * @example { $ref: 'AnalogClock' } => { $id: 'AnalogClock', allOf ....}
         */
        const simpleSchema: ScSchema7 =toJS( resolve(info.schema, info.schema), {recurseEverything: true } );

        forEachShallow(simpleSchema, resolveRef, info.schema);

        SetupBase.mergeOneOfNulls(simpleSchema);

        replaceAbstractWithOneOfConcrets(simpleSchema, info.schema);

        forEach(simpleSchema, registerAllOfs);

        info.simpleClassSchema = mergeAllOf(simpleSchema, {resolvers: {scAllOf: resolveScAllOf} as any });
        console.debug(
            `${callerAndfName()}[${info.schema.$ref}] merged AllOf: `,
            process.type == 'renderer' ? { merged: cloneDeep(info.simpleClassSchema), root: cloneDeep(info.schema) } : ':-)');
    }

    public getSimpleClassSchema(): JSONSchema7 {
        if (this.info.simpleClassSchema == undefined)
            throw new Error(`${callerAndfName()}[${this.constructor.name}](${this.className}): no simpleClassSchema`);

        return this.info.simpleClassSchema;
    }

    public getPlainSchema(): JSONSchema7 {
        if (this.info.plainSchema == undefined) {
            const plainSchema = toJS(this.info.schema, { recurseEverything: true });

            replaceAbstractRefsWithOneOfConcrets(plainSchema);
            // console.log(`${callerAndfName()}[${this.constructor.name}](${this.className}).replaced AbstractRefsWithOneOfConcrets:`, { ...plainSchema });

            SetupBase.fixRefs(plainSchema);

            const derefed = deref(plainSchema);

            if (derefed instanceof Error) {
                console.error(`${callerAndfName()}[${this.constructor.name}](${this.className}).resolved error: ${derefed}`, derefed, { ...plainSchema });
            } else {
                // console.log(`${callerAndfName()}[${this.constructor.name}](${this.className}).resolved schema:`, { ...derefed }, { ...plainSchema });

                const merged = mergeAllOf(derefed) as JSONSchema7;

                // console.log(
                //     `${callerAndfName()}[${this.constructor.name}](${this.className}).merged schema:`,
                //     { ...merged }, { ...derefed }, { ...plainSchema });

                SetupBase.fixDuplicateIds(merged);
                // console.log(
                //     `${callerAndfName()}[${this.constructor.name}](${this.className}).fixedDuplicateIds:`,
                //     { ...merged });

                SetupBase.mergeOneOfNulls(merged);
                // console.log(
                //     `${callerAndfName()}[${this.constructor.name}](${this.className}).mergedOneOfNulls:`,
                //     { ...merged });

                SetupBase.moveRefsToDefsToDefs(merged);

                console.log(`${callerAndfName()}[${this.constructor.name}](${this.className})`
                    // , { ...merged }, toJS(info.schema, { recurseEverything: true })
                );

                this.info.plainSchema = merged;
            }
        }
        if (this.info.plainSchema == undefined)
            throw new Error(`SetupBase[${this.constructor.name}][${this.className}]: no plainSchema`);

        return this.info.plainSchema;
    }

    public getSchema(): JSONSchema7 {
        return this.info.schema;
    }

    public static getUiSchema(className: string): UiSchema {
        return SetupBase.infos[className].uiSchema;
    }

    protected info: ClassInfo;

    protected constructor(source: SetupBaseInterface) {
        if (source.id in SetupBase.instances)
            throw new Error(`SetupBase[${this.constructor.name}] id=${source.id} already in use`);

        if (!SetupBase.activeSchema.definitions)
            throw new Error(`SetupBase[${this.constructor.name}] no definitions in activeSchema: ${JSON.stringify(SetupBase.activeSchema)}`);

        if (this.constructor.name != source.className)
            if (this.constructor.name == 'Plugin') {
                // console.log(`SetupBase[${this.constructor.name}] for ${source.className}: ${JSON.stringify(source)}`);
            } else
                throw new Error(`SetupBase[${this.constructor.name}] does not match className=${source.className}: ${JSON.stringify(source)}`);

        this.info = this.initClassInfo(source);

        if (this.info.simpleClassSchema == undefined) {
            this.info.simpleClassSchema = this.getSimpleClassSchema();
        }


        //TODO remove:> source.name = source.name ?? source.id;
        source.name = source.name ?? source.id;

        if (this.info.validate == undefined)
            throw new Error(`SetupBase[${this.constructor.name}@${source.id}, ${source.className}]: no validate`);

        if (this.info.validate(source) != true) {
            throw new Error(
                `SetupBase[${this.constructor.name}@${source.id}, ${source.className}]: Validation error:\n` +
                `${this.info.validate.errors?.map(
                    error => `${error.schemaPath} // ${error.dataPath} ${error.propertyName ? '@' + error.propertyName : ''} : ${error.message} ${JSON.stringify(error.params)}`
                ).join(';\n')}\n` +
                `source:\n${JSON.stringify(source)}`);
        }
        // console.log(`SetupBase[${this.constructor.name}@${source.id}, ${source.className}]: validated`);

        this.id = source.id;
        this.parentId = source.parentId;
        this.parentProperty = source.parentProperty;
        this.className = source.className;
        this.name = source.name;
        SetupBase.instances[this.id] = this;
        SetupBase.mobxInstances[this[$mobx].name] = this;
    }


    get parent(): (SetupBase | undefined) {
        return SetupBase.instances[this.parentId];
    }

    protected createMap<Setup extends SetupBase>(source: Dictionary<SetupBaseInterface>, name?: string): ObservableSetupBaseMap<Setup> {
        const map = new ObservableSetupBaseMap<Setup>({}, undefined, this.id + '-' + name);

        for (const [id, plain] of Object.entries(source)) {
            if (plain) {
                // console.log(`SetupBase[${this.constructor.name}][${this.id}].createMap:[${id}]=create` /* , plain */);
                map.set(
                    id,
                    create(plain) as Setup
                );
            } else {
                // console.log(`SetupBase[${this.constructor.name}].createMap:[${id}] add null`);
                map.set(id, null);
            }
        }

        return map;
    }

    protected createArray<T extends PropertyType>(source: Array<T>, name?: string): ObservableArray<T> {
        let array: ObservableArray<T>;

        if (source.length) {
            switch (typeof source[0]) {
                case 'object':
                    array = observable.array<T>([], { name: this.id + '.' + name });
                    for (const plain of source) {
                        const plainSetup = plain as SetupBaseInterface;
                        if (plainSetup.id) {
                            array.push(
                                create(plainSetup) as T
                            );
                        } else
                            throw new Error(`$${callerAndfName()}: unsupported object: ${JSON.stringify(plain)}`);
                    }
                    break;
                case 'boolean':
                case 'number':
                case 'string':
                    array = observable.array<T>(source, { name: this.id + '.' + name });
                    break;
                default:
                    throw new Error(`$${callerAndfName()}: unsupported type == ${typeof source[0]} = ${JSON.stringify(source[0])}`);
            }
        } else {
            array = observable.array<T>(source, { name: this.id + '.' + name });
        }

        return array;
    }


    /**
     * Returns a shallow plain javascript object.
     * Child objects like screen, rectangle are included as plain.
     * Children/values in Maps are set to null.
     * This does only iterate/accesses keys of Maps,
     * value changes (like null to object) are ignored
     */
    getShallow(): SetupBaseInterface {
        const shallow: SetupBaseInterface = { id: this.id, parentId: this.parentId, parentProperty: this.parentProperty, className: this.className, name: this.name };

        for (const propertyName in this) {
            if (propertyName in shallow) {
                // console.log(`SetupBase[${this.constructor.name}].getShallow: ${propertyName} exists`);
            } else if (SetupBase.notSerialisedProperties.includes(propertyName)) {
                // console.log(`SetupBase[${this.constructor.name}].getShallow: ignore ${propertyName}`);
            } else {
                const value = this[propertyName];
                switch (typeof value) {
                    case 'boolean':
                    case 'number':
                    case 'string':
                        // console.log(`SetupBase[${this.constructor.name}].getShallow: copy ${propertyName} of type ${typeof value}`);
                        shallow[propertyName as string] = value;
                        break;
                    case 'object':
                        if (value instanceof SetupBase) {
                            // console.log(`SetupBase[${this.constructor.name}].getShallow: copy ${propertyName} of SetupBase`);
                            shallow[propertyName as string] = value.getShallow();
                        } else if (value instanceof ObservableSetupBaseMap) {
                            // console.log(`SetupBase[${this.constructor.name}].getShallow: copy ${propertyName} of ObservableSetupBaseMap`);
                            shallow[propertyName as string] = {};
                            for (const id of value.keys()) {
                                shallow[propertyName as string][id] = null;
                            }
                        } else if (isObservableArray(value)) {
                            // console.log(`SetupBase[${this.constructor.name}].getShallow: copy ${propertyName} of ObservableArray`);
                            shallow[propertyName as string] = value.map(item => SetupBase.getPlainValue(item));
                        } else {
                            throw new Error(`SetupBase[${this.constructor.name}].getShallow: Invalid class type ${typeof value} for ${propertyName}`);
                        }
                        break;
                    case 'function':
                    case 'symbol':
                        // console.warn(`SetupBase[${this.constructor.name}].getShallow: ignore ${propertyName} of type ${typeof value}`);
                        break;
                    case 'undefined':
                        console.log(`SetupBase[${this.constructor.name}].getShallow: ignore ${propertyName} of type ${typeof value}`);
                        break;
                    case 'bigint':
                        throw new Error(`SetupBase[${this.constructor.name}].getShallow: Invalid type ${typeof value} for ${propertyName}`);
                    default:
                        throw new Error(`SetupBase[${this.constructor.name}].getShallow: Unkown type ${typeof value} for ${propertyName}`);
                }
            }
        }
        return shallow;
    }

    /**
    * Returns a deep plain javascript object.
    */
    getDeep(): SetupBaseInterface {
        return this.getPlain(-1);
    }

    getPlain(depth: number): SetupBaseInterface {
        const shallow: SetupBaseInterface = { id: this.id, parentId: this.parentId, parentProperty: this.parentProperty, className: this.className, name: this.name };

        for (const propertyName in this) {
            if (propertyName in shallow) {
                // console.log(`SetupBase[${this.constructor.name}].getPlain: ${propertyName} exists`);
            } else if (SetupBase.notSerialisedProperties.includes(propertyName)) {
                // console.log(`SetupBase[${this.constructor.name}].getPlain: ignore ${propertyName}`);
            } else {
                const value = this[propertyName];
                switch (typeof value) {
                    case 'boolean':
                    case 'number':
                    case 'string':
                        // console.log(`SetupBase[${this.constructor.name}].getPlain: copy ${propertyName} of type ${typeof value}`);
                        shallow[propertyName as string] = value;
                        break;
                    case 'object':
                        if (value instanceof SetupBase) {
                            // console.log(`SetupBase[${this.constructor.name}].getPlain: copy ${propertyName} of SetupBase`);
                            shallow[propertyName as string] = value.getPlain(depth);
                        } else if (value instanceof ObservableSetupBaseMap) {
                            // console.log(`SetupBase[${this.constructor.name}].getPlain: copy ${propertyName} of ObservableSetupBaseMap`);
                            shallow[propertyName as string] = {};
                            for (const [id, child] of value.entries()) {
                                if ((depth == 0) || (child == null)) {
                                    shallow[propertyName as string][id] = null;
                                } else {
                                    shallow[propertyName as string][id] = (child as SetupBase).getPlain(depth - 1);
                                }
                            }
                        } else if (isObservableArray(value)) {
                            shallow[propertyName as string] = value.map(item => SetupBase.getPlainValue(item));
                        } else {
                            throw new Error(`SetupBase[${this.constructor.name}].getPlain: Invalid class type ${typeof value} for ${propertyName}`);
                        }
                        break;
                    case 'function':
                    case 'symbol':
                        // console.warn(`SetupBase[${this.constructor.name}].getPlain: ignore ${propertyName} of type ${typeof value}`);
                        break;
                    case 'undefined':
                        // console.log(`SetupBase[${this.constructor.name}].getPlain: ignore ${propertyName} of type ${typeof value}`);
                        break;
                    case 'bigint':
                        throw new Error(`SetupBase[${this.constructor.name}].getPlain: Invalid type ${typeof value} for ${propertyName}`);
                    default:
                        throw new Error(`SetupBase[${this.constructor.name}].getPlain: Unkown type ${typeof value} for ${propertyName}`);
                }
            }
        }
        return shallow;
    }


    static getPlainValue = (objectValue: PropertyType): InterfacePropertyType => {
        switch (typeof objectValue) {
            case 'boolean':
            case 'number':
            case 'string':
                return objectValue;
                break;
            case 'object':
                if (objectValue instanceof SetupBase) {
                    return objectValue.getShallow();
                } else if (objectValue instanceof ObservableSetupBaseMap) {
                    // console.log(`ControllerImpl[${this.constructor.name}].getPlainValue: copy ${propertyName} of ObservableSetupBaseMap`);

                    const shallow = {};
                    for (const id of objectValue.keys()) {
                        shallow[id] = null;
                    }
                    return shallow;
                } else if (isObservableArray(objectValue)) {
                    return objectValue.map(item => SetupBase.getPlainValue(toJS(item, { recurseEverything: true })));
                }
                throw new Error(`SetupBase.getPlainValue(${objectValue}) not supported so far: ${typeof objectValue}`);
            default:
                throw new Error(`SetupBase.getPlainValue(${objectValue}) not supported so far: ${typeof objectValue}`);
        }
    }

    public static createNewInterface(className: string, parentId: SetupItemId, parentProperty: PropertyKey, id?: SetupItemId): SetupBaseInterface {
        id = id == undefined ? SetupBase.getNewId(className) : id;

        const info = SetupBase.infos[className];
        const plain: SetupBaseInterface = {
            id,
            parentId,
            parentProperty,
            className,
            name: id,
        };

        setDefaults(plain, info.schema, info.schema);

        return plain;
    }

    public static createNew(className: string, parentId: SetupItemId, parentProperty: PropertyKey): SetupBase {
        const plain = SetupBase.createNewInterface(className, parentId, parentProperty);

        const newItem = create(plain);

        return newItem;
    }

    public static instances: { [index: string]: SetupBase } = {};
    public static mobxInstances: { [index: string]: SetupBase } = {};

    public static getNewId(prefix: string): string {
        return prefix + '-' + shortid.generate();
    }

    protected static register<SetupClass extends SetupBase>(factory: SetupConstructor<SetupClass>, schema: JSONSchema7, uiSchema: UiSchema): void {
        if (!schema.$id) throw new Error(`SetupBase.register() no $id: ${JSON.stringify(schema)}`);

        // if (schema.$id != ('#' + factory.name))
        //     throw new Error(`SetupBase.register(): (Class name) #factory.name != schema.$id: #${factory.name} != ${schema.$id} schema=${JSON.stringify(schema)}`);
        SetupBase.addSchema(schema, uiSchema);

        if (schema.$id != factory.name) {
            console.warn(`SetupBase.register: register ${factory.name} as ${schema.$id}`);
            register(factory, schema.$id);
        } else {
            register(factory);
        }
    }

    deleteChild(id: SetupItemId): void {
        throw new Error(`SetupBase[${this.constructor.name}, ${this.id}] has no deleteChild(${id}) method`);
    }
}
