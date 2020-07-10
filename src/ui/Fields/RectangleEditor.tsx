import { makeStyles, TextField, TextFieldProps, Typography } from '@material-ui/core';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { RelativeRectangle } from '../../Setup/Default/RelativeRectangle';
import RectangleButton from './RectangleButton';


export const useStyles = makeStyles((/*theme*/) => ({
    coordField: {
        width: 55,
    },
    container: {
        display: 'inline-grid'
    },
    float: {
        gridColumn: 1,
        gridRow: 1,
        zIndex: 10000,
        pointerEvents: 'none',
        textShadow: '0 0 6px #ffffff',
    },
    button: {
        gridColumn: 1,
        gridRow: 1
    }
}));

export function PercentField(props: TextFieldProps): React.ReactElement {
    const classes = useStyles();
    return (
        <TextField
            {...{
                ...props,
                value: (Number(props.value) * 100),
                onChange: ((e): void => props.onChange && props.onChange({ ...e, target: { ...e.target, value: (Number(e.target.value) / 100).toPrecision() } }))
            }}
            type='number'
            size='small'
            className={classes.coordField}
            InputLabelProps={{
                shrink: true
            }}
        />
    );
}

interface BaseProps {
    className?: string;
}

interface RectangleEditorProps extends BaseProps {
    value: RelativeRectangle;
}

const RectangleEditor = observer(({ value, className }: RectangleEditorProps ): JSX.Element => {
    const classes = useStyles();

    return (
        <div className={className}>
            <span className={classes.container}>
                <Typography variant="overline" className={classes.float}>{(value.x * 100).toFixed(0)}, {(value.y * 100).toFixed(0)}</Typography>
                <RectangleButton className={classes.button} rect={value} moveNotSize={true} />
            </span>
            <span className={classes.container}>
                <Typography variant="overline" className={classes.float}>{(value.width * 100).toFixed(0)} * {(value.height * 100).toFixed(0)}</Typography>
                <RectangleButton className={classes.button} rect={value} moveNotSize={false} />
            </span>
        </div>
    );
});

export default RectangleEditor;