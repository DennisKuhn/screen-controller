import React, { useState } from 'react';

import { Grid, Tooltip, IconButton } from '@material-ui/core';

// @material-ui/icons
import Menu from '@material-ui/icons/Menu';
import MenuOpen from '@material-ui/icons/MenuOpen';

import { ObjectFieldTemplateProps } from '@rjsf/core';

import { SetupBaseInterface, Dictionary } from '../../../Setup/SetupInterface';

const ObjectTemplate = (props: ObjectFieldTemplateProps): JSX.Element => {
    const [configVisible, setConfigVisible] = useState(false);
    const { properties, formData, idSchema } = props;
    const setup = formData as Dictionary<SetupBaseInterface>;

    console.log(`DictionaryTemplate[${idSchema?.$id}]: setup.id=${setup?.id}`, props);


    // console.log(`${module.id}: ObjectTemplate[${props.title}]`);
    return (
        <div>
            <Grid container>
                <Grid container item>
                    <Grid item>
                        <Tooltip
                            id={'tooltip-' + setup.id + '-showconfig'}
                            title="Show config"
                            placement="top"
                        >
                            <IconButton
                                aria-label="Menu"
                                onClick={(): void => setConfigVisible(!configVisible)}
                            >
                                {configVisible ? <MenuOpen /> : <Menu />}
                            </IconButton>
                        </Tooltip>
                    </Grid>
                    <Grid item>{props.title}</Grid>
                </Grid>
            </Grid>
            {
                configVisible &&
                properties
                    .map(element => {
                        // console.log(`${module.id}: ObjectTemplate[${title}] ${element.name}`, { ...element.content.props.uiSchema });
                        // return element.content;
                        return element.content;
                    })
            }
        </div>
    );
};

export default ObjectTemplate;
