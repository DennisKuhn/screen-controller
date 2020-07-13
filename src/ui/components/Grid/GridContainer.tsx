import React from 'react';
// @material-ui/core components
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core';

const useStyle = makeStyles({
    grid: {
        margin: '0 -15px !important',
        width: 'unset',
        position: 'relative',
    }
});

function GridContainer(props: any): JSX.Element {
    const { children, ...rest } = props;
    const classes = useStyle();

    return (
        <Grid container={true} {...rest} className={classes.grid}>
            {children}
        </Grid>
    );
}

export default GridContainer;
