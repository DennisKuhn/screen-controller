import React, { useState } from 'react';

import { Tooltip, IconButton, Grid } from '@material-ui/core';

// @material-ui/icons
import Menu from '@material-ui/icons/Menu';
import MenuOpen from '@material-ui/icons/MenuOpen';

import { ObjectFieldTemplateProps } from '@rjsf/core';

import HiddenField from '../Fields/Hidden';

import { SetupBaseInterface } from '../../../Setup/SetupInterface';
import { moveToTarget } from '../Utils';
import { FormContext } from '../FormContext';

const ObjectTemplate = (props: ObjectFieldTemplateProps): JSX.Element => {
    const [configVisible, setConfigVisible] = useState(false);
    const { properties, formData, formContext, idSchema } = props;
    const setup = formData as SetupBaseInterface;
    const [setupObject] = moveToTarget(
        (formContext as FormContext).plugin,
        idSchema.$id.split('_')
    );

    console.log(`SetupBaseTemplate: setup.id=${setup.id} setupObject.id=${setupObject.id}`, props);

    const nameContent = properties
        .find(({ name, content }) =>
            (name === 'name') &&
            ((content.props.uiSchema == undefined)
                || (content.props.uiSchema['ui:FieldTemplate']?.name != HiddenField.name)))?.content;


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
                    {
                        nameContent ?
                            (<Grid item>{nameContent}</Grid>) :
                            (<></>)
                    }
                </Grid>
            </Grid>
            {
                configVisible &&
                properties
                    .filter(({ content, name }) =>
                        (name !== 'name')
                        && ((content.props.uiSchema == undefined)
                            || (content.props.uiSchema['ui:FieldTemplate']?.name != HiddenField.name))
                    )
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
