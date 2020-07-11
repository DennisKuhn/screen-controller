import React from 'react';
import { TextField, Input, Switch, FormControl, InputLabel, makeStyles, Theme, Grid, IconButton } from '@material-ui/core';
import { callerAndfName } from '../../../../utils/debugging';
import { InputProps, LabelProps, ObjectPropsWithChildren, PropertyPropsWithChildren } from '../Shared';
import registry from '../Registry';
import GridContainer from '../../../components/Grid/GridContainer';
import { TreeItem, TreeView } from '@material-ui/lab';
import DisplayCard from './Material/DisplayCard';

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

const ObjectTreeItem = (props: ObjectPropsWithChildren): JSX.Element => (
    <TreeItem nodeId={props.item.id} label={props.label}>
        <GridContainer>
            {props.children}
        </GridContainer>
    </TreeItem>
);

const NormalValueContainer = (props: PropertyPropsWithChildren): JSX.Element => (
    <Grid item className={useStyles().normalField}>
        {props.children}
    </Grid>
);

const SmallValueContainer = (props: PropertyPropsWithChildren): JSX.Element => (
    <Grid item className={useStyles().smallField}>
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
