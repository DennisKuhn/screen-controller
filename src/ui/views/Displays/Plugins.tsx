import { observer } from 'mobx-react-lite';

import React, { useState, useEffect } from 'react';

import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import GridListTileBar from '@material-ui/core/GridListTileBar';

import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';

import { Browser } from '../../../Setup/Application/Browser';
import { JSONSchema7 } from 'json-schema';
import { makeStyles } from '@material-ui/core/styles';
import { Plugin } from '../../../Setup/Application/Plugin';
import { List, ListItem } from '@material-ui/core';
import PluginsList from './PluginsList';
import { Manager } from '../../../plugins/Manager';

const useStyles = makeStyles((theme) => ({
    coordField: {
        width: 60,
    },
}));


const Plugins = observer(({ browser }: { browser: Browser }): JSX.Element => {
    const [schemas, setSchemas] = useState(Plugin.pluginSchemas);

    // if (Plugin.hasPluginSchemas) {
    //     console.log('Plugins plugin schemas loaded');
    // } else {
    //     console.log('Plugins.tsx -> Manager.loadAll()');
    //     Manager.loadAll();
    // }

    useEffect(
        () => {
            console.log('Plugins.tsx -> Manager.loadAll()');
            Manager.loadAll().then(
                () => setSchemas(Plugin.pluginSchemas)
            );
        },
        []
    );

    return <PluginsCompnent browser={browser} schemas={schemas} onAdd={browser.addPlugin} />;
});

const PluginTile = ({ schema, onAdd }: { schema: JSONSchema7; onAdd: (schema: JSONSchema7) => void }): React.ReactElement => (
    <>
        <div>{schema.description}</div>
        <GridListTileBar
            title={schema.title}
            actionIcon={
                <IconButton onClick={(): void => onAdd(schema)}>
                    <AddIcon />
                </IconButton>
            }
        />
    </>
);

const PluginsCompnent = ({ browser, schemas, onAdd }: { browser: Browser; schemas: JSONSchema7[]; onAdd: (schema: JSONSchema7) => void }): JSX.Element => {
    const classes = useStyles();

    return (
        <List>
            <ListItem>
                <GridList>
                    {
                        schemas.map(
                            (schema: JSONSchema7) => {
                                if (schema.definitions == undefined)
                                    throw new Error(`Plugins.tsx.PluginsCompnent: ${schema.$ref}, ${schema.$id} has no definitions ${JSON.stringify(schema)}`);
                                
                                return (
                                    <GridListTile key={schema.$ref}>
                                        <PluginTile schema={schema.definitions[(schema.$ref as string).substr('#/definitions/'.length)] as JSONSchema7} onAdd={onAdd} />
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
};

export default Plugins;