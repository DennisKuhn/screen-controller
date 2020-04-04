'use strict';

require('./wallmenu.css');

/**
 * 
 */
export default class WallWindow {
    constructor(name, parent) {
        this.name = name;
        this.onHide = null;
        this.onShow = null;
        this.enabled = true;
        this.shown = false;
        this.parent = parent ? parent : document.body;
    }

    setEnabled(enable) {
        // console.log("WallWindow(" +this.name + ").setEnabled(" + enable + ")");
        if (this.enabled != enable) {
            this.enabled = enable;

            if (this.enabled) {
            } else {
            }
        }
    }

    /**
     * @returns {() => void}
     */
    get OnShow() {
        return this.onShow;
    }

    set OnShow(cbOnShow ) {
        this.onShow = cbOnShow;
    }

    /**
     * @returns {() => void}
     */
    get OnHide() {
        return this.onHide;
    }

    set OnHide( cbOnHide ) {
        this.onHide = cbOnHide;
    }

    Create() {
        console.error(this.constructor.name + ': You have to implement WallWindow.Create()');
        // throw new Error('You have to implement WallWindow.Create()');
    }

    Show() {
        // console.log("WallWindow[" + this.constructor.name + ", "  + this.name + "].Show()");
        if ( this.onShow ) {
            this.onShow();
        } else {
            // console.warn( 'WallWindow[' + this.constructor.name + ", "  + this.name + '].Show: no onShow');    
        }
        this.shown = true;
    }

    Hide() {
        // console.log("WallWindow[" + this.name + "].Hide()");
        if ( this.onHide ) {
            this.onHide();
        } else {
            // console.warn( 'WallWindow[' + this.constructor.name + ", "  + this.name + '].Hide: no onHide');    
        }
        this.shown = false;
    }

    /**
     * 
     * @param {string} elementName like div
     * @param {HTMLElement} parent 
     * @param {string} id 
     * @param {string} styleclass 
     */
    CreateAppend(elementName, parent, id, styleclass) {
        const newElement = document.createElement(elementName);
        parent.appendChild(newElement);

        if (id) {
            newElement.id = id;
        }
        if (styleclass) {
            newElement.classList.add( styleclass );
        }
        return newElement;
    }

}
