import React, { Fragment, PropsWithChildren, useState } from 'react';
import { TextField, Input, Switch, FormControl, InputLabel, makeStyles, Theme, Grid, Typography, IconButton } from '@material-ui/core';
import { callerAndfName } from '../../../../utils/debugging';
import { InputProps, LabelProps, ObjectPropsWithChildren, PropertyPropsWithChildren, BasePropsWithChildren, ActionProps } from '../Shared';
import registry from '../Registry';
import GridContainer from '../../../components/Grid/GridContainer';
import { TreeItem, TreeView } from '@material-ui/lab';
import { ExpandLess, ExpandMore, Add } from '@material-ui/icons';
import { RelativeRectangle } from '../../../../Setup/Default/RelativeRectangle';
import RectangleEditor from '../../../Fields/RectangleEditor';
import DisplayCard from './Material/DisplayCard';
import { Plugin } from '../../../../Setup/Application/Plugin';
import { Browser } from '../../../../Setup/Application/Browser';

/** Get the width of a standard browser input control */
let inputWidth: undefined | number;

const getInputWidth = (): number => {
    if (inputWidth === undefined) {
        const input = document.createElement('input');
        window.document.body.append(input);
        inputWidth = input.getBoundingClientRect().width;
        window.document.body.removeChild(input);
    }
    return inputWidth;
};

const useStyles = makeStyles((theme: Theme) => {
    return ({
        smallField: {
            minWidth: (getInputWidth() + 2 * theme.spacing(1) + 30) / 2,
            marginBottom: theme.spacing(2),
            padding: '0 15px !important'
        },
        normalField: {
            width: getInputWidth() + 2 * theme.spacing(1) + 30,
            marginBottom: theme.spacing(2),
            padding: '0 15px !important'
        },
        newField: {
            display: 'grid'
        },
        newTextContainer: {
            gridColumn: 1,
            gridRow: 1
        },
        newButton: {
            gridColumn: 1,
            gridRow: 1
        },
        objectField: {
            minWidth: getInputWidth() + 2 * theme.spacing(1) + 30,
            marginBottom: theme.spacing(2),
            padding: '0 15px !important'
        },
        input: {
            minWidth: getInputWidth() + 2 * theme.spacing(1),
        },
        switch: {
            marginTop: theme.spacing(2)
        },
        rectangle: {
            marginTop: theme.spacing(2)
        },
    });
});

console.log(`${callerAndfName()} Register`);

const TextFieldHoc = (props: LabelProps & InputProps): JSX.Element => {
    const classes = useStyles();

    return <TextField
        className={classes.input}
        label={props.label}
        value={props.value}
        type={props.type}
        onChange={props.onChange}
        InputProps={{ readOnly: props.readOnly }}
    />;
};

const SwitchHoc = (props: LabelProps & InputProps): JSX.Element => {
    if (!((typeof props.value == 'boolean') || (typeof props.value == 'undefined')))
        throw new Error(`${callerAndfName()} typeof value=${typeof props.value} must be boolean or undefined`);
    const classes = useStyles();

    return (
        <FormControl>
            <InputLabel shrink={props.value !== undefined}>{props.label}</InputLabel>
            <Switch
                className={classes.switch}
                checked={props.value}
                onChange={props.onChange}
                color="primary"
                readOnly={props.readOnly}
            />
        </FormControl>);
};

const RectangleHoc = (props: LabelProps & InputProps): JSX.Element => {
    if (!((typeof props.value == 'object') && (props.value instanceof RelativeRectangle)))
        throw new Error(`${callerAndfName()} typeof value=${typeof props.value} must be object/RelativeRectangle`);
    const classes = useStyles();

    return (
        <FormControl>
            <InputLabel shrink={props.value !== undefined}>{props.label}</InputLabel>
            <RectangleEditor
                className={classes.rectangle}
                value={props.value}
            // readOnly={props.readOnly}
            />
        </FormControl>);
};

const ObjectTreeItem = (props: ObjectPropsWithChildren): JSX.Element => (
    <TreeItem nodeId={props.item.id} label={props.label}>
        <GridContainer>
            {props.children}
        </GridContainer>
    </TreeItem>
);

/** Show label with cpu usage, GridContainer for the children */
const BrowserTreeItem = (props: ObjectPropsWithChildren): JSX.Element => {
    const browser = props.item;

    if (!((typeof browser == 'object') && (browser instanceof Browser)))
        throw new Error(`${callerAndfName()} typeof value=${typeof browser} must be object/Browser`);
    const cpuUsage = browser.cpuUsage ? browser.cpuUsage * 100 : undefined;
    const cpuUsageText = cpuUsage ? cpuUsage.toFixed(cpuUsage < 10 ? 1 : 0) + '%CPU' : '';

    return (
        <TreeItem nodeId={props.item.id} label={
            <Fragment>
                <Typography>{props.label}</Typography>
                <Typography variant="overline">{cpuUsageText}</Typography>
            </Fragment>
        }>
            <GridContainer>
                {props.children}
            </GridContainer>
        </TreeItem>
    );
};

/** Show label with cpu usage and fps, GridContainer for the children */
const PluginTreeItem = (props: ObjectPropsWithChildren): JSX.Element => {
    const plugin = props.item;

    if (!((typeof plugin == 'object') && (plugin instanceof Plugin)))
        throw new Error(`${callerAndfName()} typeof value=${typeof plugin} must be object/Plugin`);
    const cpuUsage = plugin.cpuUsage ? plugin.cpuUsage * 100 : undefined;
    const cpuUsageText = cpuUsage ? cpuUsage.toFixed(cpuUsage < 10 ? 1 : 0) + '%CPU' : '';
    const fps = plugin.fps;
    const fpsText = fps ? fps.toFixed(0) + ' fps' : '';

    return (
        <TreeItem
            nodeId={plugin.id}
            label={
                <Fragment>
                    <Typography>{props.label}</Typography>
                    <Typography variant="overline">{cpuUsageText} {fpsText}</Typography>
                </Fragment>
        }
            >
            <GridContainer>
                {props.children}
            </GridContainer>
        </TreeItem>
    );
};

/** Show Title. description and icon */
const NewItem = (props: BasePropsWithChildren & ActionProps): JSX.Element => {
    const classes = useStyles();
    return (
        <Grid item className={`${classes.normalField} ${classes.newField}`}>
            <div className={classes.newTextContainer}>
                <Typography>{props.label}</Typography>
                <Typography variant="caption">{props.helperText}</Typography>
            </div>
            <IconButton className={classes.newButton} onClick={props.onClick}>
                {props.children}
                </IconButton>
        </Grid>
    );
};

const NormalValueContainer = (props: PropsWithChildren<{}>): JSX.Element => (
    <Grid item className={useStyles().normalField}>
        {props.children}
    </Grid>
);

const ObjectValueContainer = (props: PropsWithChildren<{}>): JSX.Element => (
    <Grid item className={useStyles().objectField}>
        {props.children}
    </Grid>
);

const NewContainer = (props: BasePropsWithChildren): JSX.Element => {
    const classes = useStyles();
    const [open, setOpen] = useState(false);
    const className = open ? classes.objectField : classes.smallField;
    return (<Grid container={open} item className={className}>
        <IconButton onClick={(): void => setOpen(!open)} >
            {open? <ExpandLess /> : <Add />}
        </IconButton>
        {open && props.children}
    </Grid>);
};

const SmallValueContainer = (props: PropertyPropsWithChildren): JSX.Element => (
    <Grid item className={useStyles().smallField}>
        {props.children}
    </Grid>
);

const RootTreeView = (props: BasePropsWithChildren): JSX.Element => (
    <TreeView
        defaultCollapseIcon={<ExpandLess />}
        defaultExpandIcon={<ExpandMore />}
        >
        {props.children}
    </TreeView>
);


registry.register('Root', undefined, RootTreeView, ['None']);
registry.register('Object', undefined, ObjectTreeItem, ['Base']);
registry.register('Object', Browser.name, BrowserTreeItem, ['Base']);
registry.register('Object', Plugin.name, PluginTreeItem, ['Base']);
registry.register('Array', undefined, GridContainer, ['None']);
registry.register('Map', undefined, GridContainer, ['None']);

registry.register('Field', undefined, null);
registry.register('LabelContainer', undefined, null);
registry.register('LabelView', undefined, null);
registry.register('ValueContainer', 'object', ObjectValueContainer, ['None']);
registry.register('ValueContainer', ['checkbox', RelativeRectangle.name], SmallValueContainer, ['Property']);
registry.register('ValueContainer', undefined, NormalValueContainer, ['None']);
registry.register('ValueInput', ['number', 'string'], TextFieldHoc, ['Input', 'Label']);
registry.register('ValueInput', 'checkbox', SwitchHoc, ['Input', 'Label']);
registry.register('ValueInput', RelativeRectangle.name, RectangleHoc, ['Input', 'Label']);
registry.register('ValueInput', undefined, Input, ['Input']);

registry.register('NewContainer', undefined, NewContainer, ['Base']);
registry.register('NewItem', undefined, NewItem, [ 'Base', 'Action']);

registry.register('Object', 'Display', DisplayCard, ['Base']);
