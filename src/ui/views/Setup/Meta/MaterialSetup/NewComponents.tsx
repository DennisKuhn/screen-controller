/** Show Title. description and icon */

import { BasePropsWithChildren, ActionProps, IconProps } from '../../Shared';
import { Tooltip, Grid, makeStyles, Theme, IconButton, Badge } from '@material-ui/core';
import React, { useState, Fragment } from 'react';
import { SpeedDialAction, SpeedDial, SpeedDialIcon } from '@material-ui/lab';
import { ExpandLess, Add } from '@material-ui/icons';
import { getInputWidth } from '../../InputWidth';

const btnSize = 40;

const useStyles = makeStyles((theme: Theme) => {
    return ({
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
        smallField: {
            minWidth: (getInputWidth() + 2 * theme.spacing(1) + 30) / 2,
            marginBottom: theme.spacing(2),
            padding: '0 15px !important'
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

    return (<Grid item className={classes.smallField}>
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
            >
                {props.children}
            </SpeedDial>
        </div>
    </Grid>);
};

const SingleNewContainer = (props: BasePropsWithChildren): JSX.Element => <Fragment>{props.children}</Fragment>;

//const NewContainer = (props: BasePropsWithChildren): JSX.Element => props.schema.oneOf === undefined ? SingleNewContainer(props) : ExpandableNewContainer(props);
export const NewContainer = (props: BasePropsWithChildren): JSX.Element => ExpandableNewContainer(props);
