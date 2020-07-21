import React, { Fragment, useEffect, useState } from 'react';
import { ScSchema7 } from '../../../Setup/ScSchema7';
import { SetupBase } from '../../../Setup/SetupBase';
import { callerAndfName } from '../../../utils/debugging';
import {
    PropertyProps,
    WrapperProps,
    ChangeEventArgs,
    isChangeEvent,
    ObjectPropsWithChildren,
    Options
} from './PropTypes';
import { getProspect, Field, LabelContainer, LabelView, ValueContainer, ValueInput, getLabel, getType } from './AbstractComponents';
import { autorun } from 'mobx';
import ErrorNotification from './ErrorNotification';
import { observer } from 'mobx-react-lite';


interface FieldBuilderProps {
    property: string;
    schema: ScSchema7;
    setup: SetupBase;
    options: Options;
}

const FieldBuilder = observer(({ property, schema, setup, options }: FieldBuilderProps): JSX.Element => {
    if (schema.scHidden == true)
        throw new Error(`${callerAndfName()} ${setup.id}.${property} is hidden`);

    const onChange = (change: ChangeEventArgs): void => {
        if (isChangeEvent(change)) {
            const { target } = change;
            const type: string = target['type'] ?? target.nodeType;
            let value;

            switch (type) {
                case 'number':
                    value = target['valueAsNumber'] !== undefined ? target['valueAsNumber'] : target['value'] !== undefined ? Number(target['value']) : target.nodeValue;
                    break;
                case 'checkbox':
                    value = target['checked'];
                    break;
                default:
                    value = target['value'] !== undefined ? target['value'] : target.nodeValue;
                    break;
            }
            setup[property] = value;
        } else {
            setup[property] = change;
        }
    };

    const label = getLabel(undefined, property, schema);
    const value = setup[property];
    const baseKey = `${setup.id}.${property}`;
    const sharedProps /*: AllPropsType*/ = {
        key: baseKey,
        item: setup,
        rawLabel: label,
        label,
        property,
        schema,
        rawValue: value,
        value,
        cacheId: baseKey,
        readOnly: schema.readOnly === true || schema.scViewOnly === true,
        helperText: schema.description,
        rawHelperText: schema.scDescriptionTranslationId ?? schema.description,
        type: getType(schema),
        options,
        onChange
    };

    const fieldProps: PropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-Field',
        elementKey: baseKey + '-Field'
    };
    const labelContainerProps: PropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-labelContainer',
        elementKey: baseKey + '-labelContainer'
    };

    const valueContainerProps: PropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-valueContainer',
        elementKey: baseKey + '-valueContainer'
    };

    const labelViewProps: PropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-labelView',
        elementKey: baseKey + '-labelView',
        contentChild: label,
    };

    const valueInputProps: PropertyProps & WrapperProps = {
        ...sharedProps,
        key: baseKey + '-valueInput',
        elementKey: baseKey + '-valueInput'
    };

    return (
        <Fragment>
            {value instanceof SetupBase &&
                <ErrorNotification item={value} />}

            <Field {...fieldProps}>
                <LabelContainer {...labelContainerProps}>
                    <LabelView {...labelViewProps} />
                </LabelContainer>
                <ValueContainer {...valueContainerProps} >
                    <ValueInput {...valueInputProps} />
                </ValueContainer>
            </Field>
        </Fragment>
    );
});


interface SetupObjectProps {
    setup: SetupBase;
    options: Options;
}
const ContainerObject = (props: ObjectPropsWithChildren & WrapperProps): JSX.Element => getProspect('Object', props);

const SetupObject = ({ setup, options }: SetupObjectProps): JSX.Element => {
    if (setup === undefined)
        throw new Error(`${callerAndfName()} No setup object`);

    const schema = setup.simpleSchema;
    const properties = setup.properties;
    const key = setup.id + '-object';
    //    const label = getLabel(setup.name, setup.parentProperty, schema);
    const [label, setLabel] = useState(getLabel(setup.name, setup.parentProperty, schema));

  
    useEffect(() =>
        autorun(() =>
            setLabel(
                getLabel(setup.name, setup.parentProperty, schema))
        ), []);

    if (properties == undefined) throw new Error(`${callerAndfName()}(${setup.id}/${setup.className}) no properties in simpleSchema`);

    const visibleProperties = Object.entries(properties)
        .filter(([, schema]) =>
            (typeof schema == 'object') &&
            ((schema as ScSchema7).scHidden !== true) &&
            ((!options.ignoreViewOnly) || ((schema as ScSchema7).scViewOnly !== true && schema.readOnly !== true)))
        .sort(([, schemaA], [, schemaB]) => {
            if (typeof schemaA === 'object' && schemaA.type === 'object')
                return 1;
            if (typeof schemaB === 'object' && schemaB.type === 'object')
                return -1;
            return 0;
        }
        );

    return (
        <ContainerObject
            key={key}
            elementKey={key}
            item={setup}
            cacheId={key}
            schema={schema}
            label={label}
            rawLabel={label}
            helperText={schema.description}
            rawHelperText={schema.scDescriptionTranslationId ?? schema.description}
            options={options}
            // getLabel={(): string => getLabel(setup.name, setup.parentProperty, schema)}
            >
            <ErrorNotification item={setup} />
            {
                visibleProperties.map(([property, schema]) =>
                    <FieldBuilder
                        key={`${setup.id}.${property}-Builder`}
                        setup={setup}
                        property={property}
                        schema={schema as ScSchema7}
                        options={options}
                    />
                )
            }
        </ContainerObject>
    );
};


export default SetupObject;
