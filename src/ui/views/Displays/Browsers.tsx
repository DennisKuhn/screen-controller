import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
// @material-ui/core components
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
// @material-ui/icons
import Delete from '@material-ui/icons/Delete';
import Fullscreen from '@material-ui/icons/Fullscreen';
import FullscreenExit from '@material-ui/icons/FullscreenExit';
import Menu from '@material-ui/icons/Menu';
import MenuOpen from '@material-ui/icons/MenuOpen';

import controller from '../../../infrastructure/Configuration/Controller';
import { BrowserIterableDictionary, Browser } from '../../../infrastructure/Configuration/WallpaperSetup';

const Row = observer(({browser}: { browser: Browser }): JSX.Element => {

    const [configVisible, setConfigVisible] = useState(false);

    function deleteBrowser(): void {
        controller.getSetup(false).then(
            setup => {
                for (const display of setup.displays) {
                    if (browser.id in display.browsers) {
                        console.log(`${display.id}.Row[${browser.id}].deleteBrowser`);
                        delete display.browsers[browser.id];
                        return;
                    }
                }
            }                
        );
    }

    function toggleFullScreen(): void {
        const newFullScreen = !(browser.rx == 0 && browser.ry == 0 && browser.rWidth == 1 && browser.rHeight == 1);

        Object.assign(
            browser,
            newFullScreen ?
                { rx: 0, ry: 0, rWidth: 1, rHeight: 1 } :
                { rx: 0.25, ry: 0.25, rWidth: 0.5, rHeight: 0.5 });
    }

    function toggleConfigVisible(): void {
        setConfigVisible(!configVisible);
    }

    return (
        <TableRow key={browser.id}>
            <TableCell style={{ padding: '8px 0px 8px 0px' }}>
                <Tooltip
                    id={'tooltip-' + browser.id + '-config'}
                    title="Show configuration"
                    placement="top"
                >
                    <IconButton
                        aria-label="Menu"
                        onClick={toggleConfigVisible}
                    >
                        {configVisible ? <MenuOpen /> : <Menu />}
                    </IconButton>
                </Tooltip>
            </TableCell>
            <TableCell style={{ padding: '8px 0px 8px 0px' }}>
                <Tooltip
                    id={'tooltip-' + browser.id + '-config'}
                    title={(browser.rx == 0 && browser.ry == 0 && browser.rWidth == 1 && browser.rHeight == 1) ? 'Make part screen' : 'Make Full Screen'}
                    placement="top"
                >
                    <IconButton
                        aria-label="Fullscreen"
                        onClick={toggleFullScreen}
                    >
                        {(browser.rx == 0 && browser.ry == 0 && browser.rWidth == 1 && browser.rHeight == 1) ? <FullscreenExit /> : <Fullscreen />}
                    </IconButton>
                </Tooltip>
            </TableCell>
            <TableCell style={{ padding: '8px 0px 8px 4px', textAlign: 'right' }}>{browser.rx * 100}%</TableCell>
            <TableCell style={{ padding: '8px 2px 8px 0px', textAlign: 'center' }}>,</TableCell>
            <TableCell style={{ padding: '8px 4px 8px 0px', textAlign: 'left' }}>{browser.ry * 100}%</TableCell>
            <TableCell style={{ padding: '8px 0px 8px 4px', textAlign: 'right' }}>{browser.rWidth * 100}%</TableCell>
            <TableCell style={{ padding: '8px 2px 8px 2px', textAlign: 'center' }}>x</TableCell>
            <TableCell style={{ padding: '8px 4px 8px 0px', textAlign: 'left' }}>{browser.rHeight * 100}%</TableCell>
            <TableCell style={{ padding: '8px 0px 8px 0px' }}>
                <Tooltip
                    id={'tooltip-' + browser.id + '-delete'}
                    title="Remove"
                    placement="top"
                >
                    <IconButton
                        aria-label="Delete"
                        onClick={deleteBrowser}
                    >
                        <Delete />
                    </IconButton>
                </Tooltip>
            </TableCell>
        </TableRow>
    );
});


const Browsers = observer(({browsers}: { browsers: BrowserIterableDictionary }): JSX.Element => {

    return (
        <Table>
            <TableBody>
                {browsers.values.map(browser =>
                    <Row key={browser.id} browser={browser} />)}
            </TableBody>
        </Table>
    );
});

export default Browsers;