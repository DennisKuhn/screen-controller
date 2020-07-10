import React, { PropsWithChildren } from 'react';
import { SetupBase } from '../../../Setup/SetupBase';
import { SetupItemId } from '../../../Setup/SetupInterface';
import { getProspect } from './AbstractComponents';
import ObjectForm from './ObjectForm';
import { WrapperProps } from './Registry';

interface Props {
    value: SetupBase | SetupItemId;
}

const RootElement = (props: PropsWithChildren<{}> & WrapperProps): JSX.Element => getProspect('Root', props);

const Form = ({ value }: Props): JSX.Element => {

    const key = value['id'] ?? value;

    return (
        <RootElement key={key} elementKey={key}>
            <ObjectForm value={value} />
        </RootElement>);
};

export default Form;
