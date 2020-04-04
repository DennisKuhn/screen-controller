'use strict';

import PopupMenu from './wallwindow/wallmenu';

const smMENU_NAME = 'ShapeEdit';
const smMOVE_GROUP = 'Move';
const smROTATE_GROUP = 'Rotate';
const smSCALE_GROUP = 'Scale';
const smCLOSE_DELETE_GROUP = 'CloseDelete';
const smSHAPE_ID_PREFIX = 'SelectShape-';
const smSELECT_GROUP = 'SelectShape';

/**
 * @extends PopupMenu
 */
class ShapeEditMenu extends PopupMenu {
    constructor() {
        super( smMENU_NAME );

        this.selectedShape = null;
        this.mouseX = null;
        this.mouseY = null;
        this.shapesCount = null;

        this.delayedMenu = new delayed( () => {
            this.deselectShape();
            
            const shapes = shapeList.getShapesForPoint( [this.mouseX-renderer.offsetX, this.mouseY-renderer.offsetY] );
            // console.log("DelayedMenu: Shapes [" + [this.mouseX-renderer.offsetX, this.mouseY-renderer.offsetY] + "]=" + shapes.length);
            this.shapesCount = shapes.length;
            
            if ( this.shapesCount > 0 ) {
                this.createShapeSelectionGroup(shapes);
                this.selectedShape = shapes[0];
                this.selectedShape.isSelected = true;
                this.Show();
            }
            
        }, 1000 );

        window.addEventListener('mousedown', e => this.onMouseDown(e) );
        window.addEventListener('mouseup',   e => this.onMouseUp(e) );
    }

    createShapeSelectionGroup(shapes) {
        let first = null;
        const newGroup = new WallMenuRadioList('SelectShape');
        this.addGroup(
            newGroup
        );
        if ( shapes.length > 1 ) {
            for ( let i = 0; i < shapes.length; i++ ) {
                if (! shapes[i].hasBeenRemoved ) {
                    first = first == null ? i : first;
                    //console.log("Add Shape i="+ i + " j=" + j);
                    newGroup.addSubItem( 
                        '#' + (i+1), 
                        e => { 
                            if (e.target.value) {
                                const id = Number( e.target.value );

                                if (this.selectedShape) {
                                    this.selectedShape.isSelected = false; this.selectedShape = null; 
                                }

                                for (let iShape=0; iShape < shapeList.shapes.length; iShape++) {
                                    if (shapeList.shapes[iShape].id == id) {
                                        this.selectedShape = shapeList.shapes[iShape];
                                        this.selectedShape.isSelected = true;
                                        break;
                                    }
                                }
                                if (this.selectedShape == null) {
                                    console.error('Select Shape: Can not find id=' + id);
                                }
                            } else {
                                console.error('Select Shape e.target.value='+ e.target.value + ' e.target=' + e.target);
                            }
                        }, 
                        i == first,
                        null,
                        shapes[i].id.toString()
                    );
                }
            }
        } else if (shapes.length == 1) {
            first = shapes[0].hasBeenRemoved ? null : 0;
        }
        return first;
    }

    setEnabled(enable) {
        if (this.enabled != enable) {
            this.enabled = enable;

            if (enable) {

            } else {
                this.delayedMenu.cancel();
            }
        }
        super.setEnabled(enable); 
    }

    /**
     * Create the menu: shape selection, translation, rotation, scale, close/delete 
     */
    onLoaded() {
        let newGroup = new WallMenuRadioList(smSELECT_GROUP);
        this.addGroup(
            newGroup
        );

        newGroup = new WallMenuList(smMOVE_GROUP);

        this.addGroup(
            newGroup
        );

        newGroup.addSubItem( 'Shape-Up', null,
            () => {
                this.selectedShape.translate( 0, -1 );
                shapeList.updateAutosave();
            }, 'move_up', true
        );
        newGroup.addSubItem( 'Shape-Side', null,
            () => {
                this.selectedShape.translate( -1, 0 );
                shapeList.updateAutosave();
            }, 'move_left', true, 
            () => {
                this.selectedShape.translate( 1, 0 );
                shapeList.updateAutosave();
            }, 'move_right', true 
        );
        newGroup.addSubItem( 'Shape-Down', null, () => {
            this.selectedShape.translate( 0, 1 );
            shapeList.updateAutosave();
        }, 'move_down', true
        );

        newGroup = new WallMenuButtonList(smROTATE_GROUP);

        this.addGroup(
            newGroup
        );

        newGroup.addSubItem( () => { 
            this.selectedShape.rotate( 1 * Math.PI / 180 );
            shapeList.updateAutosave();
        }, 
        'rotate_cw', true 
        );

        newGroup.addSubItem( () => { 
            this.selectedShape.rotate( -1 * Math.PI / 180 );
            shapeList.updateAutosave();
        }, 
        'rotate_ccw', true 
        );

        newGroup = new WallMenuButtonList(smSCALE_GROUP);

        this.addGroup(
            newGroup
        );

        newGroup.addSubItem( () => { 
            this.selectedShape.scale( 1.01, 1.01 );
            shapeList.updateAutosave();
        }, 
        'scale_up', true 
        );

        newGroup.addSubItem( () => { 
            this.selectedShape.scale( 1/1.01, 1/1.01 );
            shapeList.updateAutosave();
        }, 
        'scale_down', true 
        );

        newGroup = new WallMenuButtonList(smCLOSE_DELETE_GROUP);

        this.addGroup(
            newGroup
        );

        newGroup.addSubItem( () => { 
            this.deselectShape();
            this.Hide();
        }, 
        'close', false 
        );

        newGroup.addSubItem( () => { 
            this.selectedShape.hasBeenRemoved = true;
            this.deselectShape();
            this.shapesCount--;
            shapeList.updateAutosave();

            if (this.shapesCount > 0) {
                const shapes = shapeList.getShapesForPoint( [this.mouseX-renderer.offsetX, this.mouseY-renderer.offsetY] );
                    
                const firstShape = this.createShapeSelectionGroup(shapes);
                this.selectedShape = shapes[firstShape];
                this.selectedShape.isSelected = true;
            } else {
                this.Hide();
            }
        }, 
        'delete', false 
        );
    }

    deselectShape( ) {
        if ( this.selectedShape ) {
            this.selectedShape.isSelected = false;
            this.selectedShape = null;
        }
    }
    
    onMouseDown(e) {
        if (this.enabled && (! this.shown)) {
            const onScreen = e.clientX >= 0 && e.clientY >= 0 && e.clientX < proPro.width && e.clientY < proPro.height;

            if ( onScreen ) {										
                this.mouseDown(e.clientX, e.clientY);
            }
        }
    }
    
    onMouseUp(e) {
        if (this.enabled) {
            // let onScreen = e.clientX >= 0 && e.clientY >= 0 && e.clientX < proPro.width && e.clientY < proPro.height;
            this.mouseUp();
        }
        // console.log("onMouseUp(" + e.target + ") onScreen=" + onScreen + " mouseDown=" + mouseDown + " allowDrawing=" + allowDrawing + " lockedDrawing=" + lockedDrawing);
    }

    mouseDown(x,y) {
        const onShape = shapeList.hasPointShape( [x-renderer.offsetX, y-renderer.offsetY] );
        // console.log("mouseDown(" + [x, y] + ") onShape=" + onShape );
        if (onShape) {
            this.mouseX = x;
            this.mouseY = y;
            this.delayedMenu.trigger();
        }
    }

    mouseUp() {
        this.delayedMenu.cancel();
    }

}