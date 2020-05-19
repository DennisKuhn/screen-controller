import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

// @material-ui/core components
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import { List, ListItem, ListItemIcon, ListItemSecondaryAction } from '@material-ui/core';

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
import { makeStyles } from '@material-ui/core/styles';
import { PercentField } from './PercentField';

const useStyles = makeStyles((theme) => ({
    coordField: {
        width: 60,
    },
}));

const BrowserForm = observer(({ browser }: { browser: Browser }): JSX.Element => {
    let isFullscreen = (browser.relative.x == 0 && browser.relative.y == 0 && browser.relative.width == 1 && browser.relative.height == 1);

    function toggleFullScreen(): void {
        isFullscreen = !isFullscreen;

        browser.relative = Rectangle.createNew(
            browser.id,
            isFullscreen ?
                { x: 0, y: 0, width: 1, height: 1 } :
                { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
        );
    }

    return (
        <>
            <Tooltip
                id={'tooltip-' + browser.id + '-config'}
                title={isFullscreen ? 'Make part screen' : 'Make Full Screen'}
                placement="top"
                >
                <IconButton aria-label="Fullscreen" onClick={toggleFullScreen} >
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
            </Tooltip>
            <form>
                <PercentField
                    value={browser.relative.x * 100}
                    label='x'
                    onChange={(event: React.ChangeEvent<HTMLInputElement>): number => browser.relative.x = Number(event.target.value) / 100}
                />
                <span>,</span>
                <PercentField
                    value={browser.relative.y * 100}
                    label='y'
                    onChange={(event: React.ChangeEvent<HTMLInputElement>): number => browser.relative.y = Number(event.target.value) / 100}
                />
                <span>-</span>
                <PercentField
                    value={browser.relative.width * 100}
                    label='width'
                    onChange={(event: React.ChangeEvent<HTMLInputElement>): number => browser.relative.width = Number(event.target.value) / 100}
                />
                <span>*</span>
                <PercentField
                    value={browser.relative.height * 100}
                    label='height'
                    onChange={(event: React.ChangeEvent<HTMLInputElement>): number => browser.relative.height = Number(event.target.value) / 100}
                />
            </form>
        </>
    );
});

const BrowserItem = observer(({ browser }: { browser: Browser }): JSX.Element => {

    const [configVisible, setConfigVisible] = useState(false);

    function toggleConfigVisible(): void {
        setConfigVisible(!configVisible);
    }

    function deleteBrowser(): void {
        controller.getSetup(browser.parentId, 0).then(
            display => (display as Display).browsers.delete(browser.id)
        );
    }


    return (
        <ListItem key={browser.id}>
            <List>
                <ListItem>
                    <ListItemIcon>
                        <Tooltip
                            id={'tooltip-' + browser.id + '-config'}
                            title="Show Plugins"
                            placement="top"
                        >
                            <IconButton
                                aria-label="Menu"
                                onClick={toggleConfigVisible}
                            >
                                {configVisible ? <MenuOpen /> : <Menu />}
                            </IconButton>
                        </Tooltip>
                    </ListItemIcon>
                    <BrowserForm browser={browser} />
                    <ListItemSecondaryAction>
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
                    </ListItemSecondaryAction>
                </ListItem>
                <ListItem style={{ visibility: configVisible? 'visible' : 'hidden'}}>
                    <Plugins browser={browser} />
                </ListItem>
            </List>
        </ListItem>
    );
});


const Browsers = observer(({ browsers }: { browsers: ObservableSetupBaseMap<Browser> }): JSX.Element => {

    return (
        <List>
            {browsers.map(browser =>
                <BrowserItem key={(browser as Browser).id} browser={(browser as Browser)} />)}
        </List>
    );
});

export default Browsers;