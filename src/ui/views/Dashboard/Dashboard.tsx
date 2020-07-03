import React from 'react';
import GridContainer from '../../components/Grid/GridContainer';

import Displays from './Displays';
import MainCard from './MainCard';

const render = (): JSX.Element => {
    return (
        <GridContainer>
            <MainCard />
            <Displays />
        </GridContainer>
    );
};

export default render;
