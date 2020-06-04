import React from 'react';

import { GridList, GridListTile, Tooltip, IconButton } from '@material-ui/core';
// @material-ui/icons
import Fullscreen from '@material-ui/icons/Fullscreen';
import FullscreenExit from '@material-ui/icons/FullscreenExit';

import { ObjectFieldTemplateProps } from '@rjsf/core';

import { FormContext } from '../FormContext';
import { moveToTarget } from '../Utils';
import HiddenField from '../Fields/Hidden';

import { Rectangle as PlainRectangle } from '../../../Setup/Default/Rectangle';
import { RelativeRectangle } from '../../../Setup/Default/RelativeRectangle';

/**
 * Object template for Setup/Defaults/Rectangle or RelativeRectangle
 * @param props 
 */
const Rectangle = (props: ObjectFieldTemplateProps): JSX.Element => {
    const { idSchema, title, properties, formData: rect, formContext } = props;
    const { plugin } = formContext as FormContext;

    // console.log(`${module.id}: RectangleObjectTemplate[${props.title}]`, { ...props });

    let isFullscreen = (rect.x == 0 && rect.y == 0 && rect.width == 1 && rect.height == 1);

    function toggleFullScreen(): void {
        isFullscreen = !isFullscreen;

        const [target, property] = moveToTarget(plugin, idSchema.$id.split('_'));

        // console.log(`${module.id}: RectangleObjectTemplate[${title}].toggleFullScreen ${target.id}.${property}=${isFullscreen}`, target, props);

        if (rect.className == RelativeRectangle.name) {
            target[property] = RelativeRectangle.createNew(
                target['id'],
                isFullscreen ?
                    { x: 0, y: 0, width: 1, height: 1 } :
                    { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
            );
        } else {
            target[property] = PlainRectangle.createNew(
                target['id'],
                isFullscreen ?
                    { x: 0, y: 0, width: 1, height: 1 } :
                    { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
            );
        }
    }

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
                        .filter(({ content }: { content: { props } }) =>
                            (content.props.uiSchema == undefined)
                            || (content.props.uiSchema['ui:FieldTemplate'] != HiddenField))
                        .map(element => {
                            // console.log(`${module.id}: RectangleObjectTemplate[${title}] ${element.name}`, element, { ...element.content });

                            return (
                                <GridListTile cols={2} key={`Tile-${element.content.key}`}>
                                    {element.content}
                                </GridListTile>
                            );
                        })
                }
            </GridList>
        </div>
    );
};

export default Rectangle;