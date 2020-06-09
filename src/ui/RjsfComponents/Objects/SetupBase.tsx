import React, { ReactNode, useCallback } from 'react';


import { ObjectFieldTemplateProps } from '@rjsf/core';

import HiddenField from '../Fields/Hidden';

import { SetupBaseInterface } from '../../../Setup/SetupInterface';
import { TreeItem } from '@material-ui/lab';
import DeleteIcon from '@material-ui/icons/Delete';
import { makeStyles, IconButton, createStyles } from '@material-ui/core';
import controller from '../../../Setup/Controller';
import Observed from '../Fields/Observed';

const useItemLabelStyles = makeStyles(() =>
    createStyles({
        root: {
            display: 'flex'
        },
        label: {
            flexGrow: 1
        },
        icon: {
            flexGrow: 0
        }
    })
);

const ItemLabel = ({ title, destructor }: { title: ReactNode; destructor: () => void }): JSX.Element => {
    const classes = useItemLabelStyles();
    return (
        <div className={classes.root}>
            {title}
            <IconButton className={classes.icon} onClick={destructor}>
                <DeleteIcon />
            </IconButton>
        </div>
    );
};

const ObjectTemplate = (props: ObjectFieldTemplateProps): JSX.Element => {
    const { properties, formData, idSchema } = props;
    const setup = formData as SetupBaseInterface;

    console.log(`SetupBaseTemplate[${idSchema?.$id}]: setup.id=${setup?.id}/${setup?.className}`, props);

    const deleteItem = useCallback(
        async () => {
            const parent = await controller.getSetup(setup.parentId, 1);

            if (!parent)
                throw new Error(`SetupBaseTemplate[${idSchema?.$id},${setup.id}].deleteItem can't get parent ${setup.parentId}`);

            console.log(`SetupBaseTemplate[${idSchema?.$id},${setup.id}].deleteItem from ${parent.id}`);

            parent.deleteChild(setup.id);
        },
        []
    );

    const nameContent = properties
        .find(({ name, content }) =>
            (name === 'name') &&
            ((content.props.uiSchema == undefined)
                || (content.props.uiSchema['ui:FieldTemplate']?.name != HiddenField.name)))?.content ?? <></>;

    // console.log(`${module.id}: ObjectTemplate[${props.title}]`);
    return (
        <TreeItem
            nodeId={idSchema.$id}
            label={<ItemLabel title={<nameContent.type setupItemId={setup.id} {...nameContent.props} />} destructor={deleteItem} />}
            >
            {
                properties
                    .filter(({ content, name }) =>
                        (name !== 'name')
                        && ((content.props.uiSchema == undefined)
                            || (content.props.uiSchema['ui:FieldTemplate']?.name != HiddenField.name))
                    )
                    .map(({content, name}) => {
                        console.log(`${module.id}: ObjectTemplate[${setup.id}] create ${name}`, { ...content.props });
                        return <content.type key={content.key} parentProperty={name} setupItemId={setup.id} {...content.props} />;
                    })
            }
        </TreeItem>
    );
};

export default ObjectTemplate;
