import { JSONSchema7 } from 'json-schema';
import { SetupBaseInterface } from './SetupInterface';
import { SetupBase } from './SetupBase';
import { cloneDeep, merge } from 'lodash';
import mergeAllOf from 'json-schema-merge-allof';
import { callerAndfName } from '../utils/debugging';

export const resolve = (schema: JSONSchema7, root: JSONSchema7): JSONSchema7 => {
    if (typeof schema.$ref != 'string')
        return schema;

    const itemName = schema.$ref.split(/[#/]/).pop();

    if (!itemName)
        throw new Error(`setDefaults: Can't resolve ${schema.$ref} from ${JSON.stringify(root)}`);

    if (!root.definitions)
        throw new Error(`setDefaults: Can't resolve ${schema.$ref}=>${itemName} without definitions in ${JSON.stringify(root)}`);

    const resolved = root.definitions[itemName];

    if (!resolved)
        throw new Error(`setDefaults: Can't resolve ${schema.$ref}=>${itemName} in ${JSON.stringify(root.definitions)} from ${JSON.stringify(root)}`);

    if (typeof resolved != 'object')
        throw new Error(`setDefaults: Can't resolve ${schema.$ref}=>${itemName} resolved is not an object ${JSON.stringify(resolved)} from ${JSON.stringify(root)}`);

    // console.log(`resolve(${schema.$ref}): Resolved ${itemName}: `, resolved);

    return resolve(resolved, root);
};

/**
 * First resolve $ref in allOf and then mergeAllOf
 * @param schema will be modified during resolving
 * @param root used for resolving
 */
const mergeSchema = (schema: JSONSchema7, root: JSONSchema7): JSONSchema7 => {
    if (schema.allOf) {
        for (const one of schema.allOf) {
            if (one instanceof Object) {
                if (typeof one.$ref == 'string') {

                    let $ref: string;

                    do {
                        $ref = one.$ref;
                        merge(
                            one,
                            resolve({ $ref }, root)
                        );
                    } while (one.$ref != $ref);

                    delete one.$ref;
                }
            }
        }
        schema = mergeAllOf(schema);
    }
    return schema;
};

const setDefault = (target: SetupBaseInterface, property: string, schema: JSONSchema7, root: JSONSchema7): void => {
    // console.log(`setDefault: [${target.id}@${target.parentId}].${property}==${target[property]} const=${schema.const} default=${schema.default}`, target, schema);


    if (!(property in target)) {
        const simpleSchema = mergeSchema(
            cloneDeep(
                resolve(
                    schema,
                    root
                )
            ),
            root
        );

        // console.log(
        //     `setDefault: [${target.id}@${target.parentId}].${property}==${target[property]} simplified const=${simpleSchema.const} default=${simpleSchema.default}`,
        //     target,
        //     simpleSchema
        // );
        if (simpleSchema.const != undefined) {
            target[property] = simpleSchema.const;
        } else if (simpleSchema.default != undefined) {
            target[property] = simpleSchema.default;
        }
    }
};

const setRequired = (target: SetupBaseInterface, schema: JSONSchema7, root: JSONSchema7): void => {
    if (schema.required && schema.properties) {
        for (const property of schema.required) {
            if (!(property in target)) {
                const propertySchema = mergeSchema(
                    cloneDeep(
                        resolve(
                            (schema.properties[property] as JSONSchema7),
                            root
                        )
                    ),
                    root
                );

                // console.log(
                //     `setRequired(${target.className}@${target.id}.[${property}/${propertySchema.$id}] try create ` +
                //     `type=${propertySchema.type} className.const=${typeof (propertySchema.properties?.className as JSONSchema7)?.const}`,
                //     propertySchema);

                if (propertySchema.type == 'object') {
                    if (typeof (propertySchema.properties?.className as JSONSchema7)?.const == 'string') {
                        const className = (propertySchema.properties?.className as JSONSchema7)?.const as string;

                        // console.log(
                        //     `setRequired(${target.className}@${target.id}.[${property}/${propertySchema?.$id}] = create new ${className}`);

                        target[property] = SetupBase.createNewInterface(
                            className,
                            target.id,
                            property
                        );
                    } else {
                        // console.log(
                        //     `setRequired(${target.className}@${target.id}.[${property}/${propertySchema?.$id}] = new {}`);
                        target[property] = {};
                    }
                } else {
                    // console.error(
                    //     `setRequired(${target.className}@${target.id}.[${property}/${propertySchema.$id}]) is required, don't know how to create -> ${propertySchema.type} <-`
                    // );
                }
            }
        }
    }
};

export const setDefaults = (target: SetupBaseInterface, schema: JSONSchema7, root: JSONSchema7): SetupBaseInterface => {

    // console.log(`setDefaults( target=${target.id}, ${schema.$id}.${schema.$ref}.${schema.type} )`, target, schema);

    if (schema.$ref != undefined) {
        setDefaults(
            target,
            resolve(schema as { $ref: string }, root),
            root
        );
    }
    if (schema.allOf) {
        for (const entry of schema.allOf) {
            setDefaults(target, entry as JSONSchema7, root);
        }
    }
    if (schema.properties) {
        for (const [property, schemaDef] of Object.entries(schema.properties)) {
            setDefault(target, property, schemaDef as JSONSchema7, root);
        }
        setRequired(target, schema, root);
    }
    return target;
};

/**
 * 
 * @param target Non-existing optional variables are set to undefined in observables. E.g. so they exist as member.
 * @param observables dictionary of unused optional members set to undefined
 * @param schema
 * @param root schema with /definitions
 */
export const setOptionals = (target: SetupBase, observables: any, schema: JSONSchema7, root: JSONSchema7): void => {

    console.log(`${callerAndfName()} ( target=${target.id}, ${schema.$id}.${schema.$ref}.${schema.type} )`, target, schema);

    if (schema.$ref != undefined) {
        setOptionals(
            target,
            observables,
            resolve(schema as { $ref: string }, root),
            root
        );
    }
    if (schema.allOf) {
        for (const entry of schema.allOf) {
            setOptionals(target, observables, entry as JSONSchema7, root);
        }
    }
    if (schema.properties) {
        for (const property in schema.properties) {
            if ((!(property in target)) && ((schema.required == undefined)
                || (!schema.required.includes(property)))) {
               
                console.debug(`${callerAndfName()} ${target.id}.${property} = undefined`/*, target, schema */);
                observables[property] = undefined;
            }
        }
    }
};


export const forEach = (schema: JSONSchema7, action: (s: JSONSchema7) => void): void => {
    action(schema);

    if (schema.properties) {
        for (const property of Object.values(schema.properties)) {
            if (typeof property == 'object')
                forEach(property, action);
        }
    }
    if (typeof schema.additionalProperties == 'object')
        forEach(schema.additionalProperties, action);

    if (schema.oneOf) {
        for (const subSchema of schema.oneOf) {
            if (typeof subSchema == 'object')
                forEach(subSchema, action);
        }
    }
    if (schema.allOf) {
        for (const subSchema of schema.allOf) {
            if (typeof subSchema == 'object')
                forEach(subSchema, action);
        }
    }
    if (schema.anyOf) {
        for (const subSchema of schema.anyOf) {
            if (typeof subSchema == 'object')
                forEach(subSchema, action);
        }
    }
    if (schema.definitions) {
        for (const subSchema of Object.values(schema.definitions)) {
            if (typeof subSchema == 'object')
                forEach(subSchema, action);
        }
    }
};



export const replaceEach = (schema: JSONSchema7, root: JSONSchema7, replacer: (s: JSONSchema7, root: JSONSchema7) => JSONSchema7 | undefined): void => {
    if (schema.properties) {
        for (const [property, prospect] of Object.entries(schema.properties)) {
            if (typeof prospect == 'object') {
                const replacement = replacer(prospect, root);

                if (replacement) {
                    // console.log(`replaceEach: ${schema.$id}/${schema.$ref} replace .${property} = ${replacement.$id}/${replacement.$ref}`);
                    schema.properties[property] = replacement;
                }
                replaceEach(schema.properties[property] as JSONSchema7, root, replacer);
            }
        }
    }
    if (typeof schema.additionalProperties == 'object') {
        const replacement = replacer(schema.additionalProperties, root);

        if (replacement) {
            // console.log(`replaceEach: ${schema.$id}/${schema.$ref} replace .additionalProperties = ${replacement.$id}/${replacement.$ref}`);
            schema.additionalProperties = replacement;
        }
        replaceEach(schema.additionalProperties, root, replacer);
    }
    if (schema.oneOf) {
        for (const subSchema of schema.oneOf) {
            if (typeof subSchema == 'object') {
                replaceEach(subSchema, root, replacer);
            }
        }
    }
    if (schema.allOf) {
        for (const subSchema of schema.allOf) {
            if (typeof subSchema == 'object')
                replaceEach(subSchema, root, replacer);
        }
    }
    if (schema.anyOf) {
        for (const subSchema of schema.anyOf) {
            if (typeof subSchema == 'object')
                replaceEach(subSchema, root, replacer);
        }
    }
    if (schema.definitions) {
        for (const subSchema of Object.values(schema.definitions)) {
            if (typeof subSchema == 'object')
                replaceEach(subSchema, root, replacer);
        }
    }
};

const concretesBuffer = new Map<string, JSONSchema7[]>();

export const getConcretes = (abstractId: string, root: JSONSchema7): JSONSchema7[] => {
    if (!root.definitions)
        throw new Error(`getConcretes(${abstractId}) no definitions in root=${JSON.stringify(root)}`);

    const cached = concretesBuffer.get(abstractId);
    if (cached != undefined) {
        // console.log(`getConcretes(${abstractId}) return cached ${cached.length}`);
        return cached;
    }

    // console.log(`getConcretes(${abstractId})`);

    const concretes: JSONSchema7[] = [];

    const defsWithRefs = Object.entries(root.definitions)
        .filter(([, schema]) => (typeof schema == 'object') &&
            schema.allOf?.some(part => (typeof part == 'object') &&
                part.$ref == abstractId));

    for (const [id, definition] of defsWithRefs) {
        if (typeof definition != 'object')
            throw new Error(`getConcretes(${abstractId}) definitions/${id} is not an object root=${JSON.stringify(root)}`);

        let childConcretes: JSONSchema7[] = [];

        if (definition.$id) {
            childConcretes = getConcretes(definition.$id, root);
        }
        if (childConcretes.length) {
            // console.log(`getConcretes(${abstractId}) [${id}/${definition.$id}] add ${childConcretes.length}`);
            concretes.push(...childConcretes);
        } else {
            // console.log(`getConcretes(${abstractId}) add ${id}/${definition.$id}`);
            concretes.push(definition);
        }
    }
    // console.log(`getConcretes(${abstractId}) return ${concretes.length}`);
    concretesBuffer.set(abstractId, concretes);
    return concretes;
};

const expandAbstractRef = (schema: JSONSchema7, root: JSONSchema7): JSONSchema7 | undefined => {
    if (schema.$ref) {
        const replacement = {
            oneOf: getConcretes(schema.$ref, root)
        };

        if (replacement.oneOf.length)
            return replacement;
    } if (schema.oneOf) {
        const oneOf = schema.oneOf;
        oneOf.forEach((option, index) => {
            if ((typeof option == 'object') && option.$ref) {
                const concretes = getConcretes(option.$ref, root);

                if (concretes.length) {
                    // console.log(`expandAbstractRef: ${option.$ref} replace .oneOf[${index}] = ${concretes.length}`);

                    oneOf.splice(index, 1);
                    oneOf.push(...concretes);
                }
            }
        }
        );
    }
};

export const replaceAbstractRefsWithOneOfConcrets = (root: JSONSchema7): void => {

    replaceEach(
        root, root,
        expandAbstractRef
    );
};
