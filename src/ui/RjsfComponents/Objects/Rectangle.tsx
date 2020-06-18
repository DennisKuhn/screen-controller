import React from 'react';

import { GridList, GridListTile, Tooltip, IconButton } from '@material-ui/core';
// @material-ui/icons
import Fullscreen from '@material-ui/icons/Fullscreen';
import FullscreenExit from '@material-ui/icons/FullscreenExit';

import { ObjectFieldTemplateProps } from '@rjsf/core';

import HiddenField from '../Fields/Hidden';

import { Rectangle as PlainRectangle } from '../../../Setup/Default/Rectangle';
import { RelativeRectangle } from '../../../Setup/Default/RelativeRectangle';
import controller from '../../../Setup/Controller/Factory';



/**
 * Object template for Setup/Defaults/Rectangle or RelativeRectangle
 * @param props 
 */
const RectangleObjectFieldTemplate = (props: ObjectFieldTemplateProps): JSX.Element => {
    const { title, properties, formData: rect } = props;
    const item = controller.tryGetSetupSync(rect.id, 0) as RelativeRectangle | undefined;
    const parent = item?.parent;
    
    const property = props.idSchema.$id.split('_').pop();

    if (!item)
        throw new Error(`Rectangle[${rect.id}] failed controller.tryGetSetupSync()`);
    if (!parent)
        throw new Error(`Rectangle[${rect.id}] failed .parent`);
    if (!property)
        throw new Error(`Rectangle[${rect.id}] failed get parent property from ${props.idSchema.$id}`);

    // console.debug(`RectangleObjectTemplate[${parent.id}].${property}[${item.id}]`, { ...props });

    let isFullscreen = (rect.x == 0 && rect.y == 0 && rect.width == 1 && rect.height == 1);

    const toggleFullScreen = (): void => {
        isFullscreen = !isFullscreen;

        console.debug(`RectangleObjectTemplate[${title}].toggleFullScreen ${item.id}=${isFullscreen}`, item, props);

        if (rect.className == RelativeRectangle.name) {
            parent[property] = RelativeRectangle.create(
                parent.id,
                property,
                isFullscreen ?
                    { x: 0, y: 0, width: 1, height: 1 } :
                    { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
            );
        } else {
            parent[property] = PlainRectangle.create(
                parent.id,
                property,
                isFullscreen ?
                    { x: 0, y: 0, width: 1, height: 1 } :
                    { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
            );
        }
    };

    const withoutHidden = properties
        .filter(({ content }) =>
            (content.props.uiSchema == undefined)
            || (content.props.uiSchema['ui:FieldTemplate'] != HiddenField));

    return (
        <div>
            {title}
            <GridList cellHeight={'auto'} cols={9} >
                <GridListTile cols={1}>
                    <Tooltip
                        title={isFullscreen ? 'Make part screen' : 'Make Full Screen'}
                    >
                        <IconButton aria-label="Fullscreen" onClick={toggleFullScreen} >
                            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                        </IconButton>
                    </Tooltip>
                </GridListTile>
                {
                    withoutHidden.map(({ content }) => (
                        <GridListTile cols={2} key={`Tile-${content.key}`}>
                            {content}
                        </GridListTile>)
                    )
                }
            </GridList>
        </div>
    );
};

export default RectangleObjectFieldTemplate;