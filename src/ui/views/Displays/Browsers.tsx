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

import controller from '../../../Setup/Controller';
import { Browser } from '../../../Setup/Application/Browser';
import { Display } from '../../../Setup/Application/Display';
import { Rectangle } from '../../../Setup/Default/Rectangle';
import Plugins from './Plugins';
import { ObservableSetupBaseMap } from '../../../Setup/Container';

const Row = observer(({ browser }: { browser: Browser }): JSX.Element => {

    const [configVisible, setConfigVisible] = useState(false);

    function deleteBrowser(): void {
        controller.getSetup(browser.parentId, 0).then(
            display => (display as Display).browsers.delete(browser.id)
        );
    }

    function toggleFullScreen(): void {
        const newFullScreen = !(browser.relative.x == 0 && browser.relative.y == 0 && browser.relative.width == 1 && browser.relative.height == 1);

        browser.relative = Rectangle.createNew(
            browser.id,
            newFullScreen ?
                { x: 0, y: 0, width: 1, height: 1 } :
                { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
        );
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
                    title={(browser.relative.x == 0 && browser.relative.y == 0 && browser.relative.width == 1 && browser.relative.height == 1) ?
                        'Make part screen' : 'Make Full Screen'}
                    placement="top"
                >
                    <IconButton
                        aria-label="Fullscreen"
                        onClick={toggleFullScreen}
                    >
                        {(browser.relative.x == 0 && browser.relative.y == 0 && browser.relative.width == 1 && browser.relative.height == 1) ? <FullscreenExit /> : <Fullscreen />}
                    </IconButton>
                </Tooltip>
            </TableCell>
            <TableCell style={{ padding: '8px 0px 8px 4px', textAlign: 'right' }}>{browser.relative.x * 100}%</TableCell>
            <TableCell style={{ padding: '8px 2px 8px 0px', textAlign: 'center' }}>,</TableCell>
            <TableCell style={{ padding: '8px 4px 8px 0px', textAlign: 'left' }}>{browser.relative.y * 100}%</TableCell>
            <TableCell style={{ padding: '8px 0px 8px 4px', textAlign: 'right' }}>{browser.relative.width * 100}%</TableCell>
            <TableCell style={{ padding: '8px 2px 8px 2px', textAlign: 'center' }}>x</TableCell>
            <TableCell style={{ padding: '8px 4px 8px 0px', textAlign: 'left' }}>{browser.relative.height * 100}%</TableCell>
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
            <TableCell>
                <Plugins browser={browser} />
            </TableCell>
        </TableRow>
    );
});


const Browsers = observer(({ browsers }: { browsers: ObservableSetupBaseMap<Browser> }): JSX.Element => {

    return (
        <Table>
            <TableBody>
                {browsers.map(browser => browser).filter(browser => browser != undefined).map(browser =>
                    <Row key={(browser as Browser).id} browser={(browser as Browser)} />)}
            </TableBody>
        </Table>
    );
});

export default Browsers;