
import React, { useState } from 'react';

import { observer } from 'mobx-react-lite';
import { ObservableSetupBaseMap } from '../../../Setup/Container';

import {
    makeStyles,
    List,
    ListItem,
    ListItemIcon,
    Tooltip,
    ListItemSecondaryAction,
    IconButton
} from '@material-ui/core';

// @material-ui/icons
import Delete from '@material-ui/icons/Delete';
import Fullscreen from '@material-ui/icons/Fullscreen';
import FullscreenExit from '@material-ui/icons/FullscreenExit';
import Menu from '@material-ui/icons/Menu';
import MenuOpen from '@material-ui/icons/MenuOpen';

import { Plugin } from '../../../Setup/Application/Plugin';
import controller from '../../../Setup/Controller';
import { Rectangle } from '../../../Setup/Default/Rectangle';
import { PercentField } from './PercentField';
import { Browser } from '../../../Setup/Application/Browser';

const useStyles = makeStyles((theme) => ({
    coordField: {
        width: 60,
    },
}));

const PluginForm = observer(({ plugin }: { plugin: Plugin }): JSX.Element => {
    let isFullscreen = (plugin.relativeBounds.x == 0 && plugin.relativeBounds.y == 0 && plugin.relativeBounds.width == 1 && plugin.relativeBounds.height == 1);

    function toggleFullScreen(): void {
        isFullscreen = !isFullscreen;

        plugin.relativeBounds = Rectangle.createNew(
            plugin.id,
            isFullscreen ?
                { x: 0, y: 0, width: 1, height: 1 } :
                { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
        );
    }

    return (
        <>
            <Tooltip
                id={'tooltip-' + plugin.id + '-config'}
                title={isFullscreen ? 'Make part screen' : 'Make Full Screen'}
                placement="top"
                >
                <IconButton aria-label="Fullscreen" onClick={toggleFullScreen} >
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
            </Tooltip>
            <form>
                <PercentField
                    value={plugin.relativeBounds.x * 100}
                    label='x'
                    onChange={(event: React.ChangeEvent<HTMLInputElement>): number => plugin.relativeBounds.x = Number(event.target.value) / 100}
                />
                <span>,</span>
                <PercentField
                    value={plugin.relativeBounds.y * 100}
                    label='y'
                    onChange={(event: React.ChangeEvent<HTMLInputElement>): number => plugin.relativeBounds.y = Number(event.target.value) / 100}
                />
                <span>-</span>
                <PercentField
                    value={plugin.relativeBounds.width * 100}
                    label='width'
                    onChange={(event: React.ChangeEvent<HTMLInputElement>): number => plugin.relativeBounds.width = Number(event.target.value) / 100}
                />
                <span>*</span>
                <PercentField
                    value={plugin.relativeBounds.height * 100}
                    label='height'
                    onChange={(event: React.ChangeEvent<HTMLInputElement>): number => plugin.relativeBounds.height = Number(event.target.value) / 100}
                />
            </form>
        </>
    );
});


const PluginItem = observer(({ plugin }: { plugin: Plugin }): JSX.Element => {
    const [configVisible, setConfigVisible] = useState(false);

    function toggleConfigVisible(): void {
        setConfigVisible(!configVisible);
    }

    function deletePlugin(): void {
        controller.getSetup(plugin.parentId, 0).then(
            browser => (browser as Browser).plugins.delete(plugin.id)
        );
    }


    return (
        <ListItem>
            <ListItemIcon>
                <Tooltip
                    id={'tooltip-' + plugin.id + '-config'}
                    title="Show config"
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
            <PluginForm plugin={plugin} />
            <ListItemSecondaryAction>
                <Tooltip
                    id={'tooltip-' + plugin.id + '-delete'}
                    title="Remove"
                    placement="top"
                >
                    <IconButton
                        aria-label="Delete"
                        onClick={deletePlugin}
                    >
                        <Delete />
                    </IconButton>
                </Tooltip>
            </ListItemSecondaryAction>
        </ListItem>
    );
});

const PluginsList = observer(({ plugins }: { plugins: ObservableSetupBaseMap<Plugin> }): JSX.Element => {

    return (
        <List>
            {plugins.map(plugin => {
                if (plugin == null) throw new Error('PluginsList: a plugin is null');

                return (<PluginItem key={plugin.id} plugin={plugin} />);
            })}
        </List>
    );
});

export default PluginsList;