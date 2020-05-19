import { observer } from 'mobx-react-lite';

import React from 'react';

import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import GridListTileBar from '@material-ui/core/GridListTileBar';

import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';

import { Browser } from '../../../Setup/Application/Browser';
import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { SetupBase } from '../../../Setup/SetupBase';
import { makeStyles } from '@material-ui/core/styles';
import { Plugin } from '../../../Setup/Application/Plugin';
import { List, ListItem } from '@material-ui/core';
import PluginsList from './PluginsList';

const useStyles = makeStyles((theme) => ({
    coordField: {
        width: 60,
    },
}));

const Plugins = observer(({ browser }: { browser: Browser }): JSX.Element => {
    const classes = useStyles();

    if (!SetupBase.activeSchema.definitions)
        return <GridList />;

    const addPlugin = (schema: JSONSchema7): void => {
        const plugin = Plugin.createNew(browser.id, schema);

        browser.plugins.set(
            plugin.id,
            plugin
        );
    };

    return (
        <List>
            <ListItem>
                <GridList>
                    {
                        Object.values(SetupBase.activeSchema.definitions)
                            .filter(schemaDef => (schemaDef as JSONSchema7)
                                .allOf?.some(pluginRefProspect =>
                                    (pluginRefProspect as JSONSchema7).$ref == Plugin.name))
                            .map(
                                (schemaDef: JSONSchema7Definition) => {
                                    const schema = schemaDef as JSONSchema7;

                                    return (
                                        <GridListTile key={schema.$id}>
                                            <div>{schema.description}</div>
                                            <GridListTileBar
                                                title={schema.title}
                                                actionIcon={
                                                    <IconButton onClick={(): void => addPlugin(schema)}>
                                                        <AddIcon/>
                                                    </IconButton>
                                                }
                                            />
                                        </GridListTile>
                                    );
                                }
                            )
                    }
                </GridList>
            </ListItem>
            <ListItem>
                <PluginsList plugins={browser.plugins} />   
            </ListItem>
        </List>
    );
});

export default Plugins;