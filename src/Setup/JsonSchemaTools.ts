import { JSONSchema7 } from 'json-schema';
import { SetupBaseInterface } from './SetupInterface';
import { SetupBase } from './SetupBase';
import { cloneDeep, merge } from 'lodash';
import mergeAllOf from 'json-schema-merge-allof';

const resolve = (schema: JSONSchema7, root: JSONSchema7): JSONSchema7 => {
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

    console.log(`resolve(${schema.$ref}): Resolved ${itemName}: `, resolved);

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
    console.log(`setDefault: [${target.id}@${target.parentId}].${property}==${target[property]} const=${schema.const} default=${schema.default}`, target, schema);


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

        console.log(
            `setDefault: [${target.id}@${target.parentId}].${property}==${target[property]} simplified const=${simpleSchema.const} default=${simpleSchema.default}`,
            target,
            simpleSchema
        );
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

                console.log(
                    `setRequired(${target.className}@${target.id}.[${property}/${propertySchema.$id}] try create ` +
                    `type=${propertySchema.type} className.const=${typeof (propertySchema.properties?.className as JSONSchema7)?.const}`,
                    propertySchema);

                if (propertySchema.type == 'object') {
                    if (typeof (propertySchema.properties?.className as JSONSchema7)?.const == 'string') {
                        const className = (propertySchema.properties?.className as JSONSchema7)?.const as string;

                        console.log(
                            `setRequired(${target.className}@${target.id}.[${property}/${propertySchema?.$id}] = create new ${className}`);

                        target[property] = SetupBase.createNewInterface(
                            className,
                            target.id
                        );
                    } else {
                        console.log(
                            `setRequired(${target.className}@${target.id}.[${property}/${propertySchema?.$id}] = new {}`);
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

    console.log(`setDefaults( target=${target.id}, ${schema.$id}.${schema.$ref}.${schema.type} )`, target, schema);

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

