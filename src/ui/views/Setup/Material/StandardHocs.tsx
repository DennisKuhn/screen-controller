import { makeStyles, TextField, Theme, FormControl, InputLabel, Switch, Select, MenuItem } from '@material-ui/core';
import React from 'react';
import { getInputWidth } from '../InputWidth';
import { BaseProps, LabelProps, PropertyProps, InputProps } from '../Shared';
import { callerAndfName } from '../../../../utils/debugging';

const useStyles = makeStyles((theme: Theme) => ({
    smallField: {
        minWidth: (getInputWidth() + 2 * theme.spacing(1) + 30) / 2,
        marginBottom: theme.spacing(2),
        padding: '0 15px !important',
    },
    normalField: {
        width: getInputWidth() + 2 * theme.spacing(1) + 30,
        marginBottom: theme.spacing(2),
        padding: '0 15px !important',
    },
    newField: {
        display: 'grid'
    },
    objectField: {
        minWidth: getInputWidth() + 2 * theme.spacing(1) + 30,
        marginBottom: theme.spacing(2),
        padding: '0 15px !important',
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
    expandedTreeLabel: {
        display: 'block',
    },
    collapsedTreeLabel: {
        display: 'block',
    },
    expandedTreeTitle: {
        //display: 'inline',
        // flexGrow: 1
    },
    collapsedTreeTitle: {

    },
    treeInfo: {

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
})
);

export const TextFieldHoc = (props: LabelProps & InputProps): JSX.Element => {
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

export const SwitchHoc = (props: LabelProps & InputProps): JSX.Element => {
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


export const SelectHoc = (props: BaseProps & LabelProps & InputProps): JSX.Element => {
    const classes = useStyles();

    return (
        <TextField
            className={classes.input}
            label={props.label}
            value={props.value}
            type={props.type}
            onChange={props.onChange}
            InputProps={{ readOnly: props.readOnly }}
            select={true}                
            >
            {props.schema.enum?.map((entry, index) => {
                switch (typeof entry) {
                    case 'string':
                    case 'number':
                        return <MenuItem key={index} value={entry}>{entry}</MenuItem>;
                        break;
                    default:
                        throw new Error(`${callerAndfName()} typeof enum entry=${typeof entry} is not supported yet`);
                }
            }
            )}
        </TextField>
    );
};

export const SelectHocMANUALOLD = (props: BaseProps & PropertyProps & LabelProps & InputProps): JSX.Element => {
    const classes = useStyles();
    const labelId = `${props.item.id}.${props.property}.inputlabel`;

    return (
        <FormControl>
            <InputLabel id={labelId}>{props.label}</InputLabel>
            <Select
                className={classes.input}
                labelId={labelId}
                onChange={props.onChange}
                readOnly={props.readOnly}
                value={props.value}
            >
                {props.schema.enum?.map((entry, index) => {
                    switch (typeof entry) {
                        case 'string':
                        case 'number':
                            return <MenuItem key={index} value={entry}>{entry}</MenuItem>;
                            break;
                        default:
                            throw new Error(`${callerAndfName()} typeof enum entry=${typeof entry} is not supported yet`);
                    }
                }
                )}
            </Select>
        </FormControl>
    );
};

