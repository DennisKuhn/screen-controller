import React from 'react';
import { SetupBase } from '../../../Setup/SetupBase';
import { SetupItemId } from '../../../Setup/SetupInterface';
import { getProspect } from './AbstractComponents';
import ObjectForm from './ObjectForm';
import { WrapperProps, CommonPropsWithChildren } from './PropTypes';
import { merge } from 'lodash';
import { Options } from './PropTypes';


const defaults: Options = {
    ignoreViewOnly: true,
};

interface Props {
    value: SetupBase | SetupItemId;
    options?: Partial<Options>;
}

const RootElement = (props: CommonPropsWithChildren & WrapperProps): JSX.Element => getProspect('Root', props);

const Form = (props: Props): JSX.Element => {
    const options = merge(defaults, props.options);
    const { value } = props;
    const key = value['id'] ?? value;

    return (
        <RootElement key={key} elementKey={key} options={options} cacheId={key}>
            <ObjectForm value={value} options={options}/>
        </RootElement>);
};

export default Form;
