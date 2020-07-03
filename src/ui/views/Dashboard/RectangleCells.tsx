import { makeStyles, TextField, TextFieldProps, TableCell, Typography } from '@material-ui/core';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { RelativeRectangle } from '../../../Setup/Default/RelativeRectangle';
import MoveRectangleButton from './MoveRectangleButton';
import RectangleButton from './RectangleButton';


export const useStyles = makeStyles((/*theme*/) => ({
    coordField: {
        width: 55,
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


const RectangleCells = observer(({ rect }: { rect: RelativeRectangle }): JSX.Element => (
    <>
        <TableCell>
            <Typography>{(rect.x * 100).toFixed(0)}, {(rect.y * 100).toFixed(0)}</Typography>
        </TableCell>
        <TableCell>
            <RectangleButton rect={rect} moveNotSize={true} />
        </TableCell>
        <TableCell>
            <Typography>{(rect.width * 100).toFixed(0)} * {(rect.height * 100).toFixed(0)}</Typography>
        </TableCell>
        <TableCell>
            <RectangleButton rect={rect} moveNotSize={false} />
        </TableCell>
    </>
));

export default RectangleCells;