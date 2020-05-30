
import React, { useState, useRef, useEffect, MutableRefObject } from 'react';

import { observer } from 'mobx-react-lite';

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

import Form from '@rjsf/material-ui';

import { Plugin } from '../../../Setup/Application/Plugin';
import controller from '../../../Setup/Controller';
import { Rectangle } from '../../../Setup/Default/Rectangle';
import { PercentField } from './PercentField';
import { Browser } from '../../../Setup/Application/Browser';
import { ObservableSetupBaseMap } from '../../../Setup/Container';
import { JSONSchema7 } from 'json-schema';
import { UiSchema } from '@rjsf/core';
import { SetupBase } from '../../../Setup/SetupBase';

const useStyles = makeStyles((/*theme*/) => ({
    coordField: {
        width: 60,
    },
    hiddenField: {
        display: 'none'
    }
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

const update = (target: SetupBase, updated: SetupBase): void => {
    console.log(`Update ${target.id}`);
    for (const [property, value] of Object.entries( updated )) {
        if (target[property] instanceof SetupBase) {
            update(target[property], value);
        } else if (value instanceof Object) {
            console.log(`Update  ${target.id} ignore ${property}`);
        } else if (value != target[property]) {
            console.log(`Update  ${target.id} ${property} == ${target[property]} = ${value}`);

            target[property] = value;
        }
    }
};

const fixRefs = (item: JSONSchema7): JSONSchema7 => {

    if (item.$ref) {
        if (item.$ref.startsWith('#/definitions/')) {
            console.log(`${module.id}.fixRefs: skip ${item.$id} = ${item.$ref}`);
        } else {
            console.log(`${module.id}.fixRefs: ${item.$id} ${item.$ref} => ${'#/definitions/' + item.$ref}`);
            item.$ref = '#/definitions/' + item.$ref;
        }
    }
    for (const child of Object.values(item)) {
        if (child instanceof Object) {
            fixRefs(child);
        }
    }

    return item;
};

const HiddenFieldTemplate = ({ className }: { className: string }): JSX.Element => {
    // const { id, classNames, label, help, required, description, errors, children } = props;
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        if (ref.current && ref.current.parentElement) {
            ref.current.parentElement.classList.add(className);
        }
    }, [ref]);
    return (
        <span ref={ref} />
    );
};

const fixUiSchema = (item: UiSchema, classes: string): UiSchema => {

    if (item['ui:widget'] == 'hidden') {
        delete item['ui:widget'];
        item['ui:FieldTemplate'] = (props): React.ReactElement => <HiddenFieldTemplate {...props} className={classes} />;
        item['classNames'] = classes;
    }

    for (const value of Object.values(item)) {
        if (value instanceof Object) {
            fixUiSchema(value, classes);
        }
    }

    console.log(`fixUiSchema: ${classes}`, { ...item });

    return item;
};

const PluginItem = observer(({ plugin }: { plugin: Plugin }): JSX.Element => {
    const [configVisible, setConfigVisible] = useState(false);
    const classes = useStyles();

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
            <List>
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
                {configVisible &&
                    <ListItem>
                    <Form
                        onChange={(e): void => update(plugin, e.formData)}
                        schema={fixRefs(plugin.schema)}
                        formData={plugin}
                        uiSchema={fixUiSchema(Plugin.uiSchema, classes.hiddenField)}
                    />
                    </ListItem>
                }
            </List>
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