import { TextField, makeStyles, createStyles, Theme, FormControl, InputLabel, IconButton, InputAdornment } from '@material-ui/core';
import { Image } from '@material-ui/icons';
import { remote } from 'electron';
import React from 'react';
import { callerAndfName } from '../../../../../utils/debugging';
import { fs2Url } from '../../../../../utils/Url';
import { PropertyProps, InputProps } from '../../Shared';
import { getInputWidth } from '../../InputWidth';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            margin: theme.spacing(1),
            display: 'flex'
        },
        label: {
            flexGrow: 1
        },
        icon: {
            flexGrow: 0
        },
        container: {
            minWidth: getInputWidth() + 2 * theme.spacing(1),
        },
        input: {
            direction: 'rtl',
        }
    })
);

const showDialog = (): Promise<Electron.OpenDialogReturnValue> => remote.dialog.showOpenDialog(
    {
        properties: ['openFile'],
        filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'svg', 'png', 'gif'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    }
);

const OpenLocal = (props: PropertyProps & InputProps): JSX.Element => {

    console.debug(`${callerAndfName()}`, props);

    const classes = useStyles();

    const handleDialog = async (): Promise<void> => {
        const response = await showDialog();

        if (!response.canceled) {
            console.log(`${callerAndfName()} ${response.filePaths[0]} => ${fs2Url(response.filePaths[0]).href}`);
            props.onChange(fs2Url(response.filePaths[0]).href);
        }
    };


    return (
            <TextField
                label={props.label}
                helperText={props.helperText}
                value={props.value}
                InputProps={{
                    className: classes.input,
                    readOnly: true,
                    endAdornment: (
                        <InputAdornment position="start">
                            <IconButton onClick={handleDialog} >
                                <Image color="primary"/>
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                className={classes.container}
            />
    );
};

export default OpenLocal;
