import React from 'react';
import { SetupBase } from '../../../Setup/SetupBase';
import SetupGrid from './SetupGrid';

interface Props {
    value: SetupBase;
}


const Form = ({ value}: Props): JSX.Element => {
    return (
        <SetupGrid setup={value} />
    );
};

export default Form;
