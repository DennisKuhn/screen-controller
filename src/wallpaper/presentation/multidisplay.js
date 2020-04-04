'use strict';

import { CreateAppend } from '../utils/utils';
import ToggleElements from './toggleelements';
import BackgroundTransition from './backgroundtransition';
import DisplayMenu from './displaymenu';

/**
 * One display in MultiShow, contains the background (bottom for gradient), foreground containing
 * element-1, element-2, element-3 for rotation, DisplayMenu and Logo.
 * For rotation: 1 is shown, 1 is prepared and 1 is waiting for disposale, e.g. during transition (out), e.g.:
 * 1.) Element1 Showing,    Element2 disposing, Element3 preparing
 * 2.) Element1 Disposing,  Element2 preparing, Element3 Showing
 * 3.) Element1 preparing,  Element2 Showing,   Element3 Disposing
 */
export default class MultiDisplay {

    /**
     * 
     * @param {HTMLElement} root 
     * @param {number} iColumn 
     * @param {number} iRow 
     * @param {number} width
     * @param {number} height
     */
    constructor(root, iColumn, iRow, width, height) {
        this.root = root;
        this.cellWidth = width;
        this.cellHeight = height;

        this.wrapper = CreateAppend('div', this.root, this.constructor.name + '-' + iColumn + '' + iRow  );
        this.wrapper.style.position = 'fixed';
        this.wrapper.style.width = this.cellWidth + 'px';
        this.wrapper.style.height = this.cellHeight + 'px';

        this.wrapper.style.left = (this.cellWidth * iColumn) + 'px';
        this.wrapper.style.top = (this.cellHeight * iRow) + 'px';
        this.wrapper.style.clipPath =  'inset(0px)'; // overflow:hidden did not seem to work for animations

        /// Used for gradient
        this.background = CreateAppend('div', this.wrapper, this.constructor.name + '-' + iColumn + '' + iRow + '-Background' );
        /// Wrapper for content, used to set opacity (setContentStyle)
        this.foreground = CreateAppend('div', this.wrapper, this.constructor.name + '-' + iColumn + '' + iRow + '-Foreground' );

        this.element1 = CreateAppend('div', this.foreground, this.constructor.name + '-' + iColumn + '' + iRow + '-1' );
        this.element2 = CreateAppend('div', this.foreground, this.constructor.name + '-' + iColumn + '' + iRow + '-2' );
        this.element3 = CreateAppend('div', this.foreground, this.constructor.name + '-' + iColumn + '' + iRow + '-3' );

        [this.background, this.foreground, this.element1, this.element2, this.element3].forEach( element => {
            element.style.display = 'none';
            element.style.position = 'absolute';
            element.style.left = '0';
            element.style.top = '0';
            element.style.width = this.cellWidth + 'px';
            element.style.height = this.cellHeight + 'px';
        });
        [this.background, this.foreground].forEach( element => {
            element.style.display = 'block';
        });

        /**
         * @type {ToggleElements}
         */
        this.preps = new ToggleElements(this.element1 );
        /**
         * @type {ToggleElements}
         */
        this.shows = new ToggleElements(this.element2 );
        /**
         * @type {ToggleElements}
         */
        this.temps = new ToggleElements(this.element3 );
        this.transition = new BackgroundTransition( this.element1, this.element2, this.element3 );
        
        this.info = new DisplayMenu(this.wrapper);

        this.logo = new Image();
        this.wrapper.appendChild(this.logo);
        this.logo.classList.add('MultiDisplaySupplierLogo');


        this.inTransition = false; 
    }

    
    setContentStyle( style, value) {
        this.foreground.style[style] = value;
    }

    /**
     * @returns {boolean}
     */
    get locked() {
        return this.info.locked; 
    }
}