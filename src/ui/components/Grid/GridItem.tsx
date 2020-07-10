import React from 'react';
// @material-ui/core components
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core';

const useStyle = makeStyles({
    grid: {
        padding: '0 15px !important',
        // display: 'inline-flex'
        // minWidth: 182
    }
});

function GridItem({ ...props }: any): JSX.Element {
    const { children, ...rest } = props;
    const classes = useStyle();

    return (
        <Grid item={true} {...rest} className={classes.grid}>
            {children}
        </Grid>
    );
}

export default GridItem;
