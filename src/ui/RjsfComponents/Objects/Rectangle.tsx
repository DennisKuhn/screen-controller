import React from 'react';

import { GridList, GridListTile, Tooltip, IconButton } from '@material-ui/core';
// @material-ui/icons
import Fullscreen from '@material-ui/icons/Fullscreen';
import FullscreenExit from '@material-ui/icons/FullscreenExit';

import { ObjectFieldTemplateProps } from '@rjsf/core';

import { FormContext } from '../FormContext';
import HiddenField from '../Fields/Hidden';

import { Rectangle as PlainRectangle } from '../../../Setup/Default/Rectangle';
import { RelativeRectangle } from '../../../Setup/Default/RelativeRectangle';
import controller from '../../../Setup/Controller';

/**
 * Object template for Setup/Defaults/Rectangle or RelativeRectangle
 * @param props 
 */
const Rectangle = (props: ObjectFieldTemplateProps): JSX.Element => {
    const { title, properties, formData: rect, formContext } = props;
    const item = controller.tryGetSetupSync(rect.id, 0) as RelativeRectangle | undefined;
    const parent = item?.parent;
    
    const property = props.idSchema.$id.split('_').pop();

    if (!item)
        throw new Error(`${module.id}.Rectangle[${rect.id}] failed controller.tryGetSetupSync()`);
    if (!parent)
        throw new Error(`${module.id}.Rectangle[${rect.id}] failed .parent`);
    if (!property)
        throw new Error(`${module.id}.Rectangle[${rect.id}] failed get parent property from ${props.idSchema.$id}`);

    console.log(`RectangleObjectTemplate[${parent.id}].${property}[${item.id}]`, { ...props });

    let isFullscreen = (rect.x == 0 && rect.y == 0 && rect.width == 1 && rect.height == 1);

    const toggleFullScreen = (): void => {
        isFullscreen = !isFullscreen;

        console.log(`${module.id}: RectangleObjectTemplate[${title}].toggleFullScreen ${item.id}=${isFullscreen}`, item, props);

        if (rect.className == RelativeRectangle.name) {
            parent[property] = RelativeRectangle.create(
                parent.id,
                isFullscreen ?
                    { x: 0, y: 0, width: 1, height: 1 } :
                    { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
            );
        } else {
            parent[property] = PlainRectangle.create(
                parent.id,
                isFullscreen ?
                    { x: 0, y: 0, width: 1, height: 1 } :
                    { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
            );
        }
    };

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
                    properties
                        .filter(({ content }) =>
                            (content.props.uiSchema == undefined)
                            || (content.props.uiSchema['ui:FieldTemplate'] != HiddenField))
                        .map(({ content }) => {
                            // console.log(`${module.id}: RectangleObjectTemplate[${title}] ${element.name}`, element, { ...element.content });

                            return (
                                <GridListTile cols={2} key={`Tile-${content.key}`}>
                                    <content.type key={content.key} setupItemId={rect.id} {...content.props} />
                                </GridListTile>
                            );
                        })
                }
            </GridList>
        </div>
    );
};

export default Rectangle;