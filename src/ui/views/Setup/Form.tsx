import React from 'react';
import { SetupBase } from '../../../Setup/SetupBase';
import SetupGrid from './SetupGrid';

interface Props {
    setup: SetupBase;
}


const Form = ({setup}: Props): JSX.Element => {
    return (
            <SetupGrid setup={setup} />
    );
};

export default Form;
