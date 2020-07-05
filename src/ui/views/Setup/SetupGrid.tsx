import React from 'react';
import { ScSchema7 } from '../../../Setup/ScSchema7';
import { SetupBase } from '../../../Setup/SetupBase';
import { callerAndfName } from '../../../utils/debugging';
import GridContainer from '../../components/Grid/GridContainer';
import GridItem from '../../components/Grid/GridItem';
import { Typography } from '@material-ui/core';

interface Props {
    setup: SetupBase;
}

interface LabelProps {
    property: string;
    schema: ScSchema7;
}

interface ValueProps {
    property: string;
    schema: ScSchema7;
    setup: SetupBase;
}

const Label = ({ property, schema }: LabelProps): JSX.Element => {
    let text = property;

    return (
        <Typography>
            {text}
        </Typography>
    );
};

const Value = ({ property, schema, setup }: ValueProps): JSX.Element => {

    switch (schema.type) {
        case 'number':
        case 'string':
            return (
                <Typography>
                    {setup[property]}
                </Typography>
            );
    }

    return (
        <Typography>?
        </Typography>
    );
};

const Row = (property: string, schema: ScSchema7, setup: SetupBase): JSX.Element | undefined => {
    
    if (schema.scHidden == true) return undefined;

    return (<GridContainer key={`${setup.id}.${property}-row`}>
        <GridItem>
            <Label property={property} schema={schema} />
        </GridItem>
        <GridItem>
            <Value property={property} schema={schema} setup={setup} />
        </GridItem>
    </GridContainer>);
};

const SetupGrid = ({ setup }: Props): JSX.Element => {
    const properties = setup.getSimpleClassSchema().properties;
    if (properties == undefined) throw new Error(`${callerAndfName()}(${setup.id}/${setup.className}) no properties in simpleSchema`);

    return (
        <GridContainer key={`${setup.id}-container`}>
            {
                Object.entries(properties)
                    .map( ([property, schema]) => typeof schema == 'object' && Row(property, schema, setup) )
                    .filter( prospect => prospect )
            }
        </GridContainer>
    );
};

export default SetupGrid;
