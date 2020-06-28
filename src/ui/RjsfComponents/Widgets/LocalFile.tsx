import { Button, TextField, makeStyles, createStyles, Theme } from '@material-ui/core';
import { WidgetProps } from '@rjsf/core';
import { remote } from 'electron';
import React from 'react';
import { callerAndfName } from '../../../utils/debugging';
import { fs2Url } from '../../../utils/Url';

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

const OpenFile = (props: WidgetProps): JSX.Element => {

    console.debug(`${callerAndfName()}`, props)

    const classes = useStyles();
    const handleDialog = async (): Promise<void> => {
        const response = await showDialog();

        if (!response.canceled) {
            console.log(`${callerAndfName()} ${response.filePaths[0]} => ${fs2Url(response.filePaths[0]).href}`);
            props.onChange(fs2Url(response.filePaths[0]).href);
        }
    };


    return (<div className={classes.root} >
        <Button variant="contained" color="primary" onClick={handleDialog} className={classes.icon}>
            Select
        </Button>
        <TextField
            value={props.value}
            InputProps={{
                readOnly: true,
            }}
            variant="filled"
            className={classes.label}
        />
    </div>);
};

export default OpenFile;
