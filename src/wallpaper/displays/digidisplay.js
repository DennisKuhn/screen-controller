'use strict';

require('./digidisplay.css');


/**
 * Base class for Digital displays like DigiTime and DigiDate. Handles visibility, positioning and sizing.
 */
export default class DigiDisplay {
    constructor(displayName) {
        this.name = displayName;
        this.wrapper = document.createElement('div');
        this.wrapper.id = this.name;
        document.body.appendChild(this.wrapper);

        this.wrapperInner = document.createElement('div');
        this.wrapperInner.id = this.name + 'label';
        this.wrapper.appendChild(this.wrapperInner);

        this.visi = true;

        this.scale = 1;
        this.ox = 0;
        this.oy = 0;
    }

    show() {
        this.wrapper.style.display = 'block';
        this.visi = true; 
    }

    hide() {
        this.wrapper.style.display = 'none'; 
        this.visi = false; 
    }

    /**
     * @returns {boolean}
     */
    get Visible() {
        return this.visi; 
    }
    /**
     * @param {boolean} visible
     */
    set Visible(visible) { 
        // console.log(this.constructor.name + ".Visible " + this.visi + " -> " + visible );
        if (this.visi != visible) {
            this.visi = visible;

            if (this.visi) {
                this.show();
            } else {
                this.hide();
            }
        }
    }

    setHue(newHue) {
        // console.log('DigiDisplay.setHue(' + newHue + ')');
        this.wrapperInner.style.textShadow = '0 0 5px hsl('+newHue+',100%,50%)';
    }

    get Size() {
        return (this.scale * 100) / 5; 
    }
    set Size(newSize) {
        this.setScale( 5*(newSize / 100) ); 
    }
 
    /**
     * 
     * @param {number} s 
     */
    setScale(s) {
        // console.log('DigiDisplay.setScale(' + s + ')');
        this.scale = s;
        this.wrapper.style.transformOrigin = '50% 50%';
        this.wrapper.style.transform = 'translate( ' + this.ox + 'px, ' + this.oy + 'px ) scale(' + (this.scale) + ' )';
    }


    /**
     * @returns {number}
     */
    get OffsetX() {
        return this.ox; 
    }
    set OffsetX(offset) { 
        this.ox = offset; 
        this.setPosition();
    }

    /**
     * @returns {number}
     */
    get OffsetY() {
        return this.oy; 
    }
    set OffsetY(offset) { 
        this.oy = offset; 
        this.setPosition();
    }

    setPosition() {
        // console.log('DigiDisplay.setPosition(' + x + ', ' + y + ')');
        this.wrapper.style.transformOrigin = '50% 50%';
        this.wrapper.style.transform = 'translate( ' + this.ox + 'px, ' + this.oy + 'px ) scale(' + (this.scale) + ' )';
    }
}
