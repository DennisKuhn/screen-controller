/**
 * Contains Elements used for toggling preparation view and display view
 */
export default class ToggleElements {
    /**
	 * 
	 * @param {HTMLElement} container 
	 */
    constructor(container) {	
        /**
		 * @type {Content}
		 */	
        this._content = null;
        this._visible = false;
        /**
		 * @type {HTMLElement}
		 */
        this.contentElement = null;
        this.containerElement = container;
    }

    /**
	 * @returns {Content}
	 */
    get content() {
        return this._content; 
    }
    set content( newContent ) {
        this._content = newContent;

        if (this._content) {
            if (this.contentElement) {
                this.containerElement.replaceChild(newContent.element, this.contentElement);
            } else {
                this.containerElement.appendChild(newContent.element);
            }
            this.contentElement = newContent.element;
            this._content.attach();
        } else { 
            if (this.contentElement) {
                this.contentElement.style.display = 'none';
                this.containerElement.removeChild(this.contentElement);
                this.contentElement = null;
            }
        }
    }

    get visible() {
        return this._visible; 
    }
    set visible(show) {
        this.containerElement.style.display = show ? 'block' : 'none';
    }
}
