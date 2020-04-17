'use strict';

import HoverMenu from '../wallwindow/hovermenu';
import { WallMenuButtonList, WallMenuTextList } from '../wallwindow/wallmenu';
import locale from '../utils/locale';
import { copyToClipboard } from '../utils/utils';
import accessController from '../infrastructure/AccessController';

/**
 * @extends HoverMenu
 * @property {Content} content
 */
export default class DisplayMenu extends HoverMenu {

    /**
     * 
     * @param {HTMLElement} parent 
     */
    constructor(parent) {
        super(parent.id + '-Menu', parent);

        this.wrapperElement.classList.add('mdMenu');
        this._locked = false;
        this._content = null;
        this.title = null;
        this.description = null;
        this.date = null;
        this.previousUri = '';
        this.previousUserUri = '';

        this.currentUrlButton = null;
        this.previousUrlButton = null;

        accessController.registerConsumer( this.name, this );
    }

    /**
     * 
     * @param {HTMLElement} element 
     * @param {string} text 
     */
    setElementTextAndDisplay(element, text) {
        element.style.display = text ? 'block' : 'none';
        element.innerText = text ? text : '';
    }

    /**
     * 
     * @param {HTMLElement} element 
     * @param {Date} date 
     */
    setElementDateAndDisplay(element, date) {
        const text = date ? locale.format( date ) : null;

        this.setElementTextAndDisplay(element, text);
    }

    /**
     * @returns {Content}
     */
    get content() {
        return this._content; 
    }
    set content(newContent) {
        this.previousUri = this._content ? this._content.originalUri : this.previousUri;
        this.previousUserUri = this._content ? this._content.userUri : this.previousUserUri;

        this._content = newContent;

        if ( this.hasLoaded ) {
            this.previousUrlButton.style.display = this.previousUri ? 'block' : 'none';
            this.currentUrlButton.style.display = this._content && this._content.userUri ? 'block' : 'none';

            if (this._content) {
                this.setElementTextAndDisplay( this.title, this._content.title );
                this.setElementTextAndDisplay( this.description, this._content.description );
                this.setElementDateAndDisplay( this.date, this._content.date );
            } else {
                this.setElementTextAndDisplay( this.title, null );
                this.setElementTextAndDisplay( this.description, null );
                this.setElementTextAndDisplay( this.date, null );
            }
        }
    }

    copyPath(path) {
        let uri = path;

        if ( /^file:\/\/\/[A-z]:/.test(uri)) {
            uri = decodeURIComponent( 
                uri 
            ).substr('file:///'.length)
                .replace(/\//g, '\\', );
        }
        copyToClipboard( 
            uri 
        );
    }

    copyCurrentPath() {
        this.copyPath( this._content.originalUri );
    }
    
    copyPreviousPath() {
        this.copyPath( this.previousUri );
    }

    copyCurrentUrl() {
        copyToClipboard(  this._content.userUri  );
    }
    
    copyPreviousUrl() {
        copyToClipboard(  this.previousUserUri );
    }

    /**
     * @returns {boolean}
     */
    get locked() {
        return this._locked; 
    }
    set locked(newLocked) {
        this._locked = newLocked;
    }

    /**
     * 
     * @param {number} state 
     */
    setLocked(state) {
        switch (state) {
            case 0: this.locked = false; break;
            case 1: this.locked = true; break;
            default:
                console.error('DisplayMenu.setLocked( ' + state + ') wrong state');
        }
    }

    /**
     * Create the menu.
     */
    onLoaded() {
        this.wrapperElement.classList.add('mdMenu');

        const newGroup = new WallMenuTextList( this.parent.id + '-Info');
        this.addGroup( newGroup );
        this.title = newGroup.addSubItem( 
            null, 
            'Title'
        );
        this.description = newGroup.addSubItem( 
            null, 
            'Description'
        );

        this.date = newGroup.addSubItem( 
            null, 
            'Date'
        );

        const buttonGroup = new WallMenuButtonList(this.parent.id + '-Actions');
        this.addGroup( buttonGroup );

        buttonGroup.addSubItem( () => this.copyCurrentPath(), 'clipboard', false );
        this.currentUrlButton = buttonGroup.addSubItem( () => this.copyCurrentUrl(), 'clipboard_url', false );
        buttonGroup.addSubItem( () => this.copyPreviousPath(), 'clipboard_prev', false );
        this.previousUrlButton = buttonGroup.addSubItem( () => this.copyPreviousUrl(), 'clipboard_url_prev', false );
        buttonGroup.addStateButton( newState => this.setLocked(newState), 'display_lock', 2, 0 );

        if (this._content) {
            this.content = this._content;
        }
    }

}