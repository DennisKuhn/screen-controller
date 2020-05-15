import { observer } from 'mobx-react-lite';

import React from 'react';

import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import GridListTileBar from '@material-ui/core/GridListTileBar';

import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';

import { Browser, PluginSetupItem } from '../../../infrastructure/Configuration/Root';
import { JSONSchema7 } from 'json-schema';


const Plugins = observer(({ browser }: { browser: Browser }): JSX.Element => {

    return (
        <GridList>
            {
                PluginSetupItem.schemas.map(
                    (schema: JSONSchema7) => (
                        <GridListTile key={schema.$id}>
                            <GridListTileBar
                                title={schema.title}
                                actionIcon={
                                    <IconButton>
                                        <AddIcon />
                                    </IconButton>
                                }
                            />
                        </GridListTile>
                    )
                )
            }
        </GridList>
    );
});

export default Plugins;