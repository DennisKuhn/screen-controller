import React from 'react';
import { TextField, Input, Switch, FormControl, InputLabel, makeStyles, Theme, Grid } from '@material-ui/core';
import { callerAndfName } from '../../../../utils/debugging';
import registry, { InputProps, LabelProps, ObjectProps, ObjectPropsWithChildren, PropertyPropsWithChildren, BaseProps, BasePropsWithChildren } from '../Registry';
import GridContainer from '../../../components/Grid/GridContainer';
import { TreeItem, TreeView } from '@material-ui/lab';
import { ExpandLess, ExpandMore } from '@material-ui/icons';

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
        field: {
            minWidth: getInputWidth() + 2 * theme.spacing(1) + 30,
            marginBottom: theme.spacing(2),
            padding: '0 15px !important'
        },
        input: {
            minWidth: getInputWidth() + 2 * theme.spacing(1),
        },
        switchField: {
            // '& .MuiSwitch-root': {
            //     marginTop: theme.spacing(2)
            // }
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
        <FormControl className={classes.switchField}>
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

const ValueContainer = (props: PropertyPropsWithChildren): JSX.Element => (
    <Grid item className={useStyles().field}>
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
registry.register('Array', undefined, GridContainer, ['None']);
registry.register('Map', undefined, GridContainer, ['None']);

registry.register('Field', undefined, null);
registry.register('LabelContainer', undefined, null);
registry.register('LabelView', undefined, null);
registry.register('ValueContainer', undefined, ValueContainer, ['Property']);
registry.register('ValueInput', ['number', 'string'], TextFieldHoc, ['Input', 'Label']);
registry.register('ValueInput', 'checkbox', SwitchHoc, ['Input', 'Label']);
registry.register('ValueInput', undefined, Input, ['Input']);
