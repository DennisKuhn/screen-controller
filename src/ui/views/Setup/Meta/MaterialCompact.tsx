import React from 'react';
import { TextField, Input, Switch, FormControl, InputLabel, makeStyles, Grid, IconButton } from '@material-ui/core';
import { callerAndfName } from '../../../../utils/debugging';
import { InputProps, LabelProps, ObjectPropsWithChildren, PropertyPropsWithChildren } from '../PropTypes';
import registry from '../Registry';
import GridContainer from '../../../components/Grid/GridContainer';
import { TreeItem, TreeView } from '@material-ui/lab';
import DisplayCard from './MaterialSetup/DisplayCard';
import { ExtendedTheme } from '../../../assets/Theme';


const useStyles = makeStyles((theme: ExtendedTheme) => {
    return ({
        ...theme.columnDefaults,
        switch: {
            marginTop: theme.spacing(2)
        },
    });
});

console.log(`${callerAndfName()} Register`);

const TextFieldHoc = (props: LabelProps & InputProps): JSX.Element => {
    const classes = useStyles();

    return <TextField
        className={classes.defaultField}
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

const ObjectTreeItem = (props: ObjectPropsWithChildren): JSX.Element => (
    <TreeItem nodeId={props.item.id} label={props.label}>
        <GridContainer>
            {props.children}
        </GridContainer>
    </TreeItem>
);

const NormalValueContainer = (props: PropertyPropsWithChildren): JSX.Element => (
    <Grid item className={useStyles().largeFieldContainer}>
        {props.children}
    </Grid>
);

const SmallValueContainer = (props: PropertyPropsWithChildren): JSX.Element => (
    <Grid item className={useStyles().defaultFieldContainer}>
        {props.children}
    </Grid>
);



registry.register('Root', undefined, TreeView, ['None']);
registry.register('Object', undefined, ObjectTreeItem, ['Base']);
registry.register('Array', undefined, GridContainer, ['None']);
registry.register('Map', undefined, GridContainer, ['None']);

registry.register('Field', undefined, null);
registry.register('LabelContainer', undefined, null);
registry.register('LabelView', undefined, null);
registry.register('ValueContainer', 'checkbox', SmallValueContainer, ['Property']);
registry.register('ValueContainer', undefined, NormalValueContainer, ['Property']);
registry.register('ValueInput', ['number', 'string'], TextFieldHoc, ['Input', 'Label']);
registry.register('ValueInput', 'checkbox', SwitchHoc, ['Input', 'Label']);
registry.register('ValueInput', undefined, Input, ['Input']);

registry.register('NewContainer', undefined, null);
registry.register('NewItem', undefined, IconButton, ['Action']);

registry.register('Object', 'Display', DisplayCard, ['Base']);
