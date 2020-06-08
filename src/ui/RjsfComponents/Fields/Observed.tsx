import React from 'react';
import { FieldProps, ErrorSchema } from '@rjsf/core';
import SchemaField from '@rjsf/core/lib/components/fields/SchemaField';
import Ajv from 'ajv';
import { SetupBase } from '../../../Setup/SetupBase';
import { moveToTarget } from '../Utils';
import { FormContext } from '../FormContext';


const ajv = (new Ajv()).addSchema(SetupBase.activeSchema);



/**
 * 
 * @see https://github.com/rjsf-team/react-jsonschema-form/issues/651
 * @param props 
 */
const Observed = (props: FieldProps): JSX.Element => {
    //Only process if we are dealing with a field, not the parent object
    if ('name' in props) {
        const formContext = props.registry.formContext as FormContext;

        const originalOnChange = props.onChange;

        // console.log(`${module.id}.ObservedField[${props.idSchema.$id}] props=`, props);
        // const ajv = ajvs[formContext.plugin.className];
        if (!ajv) {
            // console.error(`${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] no ajv for : ${formContext.root.className}`, props);
        } else {
            let fValidate;

            const schema = props.schema.$ref ?
                { $ref: SetupBase.activeSchema.$id + props.schema.$ref.substr('#'.length) } :
                props.schema;
            // const schema = props.schema;

            try {
                fValidate = ajv.getSchema(props.idSchema.$id) ?? ajv.addSchema(schema, props.idSchema.$id).getSchema(props.idSchema.$id);
            } catch (error) {
                console.error(
                    `${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] creating validate function caught: ${error} from: ${JSON.stringify(schema)}`,
                    error, schema);
            }

            if (!fValidate) {
                console.error(`${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] can't create validate function from: ${JSON.stringify(schema)}`, props);
                //throw new Error(`${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] can't create validate function from: ${JSON.stringify(props.schema)}`);
            } else {
                // console.log(`${module.id}.ObservedField[${props.idSchema.$id}] ${JSON.stringify(schema)}`);

                const validate = fValidate;


                const customProps = {
                    ...props,
                    onChange: (newValue, es?: ErrorSchema): void => {
                        // console.log(`${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] onChange=`, newValue, props, es);

                        originalOnChange(newValue, es);

                        // console.log(`${module.id}.ObservedField[${props.idSchema.$id}][${props.name}] onChange=`, newValue, props, es);
                        // Split idSchema $id <RootPrefix>_<RootProperty>_<Childproperty>
                        // const [target, name] = moveToTarget(
                        //     formContext.root,
                        //     props.idSchema.$id.split('_'));

                        // if (newValue.id) {
                        //     if (newValue.id != target[name]?.id) {
                        //         console.error(`${module.id}.ObservedField[${props.idSchema?.$id}][${name}].onChange: ${newValue.id} != ${target[name]?.id}`);
                        //     } else {
                        //         // console.log(`${module.id}.ObservedField[${props.idSchema?.$id}][${name}].onChange: skip ${newValue.id} == ${target[name]?.id}`);
                        //     }
                        // } else {
                        //     if (validate(newValue)) {
                        //         // console.log(`${module.id}.ObservedField[${props.idSchema?.$id}][${name}]== ${target[name]} = ${newValue}`);
                        //         target[name] = newValue;
                        //     } else {
                        //         console.warn(
                        //             `${module.id}.ObservedField[${props.idSchema?.$id}][${name}]== ${target[name]} = -> ${newValue} <- :` +
                        //             ` ${validate.errors ? validate.errors.map(error => `${error.dataPath}:${error.message}`) : ''}`,
                        //             { ...validate.errors }, newValue);
                        //     }
                        // }
                    }
                };
                return (
                    <SchemaField {...customProps} />
                );
            }
        }
    }
    return (
        <SchemaField {...props} />
    );
};

export default Observed;
