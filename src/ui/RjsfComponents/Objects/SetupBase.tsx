import React, {  } from 'react';


import { ObjectFieldTemplateProps } from '@rjsf/core';

import HiddenField from '../Fields/Hidden';

import { SetupBaseInterface } from '../../../Setup/SetupInterface';
import { TreeItem } from '@material-ui/lab';
import DeleteIcon from '@material-ui/icons/Delete';

const ObjectTemplate = (props: ObjectFieldTemplateProps): JSX.Element => {
    const { properties, formData, idSchema } = props;
    const setup = formData as SetupBaseInterface;

    console.log(`SetupBaseTemplate[${idSchema?.$id}]: setup.id=${setup?.id}`, props);

    const nameContent = properties
        .find(({ name, content }) =>
            (name === 'name') &&
            ((content.props.uiSchema == undefined)
                || (content.props.uiSchema['ui:FieldTemplate']?.name != HiddenField.name)))?.content;


    // console.log(`${module.id}: ObjectTemplate[${props.title}]`);
    return (
            <TreeItem nodeId={idSchema.$id} label={nameContent} endIcon={<DeleteIcon />}>
                {
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
            </TreeItem>
    );
};

export default ObjectTemplate;
