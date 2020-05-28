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
import { Manager } from '../../../plugins/Manager';

const useStyles = makeStyles((theme) => ({
    coordField: {
        width: 60,
    },
}));

const getSchemas = (): JSONSchema7Definition[] => {
    if (!SetupBase.activeSchema.definitions)
        throw new Error('Plugins.tsx: Plugins: no SetupBase.activeSchema.definitions');

    const schemas = Object.values(SetupBase.activeSchema.definitions)
        .filter(schemaDef => (schemaDef as JSONSchema7)
            .allOf?.some(pluginRefProspect =>
                (pluginRefProspect as JSONSchema7).$ref == Plugin.name));

    console.log('Plugins getSchemas', { ...schemas });

    return schemas;
};

const hasSchemas = (): boolean => {
    if (!SetupBase.activeSchema.definitions)
        throw new Error('Plugins.tsx: hasSchemas: no SetupBase.activeSchema.definitions');

    const result = Object.values(SetupBase.activeSchema.definitions)
        .some(schemaDef =>
            (schemaDef as JSONSchema7).allOf?.some(pluginRefProspect =>
                (pluginRefProspect as JSONSchema7).$ref == Plugin.name));

    console.log(`Plugins hasSchemas ${result}`);

    return result;
};

const Plugins = observer(({ browser }: { browser: Browser }): JSX.Element => {
    if (hasSchemas()) {
        console.log('Plugins plugin schemas loaded');
    } else {
        console.log('Plugins no plugin schema -> Manager.loadAll()');
        Manager.loadAll();
    }

    return <PluginsCompnent browser={browser} schemas={getSchemas()} onAdd={browser.addPlugin} />;
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

const PluginsCompnent = ({ browser, schemas, onAdd }: { browser: Browser; schemas: JSONSchema7Definition[]; onAdd: (schema: JSONSchema7) => void }): JSX.Element => {
    const classes = useStyles();

    return (
        <List>
            <ListItem>
                <GridList>
                    {
                        schemas.map(
                            (schemaDef: JSONSchema7Definition) => {
                                const schema = schemaDef as JSONSchema7;
                                return (
                                    <GridListTile key={schema.$id}>
                                        <PluginTile schema={schema} onAdd={onAdd} />
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