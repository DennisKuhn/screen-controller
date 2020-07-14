import { Divider, FormControl, Grid, IconButton, Input, InputLabel, makeStyles, Paper, Typography } from '@material-ui/core';
import { DeleteOutlined, ExpandLess, ExpandMore } from '@material-ui/icons';
import React, { Fragment, PropsWithChildren, ReactNode, useState } from 'react';
import { Root } from '../../../../Setup/Application/Root';
import { Browser } from '../../../../Setup/Application/Browser';
import { Display } from '../../../../Setup/Application/Display';
import { Plugin } from '../../../../Setup/Application/Plugin';
import { RelativeRectangle } from '../../../../Setup/Default/RelativeRectangle';
import { callerAndfName } from '../../../../utils/debugging';
import GridContainer from '../../../components/Grid/GridContainer';
import RectangleEditor from '../../../Fields/RectangleEditor';
import registry from '../Registry';
import { ActionProps, InputProps, LabelProps, ObjectPropsWithChildren, BasePropsWithChildren } from '../PropTypes';
import DisplayCard from './MaterialSetup/DisplayCard';
import { NewContainer, NewItem, SingleNewItem } from './MaterialSetup/NewComponents';
import NotchedOutlineContainer from './MaterialNodgedOutline';
import { Screen } from '../../../../Setup/Application/Screen';
import ObjectCard from './MaterialSetup/ObjectCard';
import OpenLocal from './MaterialSetup/OpenLocal';
import { TextFieldHoc, SelectHoc, SwitchHoc } from '../Material/StandardHocs';
import { ExtendedTheme } from '../../../assets/Theme';

const useStyles = makeStyles((theme: ExtendedTheme) => {
    return ({
        ...theme.columnDefaults,
        newField: {
            display: 'grid'
        },
        objectField: {
            ...theme.columnDefaults.largeGrowableFieldContainer,
            position: 'relative'
        },
        deleteButton: {
            position: 'absolute',
            top: 0,
            right: theme.spacing(1)
        },
        expansionHeader: {
            display: 'flex',
        },
        treeLabel: {
            display: 'block',
        },
        rectangle: {
            marginTop: theme.spacing(2)
        },
    });
});

console.log(`${callerAndfName()} Register`);

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

const ExpansionItem = ({ children, title, getDetails }: { children?: ReactNode; title: string; getDetails?: () => string }): JSX.Element => {
    const [expanded, setExpanded] = useState(false);
    const classes = useStyles();

    return (
        <Fragment>
            <div>
                <div className={classes.expansionHeader}>
                    <IconButton onClick={(): void => setExpanded(!expanded)}>
                        {expanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                    <div className={classes.treeLabel}>
                        <Typography>{title}</Typography>
                        {getDetails ? <Typography variant="overline">{getDetails()}</Typography> : false}
                    </div>
                </div>
                {expanded &&
                    <Fragment>
                        <Divider variant="middle" />
                        <Grid container item>
                            {children}
                        </Grid>
                    </Fragment>
                }
            </div>
        </Fragment>
    );
};

/** Show label with cpu usage, GridContainer for the children */
const BrowserTreeItem = (props: ObjectPropsWithChildren): JSX.Element => {
    const browser = props.item;

    if (!((typeof browser == 'object') && (browser instanceof Browser)))
        throw new Error(`${callerAndfName()} typeof value=${typeof browser} must be object/Browser`);

    const getDetails = (): string => browser.cpuUsage ? (browser.cpuUsage * 100).toFixed(browser.cpuUsage < 10 ? 1 : 0) + '%CPU' : '';

    return (
        <ExpansionItem title={props.label} getDetails={getDetails}>
            {props.children}
        </ExpansionItem>
    );
};

const PluginTreeItem = (props: ObjectPropsWithChildren): JSX.Element => {
    const plugin = props.item;

    if (!((typeof plugin == 'object') && (plugin instanceof Plugin)))
        throw new Error(`${callerAndfName()} typeof value=${typeof plugin} must be object/Plugin`);

    const getDetails = (): string => {
        const cpuUsage = plugin.cpuUsage ? plugin.cpuUsage * 100 : undefined;
        const cpuUsageText = cpuUsage ? cpuUsage.toFixed(cpuUsage < 10 ? 1 : 0) + '%CPU' : '';
        const fps = plugin.fps;
        const fpsText = fps ? fps.toFixed(0) + ' fps' : '';
        return cpuUsageText + (cpuUsageText.length && fpsText.length ? ' ' : '') + fpsText;
    };

    return (
        <ExpansionItem title={props.label} getDetails={getDetails} >
            {props.children}
        </ExpansionItem>
    );
};

const ObjectTreeItem = (props: ObjectPropsWithChildren): JSX.Element => (
    <ExpansionItem title={props.label}>
        {props.children}
    </ExpansionItem>
);

const DefaultValueContainer = (props: PropsWithChildren<{}>): JSX.Element => (
    <Grid item className={useStyles().defaultFieldContainer}>
        {props.children}
    </Grid>
);

const LargeValueContainer = (props: PropsWithChildren<{}>): JSX.Element => (
    <Grid item className={useStyles().largeFieldContainer}>
        {props.children}
    </Grid>
);

const ObjectValueContainer = (props: PropsWithChildren<{}>): JSX.Element => (
    <Grid item className={useStyles().objectField}>
        {props.children}
    </Grid>
);

const GridPaperContainer = (props: PropsWithChildren<{}>): JSX.Element => (
    <Grid item className={useStyles().objectField}>
        <Paper>
            {props.children}
        </Paper>
    </Grid>
);

const LabeledContainer = (props: BasePropsWithChildren): JSX.Element => (
    <GridContainer>
        <NotchedOutlineContainer label={props.label}>
            {props.children}
        </NotchedOutlineContainer>
    </GridContainer>
);


const DeleteButton = (props: ActionProps): JSX.Element => <IconButton className={useStyles().deleteButton} {...props}><DeleteOutlined fontSize="small" /></IconButton>;

const BlackHole = (): JSX.Element => <Fragment />;

registry.register('Root', undefined, null);
registry.register('Object', undefined, ObjectTreeItem, ['Base']);
registry.register('Object', Browser.name, BrowserTreeItem, ['Base']);
registry.register('Object', Plugin.name, PluginTreeItem, ['Base']);
registry.register('Object', [Root.name, Screen.name], ObjectCard, ['Base']);
registry.register('Object', Display.name, DisplayCard, ['Base']);
registry.register('Array', undefined, GridContainer, ['None']);
registry.register('Map', Screen.name + '.displays', GridContainer, ['None']);
registry.register('Map', undefined, LabeledContainer, ['Base']);

registry.register('Field', undefined, null);
registry.register('Field', 'color', GridContainer, ['None']);
registry.register('Field', [Browser.name, Plugin.name], GridPaperContainer, ['None']);
registry.register('LabelContainer', undefined, null);
registry.register('LabelView', undefined, null);
registry.register('ValueContainer', 'object', ObjectValueContainer, ['None']);
registry.register('ValueContainer', ['file', 'folder'], LargeValueContainer, ['None']);
registry.register('ValueContainer', [Browser.name, Plugin.name], null);
registry.register('ValueContainer', [Screen.name, Display.name], BlackHole, ['None']);
registry.register('ValueContainer', ['checkbox', RelativeRectangle.name], DefaultValueContainer, ['Property']);
registry.register('ValueContainer', undefined, DefaultValueContainer, ['None']);
registry.register('ValueInput', ['number', 'string'], TextFieldHoc, ['Input', 'Label']);
registry.register('ValueInput', 'checkbox', SwitchHoc, ['Input', 'Label']);
registry.register('ValueInput', 'enum', SelectHoc, ['Base', 'Input', 'Label']);
registry.register('ValueInput', RelativeRectangle.name, RectangleHoc, ['Input', 'Label']);
registry.register('ValueInput', ['file', 'folder'], OpenLocal, ['Property', 'Input']);
registry.register('ValueInput', undefined, Input, ['Input']);

registry.register('NewContainer', Display.name, BlackHole, ['None']);
registry.register('DeleteItem', Display.name, BlackHole, ['None']);
registry.register('NewContainer', [Browser.name, 'string'], null);
registry.register('NewContainer', undefined, NewContainer, ['Base']);
registry.register('NewItem', [Browser.name, 'string'], SingleNewItem, ['Base', 'Action', 'Icon']);
registry.register('NewItem', undefined, NewItem, ['Base', 'Action', 'Icon']);
registry.register('DeleteItem', undefined, DeleteButton, ['Action']);
