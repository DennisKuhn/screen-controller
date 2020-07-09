import React from 'react';
import { SetupBase } from '../../../Setup/SetupBase';
import SetupObject from './SetupObject';

interface Props {
    value: SetupBase;
}


const Form = ({ value}: Props): JSX.Element => {
    return (
        <SetupObject setup={value} />
    );
};

export default Form;
