import ContentShow from './contentshow';
import BackgroundGradient from './backgroundgradient';
import MultiDisplay from './multidisplay';
import conSup from '../production/contentsupplier';

/**
 * @extends ContentShow
 */
export default class MultiShow extends ContentShow {
    /**
     * @param {HTMLElement} wrapper 
     */
    constructor(wrapper) {
        super(wrapper);

        this._width = window.innerWidth;
        this._height = window.innerHeight;
        this._size = null;

        // console.log(`${this.constructor.name}.constructor(): ${this._width}x${this._height}`);

        this.root.style.display = 'flex';
        this.root.style.flexWrap = 'wrap';

        this._columns = 2;
        this._rows = 2;
        this.count = this.columns * this.rows;

        this.iActive = 0;
        this.active = null;
        this.startCount = this.count;
        this.displays = [];

        this.cellWidth = this._width / this.columns;
        this.cellHeight = this._height / this.rows;

        this.gradient = new BackgroundGradient();
    }

    createDisplays() {
        console.log(`${this.constructor.name}.createDisplays(): ${this._width}x${this._height}`);
        this.displays.length = 0;

        /// Remove existing displays from DOM
        while (this.root.firstChild) {
            this.root.firstChild.remove();
        }
        this.cellWidth = this._width / this.columns;
        this.cellHeight = this._height / this.rows;

        for (let iRow = 0; iRow < this._rows; iRow++) {
            for (let iColumn = 0; iColumn < this._columns; iColumn++) {
                const newDisplay = new MultiDisplay(this.root, iColumn, iRow, this.cellWidth, this.cellHeight);
                this.displays.push(newDisplay);
                newDisplay.setContentStyle('opacity', this._opacity);
            }
        }
        this.iActive = 0;
        this.active = this.displays[this.iActive];
        conSup.setSize(this.cellWidth, this.cellHeight);
    }

    get opacity() {
        return super.opacity; 
    }
    set opacity(newOpacity) {
        super.opacity = newOpacity;

        this.displays.forEach(display => {
            display.setContentStyle('opacity', this._opacity);
        });
    }

    get volume() {
        return super.volume; 
    }
    set volume(newVolume) {
        super.volume = newVolume;
        this.displays.forEach(display => {
            if (display.shows.content) {
                display.shows.content.volume = this._volume;
            }

            if (display.preps.content) {
                display.preps.content.volume = this._volume;
            }
        });
    }


    /**
	 * @returns {number}
	 */
    get columns() {
        return this._columns; 
    }
    set columns(newColumns) {
        if (this._columns != newColumns) {
            this.stopInterval();
            this._columns = newColumns;
            this.count = this.columns * this.rows;
            if (this.displays.length) {
                this.createDisplays();
                this.fill();
            }
        }
    }

    /**
	 * @returns {number}
	 */
    get rows() {
        return this._rows; 
    }
    set rows(newRows) {
        if (this._rows != newRows) {
            this.stopInterval();
            this._rows = newRows;
            this.count = this.columns * this.rows;
            if (this.displays.length) {
                this.createDisplays();
                this.fill();
            }
        }
    }

    /**
	 * @returns {number}
	 */
    get height() {
        return this._height; 
    }
    set height(newHeight) {
        this._height = newHeight; 
    }

    /**
	 * @returns {number}
	 */
    get width() {
        return this._width; 
    }
    set width(newWidth) {
        this._width = newWidth; 
    }

    get size() {
        return this._size; 
    }
    set size(newSize) {
        // console.log(`${this.constructor.name}.size=${newSize.width}x${newSize.height} ${this._size}`, newSize);
        if (newSize.width && newSize.height) {
            if ((this._width != newSize.width) || (this._height != newSize.height) || (this._size == null)) {
                this.width = newSize.width;
                this.height = newSize.height;
                this._size = newSize;
            }
        }
    }

    initCss() {
        // let css = {
        // 	'backgroundBlendMode': this.blend
        // };
        // this.displays.forEach( display => [display.preps, display.shows].forEach( elements => {
        // 	for( var i in css ) {
        // 		elements.containerElement.style[i] = css[ i ];
        // 	}
        // }
        // ));
    }

    getCurrentImagePath() {
        return this.shows.content.originalUri;
    }

    getPreviousImagePath() {
        return this.shownContent.originalUri;
    }

    play() {
        // console.log("MultiShow.play()");
        super.play();

        this.displays.forEach(display => {
            if (display.shows.content) display.shows.content.start(); 
        });
    }

    /**
	 * Pause the slideshow
	 **/
    pause() {
        // console.log("MultiShow.pause()");
        super.pause();

        this.displays.forEach(display => {
            if (display.shows.content) display.shows.content.stop(); 
        });
    }

    init() {
        console.log('MultiShow.init()');

        this.createDisplays();
        this.initCss();
        this.fill();
    }

    clearPreps(display) {
        if (display.preps.content) {
            // console.log("MultiShow.clearPreps(" + display.preps.containerElement.id + ")");
            const content = display.preps.content;
            display.preps.content = null;
            content.freeResources();
        } else {
            console.error('MultiShow.clearPreps(' + display.preps.containerElement.id + ') no content');
        }
    }


    fill() {
        const usedTransition = this.useTransitions;
        this.useTransitions = false;

        this.displays.forEach((display, index) =>
            conSup.supply().then(
                newContent => {
                    // console.log( "MultiShow.init(): newContent(" + this.startCount + ")" );
                    this.setNextContent(display, newContent);
                    this.iActive = index;
                    this.active = display;
                    this.swapPrepAndShow();
                    if ((this.displays.length - 1) == index) {
                        this.useTransitions = usedTransition;
                        this.startInterval();
                    }
                }
            )
        );
    }

    /**
	 * 
	 * @param {MultiDisplay} display 
	 */
    getAndSetNewContent(display) {
        conSup.supply().then(newContent => {
            this.setNextContent(display, newContent); 
        });
    }

    setNextDisplay() {
        this.active = null;

        // Find next not locked display, if any
        let iDisplay = this.iActive;
        do {
            iDisplay = (iDisplay + 1) % this.count;
            if (!this.displays[iDisplay].locked) {
                this.iActive = iDisplay;
                this.active = this.displays[iDisplay];
                break;
            }
        }
        while (iDisplay != this.iActive);

        if (this.active) {
            this.swapPrepAndShow();
        } else {
            // console.log("MultiShow.setNextDisplay(): all displays locked")
        }

    }

    onInterval() {
        // console.log( "MultiShow[" + this.iActive + "/" + this.count + "].onInterval()" );
        this.setNextDisplay();
    }

    /**
	 * Will get a new image to show and apply it
	 **/
    next() {
        // console.log("MultiShow.next()");
        super.next();

        this.setNextDisplay();
    }


    flush() {
        super.flush();
        this.displays.forEach(display => this.clearPreps(display));
        this.fill();
    }

    /**
	 * 
	 * @param {MultiDisplay} display 
	 */
    clearTemps(display) {
        if (display.temps.content) {
            //  console.log("MultiShow.clearTemps(" + display.temps.containerElement.id + ")");
            const content = display.temps.content;
            display.temps.content = null;
            content.freeResources();
        } else {
            console.error('MultiShow.clearTemps(' + display.temps.containerElement.id + ') no content');
        }
    }

    swapPrepAndShow() {
        /**
		 * @type {MultiDisplay}
		 */
        const display = this.active;

        if (display.transition.inTransition) {
            // console.log("MultiShow.swapPrepAndShow: In transition");
            display.transition.stop();
        }
        if (display.temps.content) {
            console.error('MultiShow.swapPrepAndShow: display.temps has content');
        }
        const tmp = display.shows;

        display.shows = display.preps;
        display.preps = display.temps;
        display.temps = tmp;

        display.shows.content.start();
        display.info.content = null;
        display.logo.style.visibility = 'hidden';
        display.logo.src = display.shows.content.producer.logo;

        // console.log("swapPrepAndShow: " + display.preps.containerElement.id + " - " + display.shows.containerElement.id);			

        if (this.useTransitions && display.temps.content) {
            let animIdx = Math.floor(Math.random() * this.animations.length);
            if (this.lastAddedAnimation) {
                const animIdx2 = this.getAnimationIndex(this.lastAddedAnimation[0], this.lastAddedAnimation[1]);
                if (animIdx2 != -1) {
                    animIdx = animIdx2; 
                }
                this.lastAddedAnimation = null;
            }

            display.transition.start(
                display.temps.containerElement,
                display.shows.containerElement,
                this.animations[animIdx][0],
                this.animations[animIdx][1],
                this.transitionDuration,
                () => this.clearTemps(display)
            );
        } else {
            display.shows.visible = true;
            display.temps.visible = false;

            if (display.temps.content) {
                this.clearTemps(display);
            } else {
                // console.log("MultiShow.swapPrepAndShow: starting=" + this.iActive);
            }
        }
        display.logo.style.visibility = 'visible';
        display.info.content = display.shows.content;

        setTimeout(() => this.getAndSetNewContent(display), 1);
    }


    /**
	 * Sets preps content
	 * @param {MultiDisplay} display
     * @param {Content} content to load
	 **/
    setNextContent(display, content) {
        // console.log("setNextContent:" + display.preps.containerElement.id);
        display.preps.content = content;
        if (display.preps.content.element.width)
            display.preps.content.element.setAttribute('width', this.cellWidth + 'px');
        if (display.preps.content.element.height)
            display.preps.content.element.setAttribute('height', this.cellHeight + 'px');

        display.preps.content.volume = this._volume;

        display.background.style.background = this.gradient.getCssValue();
    }
}
