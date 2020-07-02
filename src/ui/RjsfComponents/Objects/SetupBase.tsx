import { createStyles, IconButton, makeStyles } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { TreeItem } from '@material-ui/lab';
import { ObjectFieldTemplateProps } from '@rjsf/core';
import React, { ReactNode, useCallback } from 'react';
import controller from '../../../Setup/Controller/Factory';
import { SetupBaseInterface } from '../../../Setup/SetupInterface';
import HiddenField from '../Fields/Hidden';
import { callerAndfName } from '../../../utils/debugging';

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

const SetupBaseObjectFieldTemplate = (props: ObjectFieldTemplateProps): JSX.Element => {
    const { properties, formData, idSchema } = props;
    const setup = formData as SetupBaseInterface;

    // console.debug( `${callerAndfName()}[${idSchema?.$id}][${setup?.id}/${setup?.className}]`, props );

    const deleteItem = useCallback(
        () => {
            const parent = controller.tryGetSetupSync(setup.parentId, 1);

            if (!parent) throw new Error(`SetupBaseTemplate[${idSchema?.$id},${setup.id}].deleteItem can't get parent ${setup.parentId}`);

            console.debug(`SetupBaseTemplate[${idSchema?.$id},${setup.id}].deleteItem from ${parent.id}`);

            parent.deleteChild(setup.id);
        },
        []
    );

    const nameContent = properties
        .find(({ name, content }) =>
            (name === 'name') &&
            ((content.props.uiSchema == undefined)
                || (content.props.uiSchema['ui:FieldTemplate']?.name != HiddenField.name)))?.content ?? <></>;

    const otherProperties = properties
        .filter(({ content, name }) =>
            (name !== 'name')
            && ((content.props.uiSchema == undefined)
                || (content.props.uiSchema['ui:FieldTemplate']?.name != HiddenField.name))
        )
        .map(({ content }) => content);
    
    // console.log(`SetupBaseTemplate[${props.title}]`);
    return (
        <TreeItem
            nodeId={idSchema.$id}
            label={<ItemLabel title={nameContent} destructor={deleteItem} />}
            >
            {otherProperties}
        </TreeItem>
    );
};

export default SetupBaseObjectFieldTemplate;
