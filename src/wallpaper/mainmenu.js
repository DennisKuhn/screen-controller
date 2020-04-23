/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use strict';

import HoverMenu from './wallwindow/hovermenu';
import { DRAWPROCESSORS, drawProcessorFactory } from './drawprocessor';
import { WallMenuList, WallMenuButtonList, WallMenuRadioList } from './wallwindow/wallmenu';
import fbCon from './connectors/facebookconnector';
import conSup from './production/contentsupplier';
import { supplyMonitor } from './production/supplymonitor';
import { shapeList } from './shapelist';
import svgImportMenu from './svgimportmenu';



import localImageProducer from './production/localimageproducer';
import localVideoProducer from './production/localvideoproducer';


export const SHAPE_STORAGE_SLOT_AUTO_SAVE = 'as_autosave';
const SHAPE_STORAGE_SLOT_PREFIX = 'as_slot';
const SHAPE_STORAGE_MENU_GROUP = 'Storage';
const DRAW_PROCESSOR_ICON_PREFIX = 'draw_';

/**
 * @extends HoverMenu
 */
class MainMenu extends HoverMenu {
    constructor() {
        super('MainMenu');

        this.contentShow = null;
        this.facebookConnectionButton = null;
        this.initReady = false;
        this.shapeStorageMenu = null;
        this.storageMenuItems = new Object();
        this._storageSlots = 3;
    }

    /**
     * @returns {number}
     */
    get storageSlots() {
        return this._storageSlots; 
    }
    
    /**
     * @param {number} newStorageSlots
     */
    set storageSlots(newStorageSlots) { 
        if (this._storageSlots != newStorageSlots ) { 
            this._storageSlots = newStorageSlots;

            if (this.hasLoaded) {
                this.createShapeStorageMenu();
            }
        }
    }

    init() {
        if (this.hasLoaded) {
            this.createShapeStorageMenu();
        } else {
            // console.log("MainMenu.init(): wait for loaded");
            this.initReady = true;
        }
    }
    
    createShapeStorageMenu() {
        // console.log("createShapeStorageMenu(" + this._storageSlots + ")");

        this.shapeStorageMenu = new WallMenuList(SHAPE_STORAGE_MENU_GROUP);

        this.addGroup(
            this.shapeStorageMenu
        );
        for (let iSlot=0; iSlot <= this._storageSlots; iSlot++) {
            const slot = iSlot ? SHAPE_STORAGE_SLOT_PREFIX + iSlot : SHAPE_STORAGE_SLOT_AUTO_SAVE;
            const title = iSlot ? 'Slot ' + iSlot : 'Auto';
            this.storageMenuItems[slot] = this.shapeStorageMenu.addSubItem( slot, title, 
                slot => {
                    // console.log( 'Save ShapeList(): ' + slot);
                    window.storage.saveShapeList( slot, shapeList ); 
                    this.updateStorageStats(); 
                }, 'save', false,
                slot => { 
                    // console.log( 'Load ShapeList(): ' + slot);
                    window.storage.loadShapeList( slot, shapeList ); 
                    shapeList.updateAutosave(); 
                }, 'load', false 
            );
        }
        this.updateStorageStats();
    }

    /**
     * Create the menu.
     */
    onLoaded() {
        let newGroup = new WallMenuButtonList('Shapes');

        this.addGroup(
            newGroup
        );

        newGroup.addSubItem( () => {
            shapeList.empty(); shapeList.updateAutosave(); 
        }, 'clear', false );
        newGroup.addSubItem( () => {
            this.Hide(); svgImportMenu.Show(); 
        }, 'loadsvg', false );

        newGroup = new WallMenuRadioList('DrawShapes');

        this.addGroup(
            newGroup
        );

        const selectDrawProcessor = e => {
            drawProcessorFactory.select( DRAWPROCESSORS[ e.target.value ]	); 
        };

        drawProcessorFactory.getProcessorNames().forEach((processor, index) => {
            newGroup.addSubItem( '', selectDrawProcessor, index == 0,  DRAW_PROCESSOR_ICON_PREFIX + processor.toLowerCase(), processor );
        });

        // this.createShapeStorageMenu();
        this.shapeStorageMenu = new WallMenuList(SHAPE_STORAGE_MENU_GROUP);

        this.addGroup(
            this.shapeStorageMenu
        );

        newGroup = new WallMenuButtonList('Sources');

        this.addGroup(
            newGroup
        );
        this.facebookConnectionButton = newGroup.addStateButton( newConnectState => {
            // console.log("MainMenu.onNewConnectState(" + newConnectState + ")");
            switch (newConnectState) {
                case 0: // connected
                    if ( !fbCon.isConnected) {
                        fbCon.connect();
                    } else {
                        // console.log("MainMenu.onNewConnectState(" + newConnectState + "): already connected");
                    }
                    break;
                case 1: // disconnected
                    if ( fbCon.isConnected) {
                        fbCon.disconnect();
                    } else {
                    // console.log("MainMenu.onNewConnectState(" + newConnectState + "): already disconnected");
                    }
                    break;
            }
        }, 'connection_facebook', 2, fbCon.isConnected ? 0 : 1 );

        fbCon.addConnectChangedListeners( connected => this.facebookConnectionChanged( connected ) );


        newGroup = new WallMenuButtonList('Background');

        this.addGroup(
            newGroup
        );

        newGroup.addSubItem( function()  {
            this.contentShow.next();
        }, 'next', false );
        newGroup.addStateButton( function(newPlayState)  {
            // console.log("HoverMenu.onNewFilterState(" + newFilterState + ")");
            switch (newPlayState) {
                case 0: // play
                    this.contentShow.play();
                    break;
                case 1: // pause
                    this.contentShow.pause();
                    break;
            }
        }, 'play_pause', 2, 0 );


        newGroup.addStateButton( function(newFilterState)  {
            // console.log("HoverMenu.onNewFilterState(" + newFilterState + ")");
            switch (newFilterState) {
                case 0: // out
                    localImageProducer.excludeFilter = localImageProducer.filter;
                    localImageProducer.includeFilter = null;
                    localVideoProducer.excludeFilter = localVideoProducer.filter;
                    localVideoProducer.includeFilter = null;
                    break;
                case 1:  // none
                    localImageProducer.excludeFilter = null;
                    localImageProducer.includeFilter = null;
                    localVideoProducer.excludeFilter = null;
                    localVideoProducer.includeFilter = null;
                    break;
                case 2: // in
                    localImageProducer.excludeFilter = null;
                    localImageProducer.includeFilter = localImageProducer.filter;
                    localVideoProducer.excludeFilter = null;
                    localVideoProducer.includeFilter = localVideoProducer.filter;
                    break;
            }
            switch (newFilterState) {
                case 0: // out
                case 2: // in
                    conSup.flush();
                    this.contentShow.flush();
                    break;
                case 1:  // none
                    break;
            }
        }, 'filter_states', 3, 0 );

        newGroup.addStateButton( monitorState => {
            // console.log("HoverMenu.onNewFilterState(" + newFilterState + ")");
            switch (monitorState) {
                case 0: // Film
                    supplyMonitor.Hide();
                    break;
                case 1: // Blank
                    supplyMonitor.Show();
                    break;
            }
        }, 'supply', 2, 0 );

        if (this.initReady) {
            // console.log("MainMenu.onLoaded(): call init");
            this.hasLoaded = true;
            this.init();
        }
    }

    facebookConnectionChanged( connected ) {
        this.facebookConnectionButton.setState( connected ? 0 : 1 );
    }

    updateStorageStats() {
        let total = 0;
        let keys = '';
        const usedKeys = [];
        
        try {
            for (const key in window.localStorage) {
                if (key == 'as_slot1-save') {
                    console.error('updateStorageStats: removeItem ' + key + ' !!'); window.localStorage.removeItem(key); 
                } else
                // if(key == SHAPE_STORAGE_SLOT_AUTO_SAVE) { /* IGNORING   as_autosave    !!!! NO AUTO SAVE STORAGE STATS YET !!!! */ } else
                if (window.localStorage.hasOwnProperty(key)) {
                    // console.log("updateStorageStats: " + key );
                    usedKeys[key] = true;
                    const size = ( key.length + window.localStorage[key].length ) * 2;
                    const sizeText = ( size / 1024 ).toFixed(0) + 'KB';
                    total += size;
                    keys += key + ': ' + ( size/1024 ).toFixed(1) + ',<br>';
                    
                    if (this.storageMenuItems.hasOwnProperty(key)) {
                        this.storageMenuItems[key].updateDescription(sizeText);
                        this.storageMenuItems[key].enableAction(1, true ); 
                    } else if ( SHAPE_STORAGE_SLOT_PREFIX == key.substr(0, SHAPE_STORAGE_SLOT_PREFIX.length) ) {
                        console.warn('updateStorageStats: ' + key + ' not shown !!');
                    } else {
                        // console.warn("updateStorageStats: " + key + " invalid !!");
                    }
                }
            }
        } catch ( ex ) {  
            console.error('updateStorageStats(' + keys + '): caught: ' + ex);
        }  
        
        // el70.setLabel( "Space Used: ~" + ( total / 1024 ).toFixed(0) + "KB / " + (1024*5).toFixed(0) + "KB" );

        for (let iSlot=1; iSlot <= this._storageSlots; iSlot++) {
            const unusedKey = SHAPE_STORAGE_SLOT_PREFIX + iSlot;

            if (usedKeys[unusedKey]) {
            } else {
                this.storageMenuItems[unusedKey].enableAction(1, false );
            }
        }
        
        return total;
    }

}

const mainMenu = new MainMenu();

export default mainMenu;
