import React, { useCallback } from 'react';

import { TreeItem } from '@material-ui/lab';

import { ObjectFieldTemplateProps } from '@rjsf/core';

import { SetupBaseInterface, Dictionary } from '../../../Setup/SetupInterface';
import { IconButton, Typography } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import { SetupBase } from '../../../Setup/SetupBase';
import { JSONSchema7 } from 'json-schema';
import controller from '../../../Setup/Controller';
import { ObservableSetupBaseMap } from '../../../Setup/Container';
import { makeStyles, createStyles } from '@material-ui/core/styles';


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

const ItemLabel = ({ title, factory }: { title: string; factory: () => void }): JSX.Element => {
    const classes = useItemLabelStyles();
    return (
        <div className={classes.root}>
            <Typography className={classes.label} variant='caption' >
                {title}
            </Typography>
            <IconButton className={classes.icon} onClick={factory}>
                <Add />
            </IconButton>
        </div>
    );
};

const DictionaryTemplate = (props: ObjectFieldTemplateProps): JSX.Element => {
    const { properties, formData, idSchema, schema } = props;
    const setup = formData as Dictionary<SetupBaseInterface>;    

    console.log(`DictionaryTemplate[${idSchema?.$id}]: setup.id=${setup?.id}`, props);
    const [parentId, mapName] = idSchema.$id.split('_').slice(-2);
  
    const addItem = useCallback(
        async () => {
            if (typeof schema.additionalProperties != 'object')
                throw new Error(`DictionaryTemplate[${idSchema?.$id}].addItem no additionalProperties: ${JSON.stringify(schema)}`);
            
            const parent = await controller.getSetup(parentId, 1);

            const itemSchema = schema.additionalProperties;

            if (typeof (itemSchema.properties?.className as JSONSchema7)?.const != 'string')
                throw new Error(`DictionaryTemplate[${idSchema?.$id}].addItem no className.const: ${JSON.stringify(itemSchema)}`);

            const className = (itemSchema.properties?.className as JSONSchema7)?.const as string;

            console.log(`DictionaryTemplate[${idSchema?.$id}].addItem create (${className}, ${parentId})`);

            const newItem = SetupBase.createNew(className, parentId);

            console.log(`DictionaryTemplate[${idSchema?.$id}].addItem created ${newItem.className}@${newItem.id} add to ${newItem.parentId}.${mapName}`);
            const map = parent[mapName] as ObservableSetupBaseMap<SetupBase>;
            
            if (!map)
                throw new Error(`DictionaryTemplate[${idSchema?.$id}].addItem created ${newItem.className}@${newItem.id} can get map ${newItem.parentId}.${mapName}`);
            
            map.set(newItem.id, newItem);
            console.log(`DictionaryTemplate[${idSchema?.$id}].addItem ${newItem.className}@${newItem.id} in ${newItem.parentId}.${mapName}`);
        },
        []
    );


    // console.log(`${module.id}: DictionaryTemplate[${props.title}]`);
    return (
        <div>
            <TreeItem
                nodeId={idSchema.$id}
                label={<ItemLabel title={props.title} factory={addItem} />}
            >
                {
                    properties
                        .map(element =>
                            element.content
                        )
                }
            </TreeItem>
        </div>
    );
};

export default DictionaryTemplate;
