import React, { useState, useEffect } from 'react';
import { SetupBase } from '../../../Setup/SetupBase';
import SetupObject from './SetupObject';
import { SetupItemId } from '../../../Setup/SetupInterface';
import controller from '../../../Setup/Controller/Factory';
import Typography from '@material-ui/core/Typography';

interface Props {
    value: SetupBase | SetupItemId;
}

interface LoaderProps {
    id: SetupItemId;
}

const Loader = ({ id }: LoaderProps): JSX.Element => {
    const [item, setItem] = useState(undefined as SetupBase | undefined);

    useEffect(() => {
        controller.getSetup(id, 0)
            .then(setItem);
    }, []);

    return item ? <SetupObject setup={item} /> : <Typography>Loading {id} ...</Typography>;
};

const ObjectForm = ({ value }: Props): JSX.Element => {
    if (typeof value == 'string') {
        return <Loader id={value} key={value + '-Loader'} />;
    } else {
        return <SetupObject setup={value} />;
    }
};

export default ObjectForm;
