import { GridList, GridListTile, GridListTileBar, IconButton, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { Add } from '@material-ui/icons';
import { ObjectFieldTemplateProps } from '@rjsf/core';
import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { cloneDeep } from 'lodash';
import React from 'react';
import { ObservableSetupBaseMap } from '../../../Setup/Container';
import controller from '../../../Setup/Controller/Factory';
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

const NewItemTile = ({ schema, addItem, key }: { schema: JSONSchema7; key: string; addItem: (schema: JSONSchema7) => void }): JSX.Element => (
    <GridListTile key={key}>
        <div>{schema.description}</div>
        <GridListTileBar
            title={schema.title}
            actionIcon={
                <IconButton onClick={(): void => addItem(schema)}>
                    <Add />
                </IconButton>
            }
        />
    </GridListTile>
);


const ItemForm = (props: { itemId: string; expand: boolean; schemaChoices: JSONSchema7Definition[]; rootSchema: JSONSchema7 }): JSX.Element => {
    const { itemId, expand, schemaChoices, rootSchema } = props;    

    const item = controller.tryGetSetupSync(itemId, 0);
    if (!item) throw new Error(`Dictionary.tsx/ItemForm: can't get ${itemId} from controller`);

    const schema = cloneDeep(schemaChoices.find(prospect =>
        (typeof prospect == 'object') && (prospect.$id == item.className)));

    if (!schema) throw new Error(`Dictionary.tsx/ItemForm: can't find ${item.className} in schemaChoices[].$id ${JSON.stringify(schemaChoices)}`);
    if (typeof schema != 'object') throw new Error(`Dictionary.tsx/ItemForm: schema for ${item.className} is not an object (${typeof schema}) ${JSON.stringify(schemaChoices)}`);

    console.log(`Dictionary.tsx/ItemForm: [${item.id}]`);

    schema.definitions = rootSchema.definitions;

    return (
        <Form
            root={item}
            schema={schema}
            expand={expand}
        />
    );
};

const add = (parentId: string, mapName: string, className: string): void => {
    const parent = controller.tryGetSetupSync(parentId, 1);
    if (!parent) throw new Error(`DictionaryTemplate[${parentId}.${mapName}].add ${className}@${mapName} can't get parent ${parentId}`);

    const map = parent[mapName] as ObservableSetupBaseMap<SetupBase>;
    if (!map) throw new Error(`DictionaryTemplate[${parentId}.${mapName}].add ${className}@${parentId} can't get map ${mapName} in ${JSON.stringify(parent)}`);

    const newItem = SetupBase.createNew(className, parentId, mapName);

    console.debug(`DictionaryTemplate[${parentId}.${mapName}].add created ${newItem.className}@${newItem.id} add to ${newItem.parentId}.${mapName}`);

    map.set(newItem.id, newItem);
    // console.log(`DictionaryTemplate[${parentId}.${mapName}].added ${newItem.className}@${newItem.id} in ${newItem.parentId}.${mapName}`);
};

const addItem = (parentId: string, mapName: string, schema: JSONSchema7): void => {
    const itemSchema = schema.additionalProperties;
    if (typeof itemSchema != 'object')
        throw new Error(`DictionaryTemplate[${parentId}.${mapName}].addItem no additionalProperties: ${JSON.stringify(schema)}`);

    const className = (itemSchema.properties?.className as JSONSchema7)?.const;
    if (typeof className != 'string')
        throw new Error(`DictionaryTemplate[${parentId}.${mapName}].addItem no className.const[string]: ${JSON.stringify(itemSchema)}`);

    // console.debug(`DictionaryTemplate[${parentId}.${mapName}].addItem create (${className}, ${parentId})`);

    add(parentId, mapName, className);
};

const addSchemaItem = (parentId: string, mapName: string, newSchema: JSONSchema7): void => {
    const className = (newSchema.properties?.className as JSONSchema7)?.const;

    if (typeof className != 'string') throw new Error(`DictionaryTemplate[${parentId}.${mapName}].addSchemaItem no className.const[string]: ${JSON.stringify(newSchema)}`);

    // console.log(`DictionaryTemplate[${parentId}.${mapName}].addSchemaItem create (${className}, ${parentId})`);

    add(parentId, mapName, className);
};


const DictionaryObjectFieldTemplate = (props: ObjectFieldTemplateProps): JSX.Element => {
    const { formData, idSchema, schema, formContext } = props;
    const itemMap = formData as Dictionary<SetupBaseInterface>;

    console.debug( `DictionaryTemplate[${idSchema?.$id}]`/*, itemMap*/);
    // Screen_displays, Screen_2528732444_browsers, Screen_Browser-bVal4azqO_plugins
    const [parentId, mapName] = idSchema.$id.split('_').slice(-2);

    const choices = (typeof schema.additionalProperties == 'object'
        && schema.additionalProperties.oneOf
        && schema.additionalProperties.oneOf.length) ?
        schema.additionalProperties.oneOf : undefined;

    // console.log(`${module.id}: DictionaryTemplate[${props.title}]`);
    return (
        <div>
            {/* <TreeItem
                nodeId={idSchema.$id}
                label={}
            > */}
            <ItemLabel title={props.title} {...(choices ? {} : { factory: (): void => addItem(parentId, mapName, schema) })} />
            {(choices &&
                <GridList cellHeight={100} cols={3}>
                    {choices.map((schema, index) =>
                        NewItemTile({
                            key: (schema as JSONSchema7).$id ?? index.toString(),
                            schema: schema as JSONSchema7,
                            addItem: () => addSchemaItem(parentId, mapName, schema as JSONSchema7)
                        })
                    )}
                </GridList>
            )}
            {Object.keys(itemMap).map(childId =>
                <ItemForm
                    key={childId}
                    itemId={childId}
                    expand={Object.keys(itemMap).length == 1}
                    schemaChoices={choices ?? [schema.additionalProperties as JSONSchema7]}
                    rootSchema={formContext.schema} />
            )
            }
            {/* </TreeItem> */}
        </div >
    );
};

export default DictionaryObjectFieldTemplate;
