/** Show Title. description and icon */

import { BasePropsWithChildren, ActionProps, IconProps } from '../../PropTypes';
import { Tooltip, Grid, makeStyles, IconButton, Badge } from '@material-ui/core';
import React, { useState } from 'react';
import { SpeedDialAction, SpeedDial, SpeedDialIcon } from '@material-ui/lab';
import { ExpandLess, Add } from '@material-ui/icons';
import { ExtendedTheme } from '../../../../assets/Theme';


const btnSize = 40;

const useStyles = makeStyles((theme: ExtendedTheme) => {
    return ({
        ...theme.columnDefaults,
        container: {
            ...theme.columnDefaults.largeFieldContainer,
            display: 'flex',
            alignItems: 'center',
        },
        speedDial: {
            position: 'absolute',
            bottom: 0,// theme.spacing(2),
            left: 0,//theme.spacing(2),
            height: btnSize,
        },
        speedDialContainer: {
            height: btnSize,
            width: btnSize,
            position: 'relative'
        },
        actionsContainer: {
//            flexWrap: 'wrap',
        },
        newButton: {
            marginLeft: '35px',
            marginRight: '35px',
        },
        newTitle: {
            ...theme.typography.caption,
            top: '-1em',
        },
    });
});

export const NewItem = (props: BasePropsWithChildren & ActionProps & IconProps): JSX.Element => {
    const {
        children,
        item,
        schema,
        cacheId,
        label,
        options,
        rawLabel,
        helperText,
        rawHelperText,
        ...rest } = props;

    const classes = useStyles();

    return (
        <Tooltip title={helperText ?? ''} placement="bottom" >
            <SpeedDialAction
                {...rest}
                // key={`${props.item.id}-new-${props.schema.$id}-action`}
                icon={children}
                tooltipTitle={label}
                tooltipPlacement="top"
                tooltipOpen
                className={classes.newButton}
                classes={{
                    staticTooltipLabel: classes.newTitle,
                }}
            />
        </Tooltip>
    );
};

export const SingleNewItem = (props: BasePropsWithChildren & ActionProps & IconProps): JSX.Element => {
    const {
        children,
        item,
        schema,
        cacheId,
        label,
        options,
        rawLabel,
        helperText,
        rawHelperText,
        ...rest } = props;

    return (
        <Tooltip title={('Add a ' + label + ': ' + helperText)} >
            <IconButton
            className={useStyles().largeField}
                {...rest}
            >
                <Badge badgeContent='+' color='primary'>
                    {children}
                </Badge>                    
            </IconButton>
        </Tooltip>
    );
};

const ExpandableNewContainer = (props: BasePropsWithChildren): JSX.Element => {
    const classes = useStyles();
    const [open, setOpen] = useState(false);

    const handleOpen = (): void => setOpen(true);
    const handleClose = (): void => setOpen(false);

    return (<Grid item className={classes.container}>
        <div className={classes.speedDialContainer}>
            <SpeedDial
                ariaLabel="SpeedDial tooltip example"
                className={classes.speedDial}
                hidden={false}
                icon={<SpeedDialIcon openIcon={<ExpandLess />} icon={<Add />} />}
                onClose={handleClose}
                onOpen={handleOpen}
                open={open}
                direction="right"
                // classes={{actions: classes.actionsContainer}}
            >
                {props.children}
            </SpeedDial>
        </div>
    </Grid>);
};

export const NewContainer = (props: BasePropsWithChildren): JSX.Element => ExpandableNewContainer(props);
