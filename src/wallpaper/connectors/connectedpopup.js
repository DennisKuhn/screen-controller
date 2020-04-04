'use strict';

import {PopupMenu, WallMenuButtonList, WallMenuTextList} from '../wallwindow/wallmenu';
import locale from '../utils/locale';

/**
 * @extends PopupMenu
 */
export default class FacebookConnectedPopup extends PopupMenu {

    /**
     * 
     * @param {string} name of the connected facebook user
     * @param {string} avatarUrl
     * @param {Date} expiry of connection
     */
    constructor(name, avatarUrl, expiry) {
        super('FacebookConnectedPopup');
        
        this._userName = name;
        this._avatarUrl =  avatarUrl;
        this._expiry = expiry;
    }

    /**
     * 
     * @param {string} name of the connected facebook user
     * @param {string} avatarUrl
     * @param {Date} expiry of connection
     */
    reuse(name, avatarUrl, expiry) {
        this._userName = name;
        this._avatarUrl =  avatarUrl;
        this._expiry = expiry;
    }

    onLoaded() {
        const avatarGroup = new WallMenuButtonList('FBConnectedImages');
        this.addGroup( avatarGroup );
    
        avatarGroup.addImageButton( null, this._avatarUrl, 'FBConnectedAvatar', false );
        avatarGroup.addImageButton( null, 'connectors/fb_logo.png', 'FBConnectedLogo', false );

        const descriptionGroup = new WallMenuTextList('FBConnectedDescripton');
        this.addGroup( descriptionGroup );
    
        descriptionGroup.addSubItem( 
            null, 
            'Well done ' + this._userName + ','
        );
        descriptionGroup.addSubItem( 
            null, 
            'Successfull connected, until you disconnect or ' + locale.format( this._expiry ) + '.'
        );
        descriptionGroup.addSubItem( 
            null, 
            'Thank you - enjoy :-)'
        );
    
        const closeGroup = new WallMenuButtonList('FBConnectedCloseProgress');
        this.addGroup( closeGroup );
    
        closeGroup.addSubItem( () => this.Hide(), 'close', false );
    
    }
}