'use strict';

import { PopupMenu, WallMenuButtonList, WallMenuRadioList, WallMenuTextList } from './wallwindow/wallmenu';
import { SvgFileSource } from './svgsource';
import { shapeList } from './shapelist';

const siMENU_NAME = 'SVGImport';
const siDESCRIPTION_GROUP = 'Description';
const siDETAIL_GROUP = 'Detail';
const siCLOSE_LOAD_GROUP = 'CloseLoad';
const siPROGRESS_ID = 'SvgImportProgress';

/**
 * @extends PopupMenu
 */
class SvgImportMenu extends PopupMenu {
    constructor() {
        super(siMENU_NAME);
        this.progress = null;
        this.detailGroup = null;
        this.closeButton = null;
        this.fileButton = null;
    }

    onLoaded() {
        let newGroup = new WallMenuTextList(siDESCRIPTION_GROUP);
    
        this.addGroup(
            newGroup
        );
    
        newGroup.addSubItem( 
            null, 
            'Importing will start automatically when you select a file. The remove details option indicates<br>how much detail will be removed after import to shrink data size and speed up some calculations.'
        );
    
        this.detailGroup = new WallMenuRadioList(siDETAIL_GROUP);
    
        this.addGroup(
            this.detailGroup
        );
    
        this.detailGroup.addSubItem( '0%', null, true, null, '0' );
        this.detailGroup.addSubItem( '0.12%', null, false, null, '0.12' );
        this.detailGroup.addSubItem( '0.25%', null, false, null, '0.25' );
        this.detailGroup.addSubItem( '0.5%', null, false, null, '0.5' );
        this.detailGroup.addSubItem( '1%', null, false, null, '1' );
    
        newGroup = new WallMenuButtonList(siCLOSE_LOAD_GROUP);
    
        this.addGroup(
            newGroup
        );
    
        this.closeButton = newGroup.addSubItem( () => this.Hide(), 'close', false );
    
        this.fileButton = newGroup.addSubItem(
            e => { 
                const inputFile = e.target;
                this.progress.Show();
                this.progress.setProgress(0);
                try {
                    const file = inputFile.files[0];
                    if ( file ) {
                        SvgFileSource(
                            file,
                            parseFloat( this.detailGroup.getValue()),
                            shapeList,
                            perc => this.progress.setProgress( perc ), 
                            () => {		
                                this.Hide();
                                this.progress.Hide();				
                                this.progress.setProgress( 0 );
                                inputFile.value = '';
                                shapeList.updateAutosave();
                            } 
                        );
                    }
                } catch ( ex ) {
                    console.error( ex.message );
                }
            }, 
            'loadsvg',
            false, true 
        );
    
        this.progress = newGroup.addProgressButton(siPROGRESS_ID);
        this.progress.Hide();
    }

}
const svgImportMenu = new SvgImportMenu();

export default svgImportMenu;
