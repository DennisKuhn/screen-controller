import {
    Box,
    Collapse,
    IconButton,
    makeStyles,
    TableCell,
    TableRow,
    TextField,
    withStyles
} from '@material-ui/core';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import { observer } from 'mobx-react-lite';
import React, { ChangeEvent, Fragment, useState } from 'react';
import { Browser } from '../../../Setup/Application/Browser';
import dashboardStyle from '../../assets/jss/material-dashboard-react/views/dashboardStyle';
import BrowserPlugins from './BrowserPlugins';
import RectangleCells from './RectangleCells';
import BrowserPerformanceCells from './BrowserPerformanceCells';

interface Props {
    browser: Browser;
}

const useStyles = makeStyles((/*theme*/) =>
    dashboardStyle
);

const BrowserLine = observer(({ browser }: Props): JSX.Element => {
    const classes = useStyles();

    const [open, setOpen] = useState(false);
    const hasPlugins = browser.plugins.size > 0;

    return (
        <Fragment>
            <TableRow key={browser.id + '.row'}>
                {hasPlugins ?
                    <TableCell>
                        <IconButton aria-label="expand row" size="small" onClick={(): void => setOpen(!open)}>
                            {open ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </TableCell> :
                    <TableCell />
                }
                <BrowserPerformanceCells browser={browser} />
                <TableCell>
                    <TextField
                        className={classes.browserName}
                        value={browser.name}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): string => browser.name = e.target.value}
                    />
                </TableCell>
                <RectangleCells rect={browser.relative} />
            </TableRow>
            {hasPlugins &&
                <TableRow key={browser.id + '.pluginsRow'}>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box margin={1}>
                                <BrowserPlugins browser={browser} />
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            }
        </Fragment>
    );
});


export default withStyles(dashboardStyle)(BrowserLine);