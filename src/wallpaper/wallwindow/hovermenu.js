'use strict';

import Wallmenu from './wallmenu';

const wmHOVER_MENU_ID = 'HoverMenu';

/**
 * @extends Wallmenu
 */
export default class HoverMenu extends Wallmenu {

    /**
     * 
     * @param {string} name
     * @param {HTMLElement} parent 
     */
    constructor(name, parent) {
        super( name, parent);

        this.Create();
    }

    Create() {
        super.Create();

        this.wrapperElement.onmouseenter = () => this.Show();
        this.wrapperElement.onmouseleave = () => {
            if ( this.shown ) this.Hide(); 
        };
    }

    /**
     * 
     * @param {boolean} enable 
     */
    setEnabled(enable) {
        const enableChanged = enable != this.enabled;

        super.setEnabled(enable);
        // console.log("HoverMenu[" + this.name +"].setEnabled(" + enable + ") enableChanged=" + enableChanged + " enabled=" + this.enabled);
        if (enableChanged) {
            this.wrapperElement.style.display = this.enabled ? 'block' : 'none';
        }
    }

    Show() {
        // console.log("HoverMenu[" [ this.constructor.name, this.name ] +"].Show()");
        super.Show();
        this.contentElement.style.visibility = 'visible'; 
    }

    Hide() {
        // console.log("HoverMenu[" + this.name +"].Hide()");
        this.contentElement.style.visibility = 'hidden';
        super.Hide();
    }

}

