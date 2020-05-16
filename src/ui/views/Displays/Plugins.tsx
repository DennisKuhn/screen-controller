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

const Plugins = observer(({ browser }: { browser: Browser }): JSX.Element => {
    if (!SetupBase.activeSchema.definitions)
        return <GridList />;

    return (
        <GridList>
            {
                Object.values( SetupBase.activeSchema.definitions ).map(
                    (schema: JSONSchema7Definition) => (
                        <GridListTile key={(schema as JSONSchema7).$id}>
                            <GridListTileBar
                                title={(schema as JSONSchema7).title}
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