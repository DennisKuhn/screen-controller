'use strict';

import { PopupMenu, WallMenuButtonList, WallMenuTextList } from '../wallwindow/wallmenu';
import fbCon from './facebookconnector';

/**
 * @extends PopupMenu
 */
export default class FacebookDisconnectedPopup extends PopupMenu {

    /**
     * 
     */
    constructor() {
        super('FacebookDisconnectedPopup');
    }


    onLoaded() {
        const logoGroup = new WallMenuButtonList('FBDisconnectedImages');
        this.addGroup( logoGroup );
    
        logoGroup.addImageButton( null, 'connectors/fb_logo.png', 'FBDisconnectedLogo', false );

        const descriptionGroup = new WallMenuTextList('FBDisconnectedDescripton');
        this.addGroup( descriptionGroup );
    
        descriptionGroup.addSubItem( 
            null, 
            'You have been disconnected'
        );
    
        const closeConnectGroup = new WallMenuButtonList('FBDisconnectedCloseConnect');
        this.addGroup( closeConnectGroup );
    
        closeConnectGroup.addSubItem( () => this.Hide(), 'close', false );

        this.facebookConnectionButton = closeConnectGroup.addStateButton( newConnectState => this.onConnectButtonStateChange(newConnectState), 'connection_facebook', 2, fbCon.isConnected ? 0 : 1 );
    }

    onConnectButtonStateChange(newConnectState) {
        // console.log( this.constructor.name + ".onNewConnectState(" + newConnectState + ")");
        switch (newConnectState) {
            case 0: // connected
                if ( !fbCon.isConnected) {
                    this.Hide();
                    fbCon.connect();
                } else {
                    console.error(this.constructor.name + '.onNewConnectState(' + newConnectState + '): already connected');
                }
                break;
            case 1: // disconnected
                console.error(this.constructor.name + '.onNewConnectState(' + newConnectState + '): disconnect ?');
                break;
        }
    }
}