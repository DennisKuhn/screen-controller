import { GridList, GridListTile, GridListTileBar, IconButton, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { Add } from '@material-ui/icons';
import { TreeItem } from '@material-ui/lab';
import { ObjectFieldTemplateProps } from '@rjsf/core';
import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { cloneDeep } from 'lodash';
import React, { useCallback } from 'react';
import { ObservableSetupBaseMap } from '../../../Setup/Container';
import controller from '../../../Setup/Controller';
import { SetupBase } from '../../../Setup/SetupBase';
import { Dictionary, SetupBaseInterface } from '../../../Setup/SetupInterface';
import Form from '../Form';

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
    </GridListTile>
);


const ItemForm = ({ plainItem, schemaChoices, rootSchema }: { plainItem: SetupBaseInterface; schemaChoices: JSONSchema7Definition[]; rootSchema: JSONSchema7 }): JSX.Element => {
    const schema = cloneDeep(schemaChoices.find(prospect =>
        (typeof prospect == 'object') && (prospect.$id == plainItem.className)));
    
    if (!schema)
        throw new Error(`Dictionary.tsx/ItemForm: can't find ${plainItem.className} in schemaChoices[].$id ${JSON.stringify(schemaChoices)}`);
    if (typeof schema != 'object')
        throw new Error(`Dictionary.tsx/ItemForm: schema for ${plainItem.className} is not an object (${typeof schema}) ${JSON.stringify(schemaChoices)}`);

    schema.definitions = rootSchema.definitions;

    // console.log(`Dictionary.tsx/ItemForm: [${plainItem.id}]`, { ...{ plainItem, schema, schemaChoices, rootSchema}});
    
    return (
        <Form
            rootPlain={plainItem}
            schema={schema}
        />
    );
};

const DictionaryObjectFieldTemplate = (props: ObjectFieldTemplateProps): JSX.Element => {
    const { properties, formData, idSchema, schema, formContext } = props;
    const setup = formData as Dictionary<SetupBaseInterface>;

    console.log(
        `DictionaryTemplate[${idSchema?.$id}]: setup.id=${setup?.id} setupItemId=${props['setupItemId']}`,
        cloneDeep(props));
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
        console.log(`DictionaryTemplate[${idSchema?.$id}].added ${newItem.className}@${newItem.id} in ${newItem.parentId}.${mapName}`);
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
                    <GridList cellHeight={100} cols={3}>
                    {choices.map( (schema, index) =>
                        NewItemTile( {key: (schema as JSONSchema7).$id ?? index.toString(), schema: schema as JSONSchema7, addItem: addSchemaItem})
                    )}
                    </GridList>
                )}
                {choices ? 
                    Object.values(setup).map( plainChild => 
                        <ItemForm key={plainChild.id} plainItem={plainChild} schemaChoices={choices} rootSchema={formContext.schema} />    
                    )
                :
                    properties.map(({ content, name }) => {
                        console.log(`DictionaryTemplate[${setup.id}] create ${name}`, { ...content.props });
                        return content;
                    })
                }
            </TreeItem>
        </div >
    );
};

export default DictionaryObjectFieldTemplate;
