import React, { useState, useEffect } from 'react';
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

import { BrowserIterableDictionary, Browser, SetupDiff } from '../../../infrastructure/Configuration/WallpaperSetup';
import controller from '../../../infrastructure/Configuration/Controller';

export default function Browsers(browsersProps: { browsers: BrowserIterableDictionary; updateTemplate: SetupDiff }): JSX.Element {
    const [browsers, setBrowsers] = useState(browsersProps.browsers);

    function Row(props: { browser: Browser }): JSX.Element {
        const [browser, setBrowser] = useState(props.browser);
        const [fullScreen, setFullScreen] = useState((props.browser.rx == 0 && props.browser.ry == 0 && props.browser.rWidth == 1 && props.browser.rHeight == 1));
        const [configVisible, setConfigVisible] = useState(false);

        function toggleFullScreen(): void {
            const newFullScreen = !fullScreen;
            const newBrowser: Browser = newFullScreen ? { ...browser, rx: 0, ry: 0, rWidth: 1, rHeight: 1 } : { ...browser, rx: 0.25, ry: 0.25, rWidth: 0.5, rHeight: 0.5 };
            const update = new SetupDiff(browsersProps.updateTemplate);

            if (!update.displays.values[0]) throw new Error(`Can not update browser ${browser.id} because no display in updateTemplate`);

            update.displays.values[0].browsers[newBrowser.id] = {
                rx: newBrowser.rx,
                ry: newBrowser.ry,
                rHeight: newBrowser.rHeight,
                rWidth: newBrowser.rWidth
            };

            controller.updateSetup(update);

            // setFullScreen(newFullScreen);
        }

        function toggleConfigVisible(): void {
            setConfigVisible(!configVisible);
        }

        function onUpdate(update: SetupDiff): void {
            if (!browsersProps.updateTemplate.displays.values[0]) throw new Error(`Can not process onUpdate. Browser ${browser.id} because no display in updateTemplate`);
            const display = update.displays[browsersProps.updateTemplate.displays.values[0].id];
            if (display && display.browsers[props.browser.id]) {
                const newBrowser = { ...browser, ...display.browsers[props.browser.id] };
                setBrowser(newBrowser);
                setFullScreen(newBrowser.rx == 0 && newBrowser.ry == 0 && newBrowser.rWidth == 1 && newBrowser.rHeight == 1);
            }
        }

        controller.on('change', onUpdate);

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
                        title={fullScreen ? 'Make part screen' : 'Make Full Screen'}
                        placement="top"
                    >
                        <IconButton
                            aria-label="Fullscreen"
                            onClick={toggleFullScreen}
                        >
                            {fullScreen ? <FullscreenExit /> : <Fullscreen />}
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
                        >
                            <Delete />
                        </IconButton>
                    </Tooltip>
                </TableCell>
            </TableRow>
        );
    }

    function onUpdate(update: SetupDiff): void {
        if (!browsersProps.updateTemplate.displays.values[0]) throw new Error('Browsers: can not process onUpdate because no display in updateTemplate');

        const displayUpdate = update.displays[browsersProps.updateTemplate.displays.values[0].id];

        if (displayUpdate) {
            const newBrowsers = new BrowserIterableDictionary(browsers);

            for (const updateBrowserId in displayUpdate.browsers) {
                const browserUpdate = displayUpdate.browsers[updateBrowserId];
                const mergedBrowser = { ...newBrowsers[updateBrowserId], ...browserUpdate };

                if ( browserUpdate == null) {
                    delete newBrowsers[updateBrowserId];
                } else {
                    newBrowsers[updateBrowserId] = mergedBrowser;
                }
            }
            setBrowsers(newBrowsers);
        }
    }

    controller.on('change', onUpdate);

    return (
        <Table>
            <TableBody>
                {browsers.values.map(browser =>
                    <Row key={browser.id} browser={browser} />)}
            </TableBody>
        </Table>
    );
}
