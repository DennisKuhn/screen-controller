'use strict';
/**
 * Shows an Image handles rotation, offset and scaling.
 */
export default class Foreground {
    constructor() {
        this.element = document.getElementById( 'foreground-image' );
        this._rotation = 0;
        this._offsetX = 0;
        this._offsetY = 0;
        this._scale = 0;
        this._image = null;
        this._systemwidth = 0;
        this._systemheight = 0;

        this.element.style.display = 'none';

        this.element.onerror = () => { 
            this.element.style.display = 'none'; 
        };

        this.element.onload = () => { 
            this.element.style.display = 'block'; 
            this.updateForegroundElement();
        };
    }

    updateForegroundElement() {
        // console.log("updateForegroundElement " + [canvas.width, canvas.height] + " " + [fgElement.width, fgElement.height]);
        const px = this._systemwidth / 2 + this._offsetX - this.element.width/2;
        const py = this._systemheight / 2 + this._offsetY - this.element.height/2;
        this.element.style.transform = 'translate( '+ px +'px,'+ py + 'px) rotate('+ -this._rotation +'deg) scale('+ (this._scale/100) +')'; 
    }


    /**
     * @returns {number}
     */
    get systemheight() {
        return this._systemheight; 
    }
    set systemheight(newheight) {
        this._systemheight = newheight; this.updateForegroundElement(); 
    }

    /**
     * @returns {number}
     */
    get systemwidth() {
        return this._systemwidth; 
    }
    set systemwidth(newwidth) {
        this._systemwidth = newwidth; this.updateForegroundElement(); 
    }

    /**
     * @returns {number}
     */
    get rotation() {
        return this._rotation; 
    }
    set rotation(newRotation) {
        this._rotation = newRotation; this.updateForegroundElement(); 
    }

    /**
     * @returns {number}
     */
    get offsetX() {
        return this._offsetX; 
    }
    set offsetX(newOffset) {
        this._offsetX = newOffset; this.updateForegroundElement(); 
    }

    /**
     * @returns {number}
     */
    get offsetY() {
        return this._offsetY; 
    }
    set offsetY(newOffset) {
        this._offsetY = newOffset; this.updateForegroundElement(); 
    }

    /**
     * @returns {number}
     */
    get scale() {
        return this._scale; 
    }
    set scale(newScale) {
        this._scale = newScale; this.updateForegroundElement(); 
    }

    /**
     * @returns {string}
     */
    get image() {
        return this._image; 
    }
    set image(newImage) { 
        // console.log("Foreground.set image=" + newImage);
        this._image = newImage; 
        this.element.src = this._image ? 'file:///' + this._image : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
        this.updateForegroundElement();
    }
}
