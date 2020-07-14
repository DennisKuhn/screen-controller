import { TextField, makeStyles, createStyles, IconButton, InputAdornment } from '@material-ui/core';
import { Image } from '@material-ui/icons';
import { remote } from 'electron';
import React from 'react';
import { callerAndfName } from '../../../../../utils/debugging';
import { fs2Url } from '../../../../../utils/Url';
import { PropertyProps, InputProps, FieldType } from '../../PropTypes';
import { ExtendedTheme } from '../../../../assets/Theme';

const useStyles = makeStyles((theme: ExtendedTheme) =>
    createStyles({
        ...theme.columnDefaults,
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
        input: {
            direction: 'rtl',
        }
    })
);

const showDialog = (type: FieldType): Promise<Electron.OpenDialogReturnValue> => remote.dialog.showOpenDialog(
    {
        properties: [ type == 'file' ? 'openFile' : 'openDirectory'],
        filters: type == 'file' ?
            [
                { name: 'Images', extensions: ['jpg', 'jpeg', 'svg', 'png', 'gif'] },
                { name: 'All Files', extensions: ['*'] }
            ] :
            [
                { name: 'All Files', extensions: ['*'] }
            ]
    }
);

const OpenLocal = (props: PropertyProps & InputProps): JSX.Element => {

    console.debug(`${callerAndfName()}(${props.type})`, props);

    const classes = useStyles();

    const handleDialog = async (): Promise<void> => {
        const response = await showDialog(props.type);

        if (!response.canceled) {
            console.log(`${callerAndfName()}(${props.type}) ${response.filePaths[0]} => ${fs2Url(response.filePaths[0]).href}`);
            props.onChange(fs2Url(response.filePaths[0]).href);
        }
    };


    return (
            <TextField
                className={classes.largeField}
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
            />
    );
};

export default OpenLocal;
