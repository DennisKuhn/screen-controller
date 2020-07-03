import { makeStyles, TextField, TextFieldProps, TableCell } from '@material-ui/core';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { RelativeRectangle } from '../../../Setup/Default/RelativeRectangle';


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
            <PercentField
                value={rect.x}
                onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                    rect.x = Number(event.target.value);
                }}
            />
        </TableCell>
        <TableCell>
            <PercentField
                value={rect.y}
                onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                    rect.y = Number(event.target.value);
                }}
            />
        </TableCell>
        <TableCell>
            <PercentField
                value={rect.width}
                onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                    rect.width = Number(event.target.value);
                }}
            />
        </TableCell>
        <TableCell>
            <PercentField
                value={rect.height}
                onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                    rect.height = Number(event.target.value);
                }}
            />
        </TableCell>
    </>
));

export default RectangleCells;