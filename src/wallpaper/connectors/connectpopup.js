'use strict';
import { PopupMenu, WallMenuButtonList, WallMenuList, WallMenuTextList } from '../wallwindow/wallmenu';
import { copyToClipboard } from '../utils/utils';

/**
 * @extends PopupMenu
 */
export default class FacebookConnectPopup extends PopupMenu {

    /**
     * 
     * @param {string} userCode displayed to user to be entered at userUrl
     * @param {string} userUrl displayed to the user, facebook.com/device
     * @param {string} fullUrl copied to cplipboard, contains userCode
     * @param {Date} expiry time to verify 
     * @param {Date} start time of the verification process
     */
    constructor(userCode, userUrl, fullUrl, expiry, start) {
        super('FacebookConnectPopup');
        
        this._userCode = userCode;
        this._userUrl = userUrl;
        this._fullUrl = fullUrl;
        this._expiry = expiry;
        this._start = start;
        this._spanValue = this._expiry.getTime() - this._start.getTime();
        this._remaining = null;

        this._progressInterval = 0;
    }

    /**
     * 
     * @param {string} userCode displayed to user to be entered at userUrl
     * @param {string} userUrl displayed to the user, facebook.com/device
     * @param {string} fullUrl copied to cplipboard, contains userCode
     * @param {Date} expiry time to verify 
     * @param {Date} start time of the verification process
     */
    reuse(userCode, userUrl, fullUrl, expiry, start) {
        this._userCode = userCode;
        this._userUrl = userUrl;
        this._fullUrl = fullUrl;
        this._expiry = expiry;
        this._start = start;
        this._spanValue = this._expiry.getTime() - this._start.getTime();
        this._remaining.setProgress(0);
        this._progressInterval = setInterval( () => this.updateProgress(), 200);
    }

    onLoaded() {
        const descriptionGroup = new WallMenuTextList('FBConnectDescripton');
        this.addGroup( descriptionGroup );
    
        descriptionGroup.addSubItem( 
            null, 
            'Please choose one of the options to connect:'
        );
    
        const optionsGroup = new WallMenuList('FBConnectOptions');
        this.addGroup( optionsGroup );

        const copyFullUrlOption = optionsGroup.addSubItem( 
            'FBConnectOptionCopy', 
            'Copy verificaton URL (button),', 
            () => copyToClipboard(this._fullUrl),
            'clipboard_url', false
        );
        copyFullUrlOption.updateDescription('paste (Ctrl+C) in your browser');

        const copyCodeOption = optionsGroup.addSubItem( 
            'FBConnectOptionCopy', 
            'Enter ' + this._userCode, 
            () => copyToClipboard(this._userCode),
            'clipboard_code', false
        );
        copyCodeOption.updateDescription('at ' + this._userUrl);

        const closeRemainingGroup = new WallMenuButtonList('FBConnectCloseProgress');
        this.addGroup( closeRemainingGroup );
    
        closeRemainingGroup.addSubItem( () => this.Hide(), 'close', false );
            
        this._remaining = descriptionGroup.addProgressButton('FBConnectRemaining');
        this._remaining.setColor('red', 'green');
        this._remaining.setProgress(0);
        this._progressInterval = setInterval( () => this.updateProgress(), 200);
    }

    updateProgress() {
        const nowValue = Date.now();
        const progressValue = nowValue - this._start.getTime();
        const progress = progressValue / this._spanValue;
        const remaining = 1 - progress;
        this._remaining.setProgress( progress );
        this._remaining.setColor( 'RGB(' + (255 * (0.2 + (0.8*progress))).toFixed(0) + ',0,0)', 'RGB(0,' + (255 * (0.2 + (0.6*remaining))).toFixed(0) + ',0)');
    }

    Hide() {
        super.Hide();
        clearInterval(this._progressInterval);
        this._progressInterval = 0;
    }
}