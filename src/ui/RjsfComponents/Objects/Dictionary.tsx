import React, { useCallback } from 'react';

import { TreeItem } from '@material-ui/lab';

import { ObjectFieldTemplateProps } from '@rjsf/core';

import { SetupBaseInterface, Dictionary } from '../../../Setup/SetupInterface';
import { IconButton, Typography, GridListTile, GridListTileBar, GridList } from '@material-ui/core';
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

const ItemLabel = ({ title, factory }: { title: string; factory?: () => void }): JSX.Element => {
    const classes = useItemLabelStyles();
    return (
        <div className={classes.root}>
            <Typography className={classes.label} variant='caption' >
                {title}
            </Typography>
            {factory &&
                <IconButton className={classes.icon} onClick={factory}>
                    <Add />
                </IconButton>
            }
        </div>
    );
};

const NewItemTile = ({ schema, addItem, key }: { schema: JSONSchema7; key: string; addItem: (schema: JSONSchema7) => void}): JSX.Element => (
    <GridListTile key={key}>
        <div>{schema.description}</div>
        <GridListTileBar
            title={schema.title}
            actionIcon={
                <IconButton onClick={(): void => addItem( schema )}>
                    <Add />
                </IconButton>
            }
        />
    </GridListTile>);

const DictionaryTemplate = (props: ObjectFieldTemplateProps): JSX.Element => {
    const { properties, formData, idSchema, schema } = props;
    const setup = formData as Dictionary<SetupBaseInterface>;

    console.log(`DictionaryTemplate[${idSchema?.$id}]: setup.id=${setup?.id}`, props);
    const [parentId, mapName] = idSchema.$id.split('_').slice(-2);

    const choices = (typeof schema.additionalProperties == 'object'
        && schema.additionalProperties.oneOf
        && schema.additionalProperties.oneOf.length) ? 
        schema.additionalProperties.oneOf : undefined;

    const add = async (className: string): Promise<void> => {
        const parent = await controller.getSetup(parentId, 1);
        const newItem = SetupBase.createNew(className, parentId);

        console.log(`DictionaryTemplate[${idSchema?.$id}].add created ${newItem.className}@${newItem.id} add to ${newItem.parentId}.${mapName}`);
        const map = parent[mapName] as ObservableSetupBaseMap<SetupBase>;

        if (!map)
            throw new Error(`DictionaryTemplate[${idSchema?.$id}].add created ${newItem.className}@${newItem.id} can't get map ${newItem.parentId}.${mapName}`);

        map.set(newItem.id, newItem);
        console.log(`DictionaryTemplate[${idSchema?.$id}].add ${newItem.className}@${newItem.id} in ${newItem.parentId}.${mapName}`);
    };
    
    const addItem = useCallback(
        async () => {
            if (typeof schema.additionalProperties != 'object')
                throw new Error(`DictionaryTemplate[${idSchema?.$id}].addItem no additionalProperties: ${JSON.stringify(schema)}`);

            const itemSchema = schema.additionalProperties;

            if (typeof (itemSchema.properties?.className as JSONSchema7)?.const != 'string')
                throw new Error(`DictionaryTemplate[${idSchema?.$id}].addItem no className.const: ${JSON.stringify(itemSchema)}`);

            const className = (itemSchema.properties?.className as JSONSchema7)?.const as string;

            console.log(`DictionaryTemplate[${idSchema?.$id}].addItem create (${className}, ${parentId})`);

            await add(className);
        },
        []
    );

    const addSchemaItem = useCallback(
        async (newSchema: JSONSchema7) => {
            if (typeof (newSchema.properties?.className as JSONSchema7)?.const != 'string')
                throw new Error(`DictionaryTemplate[${idSchema?.$id}].addSchemaItem no className.const: ${JSON.stringify(newSchema)}`);

            const className = (newSchema.properties?.className as JSONSchema7)?.const as string;

            console.log(`DictionaryTemplate[${idSchema?.$id}].addSchemaItem create (${className}, ${parentId})`);

            await add(className);
        },
        []
    );


    // console.log(`${module.id}: DictionaryTemplate[${props.title}]`);
    return (
        <div>
            <TreeItem
                nodeId={idSchema.$id}
                label={<ItemLabel title={props.title} {...(choices ? {} : { factory: addItem })}  />}
            >
                {(choices &&
                    <GridList cellHeight={'auto'} cols={4}>
                    {choices.map( (schema, index) =>
                        NewItemTile( {key: (schema as JSONSchema7).$id ?? index.toString(), schema: schema as JSONSchema7, addItem: addSchemaItem})
                    )}
                    </GridList>
                )}
                {properties.map(property =>
                    property.content
                )}
            </TreeItem>
        </div >
    );
};

export default DictionaryTemplate;
