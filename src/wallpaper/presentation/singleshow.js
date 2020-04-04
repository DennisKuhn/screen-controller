'use strict';

import ContentShow from './contentshow';
import { CreateAppend } from '../utils/utils';
import BackgroundTransition from './backgroundtransition';
import BackgroundGradient from './backgroundgradient';

/**
 * @extends ContentShow
 */
export default class SingleShow extends ContentShow {
    /**
     * @param {HTMLElement} wrapper 
     */
    constructor(wrapper) {
        super(wrapper);

        const element1 = CreateAppend('div', this.root, this.constructor.name + '-1');
        const element2 = CreateAppend('div', this.root, this.constructor.name + '-2');

        [element1, element2].forEach(element => {
            element.style.position = 'absolute';
            element.style.width = '100%';
            element.style.height = '100%';
            element.style.top = 0;
            element.style.left = 0;
        });

        this.transition = new BackgroundTransition(element1, element2, null);

        this.preps = new ToggleElements(element1);
        this.shows = new ToggleElements(element2);

        this.gradient = new BackgroundGradient();

        this.shownContent = null;
    }


    initCss() {
        [this.preps, this.shows].forEach(elements => {
            const css = {
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: this.size,
                backgroundBlendMode: this.blend
            };
            for (const i in css) {
                elements.containerElement.style[i] = css[i];
            }
        }
        );
    }

    getCurrentImagePath() {
        return this.shows.content.originalUri;
    }

    getPreviousImagePath() {
        return this.shownContent.originalUri;
    }

    /**
	 * Pause the slideshow
	 * @function
     * @instance
	 **/
    pause() {
        // console.log("SingleShow.pause()");
        super.pause();
        this.shows.content.stop();
    }

    init() {
        // console.log("SingleShow.init()" );
        this.initCss();
        conSup.supply().then(
            newContent => {
                // console.log("SingleShow.init(): newContent this=" + this + " self=" + self );
                this.setNextContent(newContent);
                this.startInterval();
                this.swapPrepAndShow().then(() => this.getAndSetNewContent());
            }
        );
    }

    getAndSetNewContent() {
        //		conSup.supply().then( newContent => this.setNextContent(newContent) );
        conSup.supply().then(newContent => {
            this.setNextContent(newContent); 
        });
    }

    onInterval() {
        //console.log( "SingleShow.onInterval()" );
        this.swapPrepAndShow().then(newContent => {
            this.getAndSetNewContent(newContent); 
        });
    }



    /**
	 * Will get a new image to show and apply it
	 * @function
     * @instance
	 **/
    next() {
        // console.log("SingleShow.next()");
        super.next();
        this.swapPrepAndShow().then(() => this.getAndSetNewContent());
    }


    flush() {
        super.flush();

        conSup.supply().then(
            newContent => {
                // console.log("Background.init(): newContent this=" + this + " self=" + self );
                this.setNextContent(newContent);
                this.startInterval();
                this.swapPrepAndShow().then(() => this.getAndSetNewContent());
            }
        );
    }

    swapPrepAndShow() {
        return new Promise((resolve, reject) => {
            this.shownContent = this.shows.content;

            const tmp = this.shows;

            this.shows = this.preps;
            this.preps = tmp;

            this.shows.content.start();

            this.updateContentInfo(this.shows.content);

            if (this.useTransitions) {
                let animIdx = Math.floor(Math.random() * this.animations.length);
                if (this.lastAddedAnimation) {
                    const animIdx2 = this.getAnimationIndex(this.lastAddedAnimation[0], this.lastAddedAnimation[1]);
                    if (animIdx2 != -1) {
                        animIdx = animIdx2; 
                    }
                    this.lastAddedAnimation = null;
                }

                this.transition.start(this.animations[animIdx][0], this.animations[animIdx][1], this.transitionDuration, () => {
                    if (this.preps.content) {
                        this.preps.content.freeResources();
                        this.preps.content = null;
                    }
                    resolve();
                });
            } else {
                this.shows.visible = true;
                this.preps.visible = false;
                if (this.preps.content) {
                    this.preps.content.freeResources();
                    this.preps.content = null;
                }
                resolve();
            }

        });
    }

    /**
	 * 
	 * @param {Content} newContent 
	 */
    updateContentInfo(newContent) {
        this.previousImagePath = this.currentImagePath;
        if (newContent) {
            this.currentImagePath = newContent.uri;
            document.getElementById('backgroundInfoText1').textContent = newContent.description;
            document.getElementById('backgroundInfoText2').textContent = newContent.title;
        } else {
            this.currentImagePath = '';
            document.getElementById('backgroundInfoText1').textContent = '';
            document.getElementById('backgroundInfoText2').textContent = '';
        }
    }

    /**
	 * Show selected content
	 * @function
     * @instance
     * @param {Content} content to load
	 **/
    setNextContent(content) {
        this.preps.content = content;
        this.preps.containerElement.background = this.gradient.getCssValue();
    }
}
