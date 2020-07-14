import React, { useState, useEffect } from 'react';
import { SetupBase } from '../../../Setup/SetupBase';
import SetupObject from './SetupObject';
import { SetupItemId } from '../../../Setup/SetupInterface';
import controller from '../../../Setup/Controller/Factory';
import Typography from '@material-ui/core/Typography';
import { Options } from './PropTypes';

interface Props {
    value: SetupBase | SetupItemId;
    options: Options;
}

interface LoaderProps {
    id: SetupItemId;
    options: Options;
}

const Loader = ({ id, options }: LoaderProps): JSX.Element => {
    const [item, setItem] = useState(undefined as SetupBase | undefined);

    useEffect(() => {
        controller.getSetup(id, 0)
            .then(setItem);
    }, []);

    return item ? <SetupObject setup={item} options={options} /> : <Typography>Loading {id} ...</Typography>;
};

const ObjectForm = ({ value, options }: Props): JSX.Element => {
    if (typeof value == 'string') {
        return <Loader id={value} key={value + '-Loader'} options={options}/>;
    } else {
        return <SetupObject setup={value} options={options}/>;
    }
};

export default ObjectForm;
