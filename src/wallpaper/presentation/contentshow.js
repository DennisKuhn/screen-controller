'use strict';

import conSup from '../production/contentsupplier';

require('./background-anim.css');
require('./background.css');

/**
 * Base for displaying content, e.g. images/videos.
 */
export default class ContentShow {	
    constructor( wrapper ) {
        this.root = wrapper;

        this._paused = false;
        this._interval = 5000;
        this._intervalMultiply = 1;
		
        this._intervalHandle = null;
        
        this.transition = null;
        this._useTransitions = false;
        this._transitionDuration = 1;

        this._transitionFade = true;
        this._transitionZoomIn = true;
        this._transitionZoomOut = true;
        this._transitionZoomHorzIn = true;
        this._transitionZoomHorzOut = true;
        this._transitionZoomVertIn = true;
        this._transitionZoomVertOut = true;
        this._transitionMoveLeft = true;
        this._transitionMoveRight = true;
        this._transitionMoveTop = true;
        this._transitionMoveBottom = true;
        this._transitionShuffleLeft = true;
        this._transitionShuffleRight = true;
        this._transitionShuffleTop = true;
        this._transitionShuffleBottom = true;

        this._size = 'cover';
        this._opacity = 1;
        this._blur = 0;
        this._blend = 'normal';
        this._volume = 0;

        this.animations = [
            [ 'bg-move-in-from-left', 'bg-move-out-from-left' ],
            [ 'bg-move-in-from-right', 'bg-move-out-from-right' ],
            [ 'bg-move-in-from-top', 'bg-move-out-from-top' ],
            [ 'bg-move-in-from-bottom', 'bg-move-out-from-bottom' ],
            [ 'bg-shuffle-in-from-left', 'bg-shuffle-out-from-left' ],
            [ 'bg-shuffle-in-from-right', 'bg-shuffle-out-from-right' ],
            [ 'bg-shuffle-in-from-top', 'bg-shuffle-out-from-top' ],
            [ 'bg-shuffle-in-from-bottom', 'bg-shuffle-out-from-bottom' ],
            [ 'bg-fade-in-in', 'bg-fade-in-out' ],
            [ 'bg-zoom-in-in', 'bg-zoom-in-out' ],
            [ 'bg-zoom-out-in', 'bg-zoom-out-out' ],
            [ 'bg-horz-zoom-in-in', 'bg-horz-zoom-in-out' ],
            [ 'bg-horz-zoom-out-in', 'bg-horz-zoom-out-out' ],
            [ 'bg-vert-zoom-in-in', 'bg-vert-zoom-in-out' ],
            [ 'bg-vert-zoom-out-in', 'bg-vert-zoom-out-out' ]
        ];
        
        this.lastAddedAnimation = null;
    }


    /**
     * @returns {boolean}
     */
    get transitionFade() {
        return this._transitionFade; 
    }
    set transitionFade(newtransitionFade) {
        if (newtransitionFade != this._transitionFade) {
            this._transitionFade = newtransitionFade;
            if (this._transitionFade) {
                this.addAnimation( 'bg-fade-in-in', 'bg-fade-in-out' );
            } else {
                this.removeAnimation( 'bg-fade-in-in', 'bg-fade-in-out' );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get transitionZoomIn() {
        return this._transitionZoomIn; 
    }
    set transitionZoomIn(newtransitionZoomIn) {
        if (newtransitionZoomIn != this._transitionZoomIn) {
            this._transitionZoomIn = newtransitionZoomIn;
            if (this._transitionZoomIn) {
                this.addAnimation( 'bg-zoom-in-in', 'bg-zoom-in-out' );
            } else {
                this.removeAnimation( 'bg-zoom-in-in', 'bg-zoom-in-out' );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get transitionZoomOut() {
        return this._transitionZoomOut; 
    }
    set transitionZoomOut(newtransitionZoomOut) {
        if (newtransitionZoomOut != this._transitionZoomOut) {
            this._transitionZoomOut = newtransitionZoomOut;
            if (this._transitionZoomOut) {
                this.addAnimation( 'bg-zoom-out-in', 'bg-zoom-out-out' );
            } else {
                this.removeAnimation( 'bg-zoom-out-in', 'bg-zoom-out-out' );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get transitionZoomHorzIn() {
        return this._transitionZoomHorzIn; 
    }
    set transitionZoomHorzIn(newtransitionZoomHorzIn) {
        if (newtransitionZoomHorzIn != this._transitionZoomHorzIn) {
            this._transitionZoomHorzIn = newtransitionZoomHorzIn;
            if (this._transitionZoomHorzIn) {
                this.addAnimation( 'bg-horz-zoom-in-in', 'bg-horz-zoom-in-out' );
            } else {
                this.removeAnimation( 'bg-horz-zoom-in-in', 'bg-horz-zoom-in-out' );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get transitionZoomHorzOut() {
        return this._transitionZoomHorzOut; 
    }
    set transitionZoomHorzOut(newtransitionZoomHorzOut) {
        if (newtransitionZoomHorzOut != this._transitionZoomHorzOut) {
            this._transitionZoomHorzOut = newtransitionZoomHorzOut;
            if (this._transitionZoomHorzOut) {
                this.addAnimation('bg-horz-zoom-out-in', 'bg-horz-zoom-out-out' );
            } else {
                this.removeAnimation( 'bg-horz-zoom-out-in', 'bg-horz-zoom-out-out' );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get transitionZoomVertIn() {
        return this._transitionZoomVertIn; 
    }
    set transitionZoomVertIn(newtransitionZoomVertIn) {
        if (newtransitionZoomVertIn != this._transitionZoomVertIn) {
            this._transitionZoomVertIn = newtransitionZoomVertIn;
            if (this._transitionZoomVertIn) {
                this.addAnimation( 'bg-vert-zoom-in-in', 'bg-vert-zoom-in-out' );
            } else {
                this.removeAnimation( 'bg-vert-zoom-in-in', 'bg-vert-zoom-in-out' );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get transitionZoomVertOut() {
        return this._transitionZoomVertOut; 
    }
    set transitionZoomVertOut(newtransitionZoomVertOut) {
        if (newtransitionZoomVertOut != this._transitionZoomVertOut) {
            this._transitionZoomVertOut = newtransitionZoomVertOut;
            if (this._transitionZoomVertOut) {
                this.addAnimation( 'bg-vert-zoom-out-in', 'bg-vert-zoom-out-out' );
            } else {
                this.removeAnimation( 'bg-vert-zoom-out-in', 'bg-vert-zoom-out-out' );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get transitionMoveLeft() {
        return this._transitionMoveLeft; 
    }
    set transitionMoveLeft(newtransitionMoveLeft) {
        if (newtransitionMoveLeft != this._transitionMoveLeft) {
            this._transitionMoveLeft = newtransitionMoveLeft;
            if (this._transitionMoveLeft) {
                this.addAnimation( 'bg-move-in-from-left', 'bg-move-out-from-left' );
            } else {
                this.removeAnimation( 'bg-move-in-from-left', 'bg-move-out-from-left' );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get transitionMoveRight() {
        return this._transitionMoveRight; 
    }
    set transitionMoveRight(newtransitionMoveRight) {
        if (newtransitionMoveRight != this._transitionMoveRight) {
            this._transitionMoveRight = newtransitionMoveRight;
            if (this._transitionMoveRight) {
                this.addAnimation( 'bg-move-in-from-right', 'bg-move-out-from-right' );
            } else {
                this.removeAnimation( 'bg-move-in-from-right', 'bg-move-out-from-right' );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get transitionMoveTop() {
        return this._transitionMoveTop; 
    }
    set transitionMoveTop(newtransitionMoveTop) {
        if (newtransitionMoveTop != this._transitionMoveTop) {
            this._transitionMoveTop = newtransitionMoveTop;
            if (this._transitionMoveTop) {
                this.addAnimation( 'bg-move-in-from-top', 'bg-move-out-from-top' );
            } else {
                this.removeAnimation( 'bg-move-in-from-top', 'bg-move-out-from-top' );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get transitionMoveBottom() {
        return this._transitionMoveBottom; 
    }
    set transitionMoveBottom(newtransitionMoveBottom) {
        if (newtransitionMoveBottom != this._transitionMoveBottom) {
            this._transitionMoveBottom = newtransitionMoveBottom;
            if (this._transitionMoveBottom) {
                this.addAnimation( 'bg-move-in-from-bottom', 'bg-move-out-from-bottom' );
            } else {
                this.removeAnimation( 'bg-move-in-from-bottom', 'bg-move-out-from-bottom' );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get transitionShuffleLeft() {
        return this._transitionShuffleLeft; 
    }
    set transitionShuffleLeft(newtransitionShuffleLeft) {
        if (newtransitionShuffleLeft != this._transitionShuffleLeft) {
            this._transitionShuffleLeft = newtransitionShuffleLeft;
            if (this._transitionShuffleLeft) {
                this.addAnimation( 'bg-shuffle-in-from-left', 'bg-shuffle-out-from-left' );
            } else {
                this.removeAnimation( 'bg-shuffle-in-from-left', 'bg-shuffle-out-from-left' );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get transitionShuffleRight() {
        return this._transitionShuffleRight; 
    }
    set transitionShuffleRight(newtransitionShuffleRight) {
        if (newtransitionShuffleRight != this._transitionShuffleRight) {
            this._transitionShuffleRight = newtransitionShuffleRight;
            if (this._transitionShuffleRight) {
                this.addAnimation( 'bg-shuffle-in-from-right', 'bg-shuffle-out-from-right' );
            } else {
                this.removeAnimation( 'bg-shuffle-in-from-right', 'bg-shuffle-out-from-right' );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get transitionShuffleTop() {
        return this._transitionShuffleTop; 
    }
    set transitionShuffleTop(newtransitionShuffleTop) {
        if (newtransitionShuffleTop != this._transitionShuffleTop) {
            this._transitionShuffleTop = newtransitionShuffleTop;
            if (this._transitionShuffleTop) {
                this.addAnimation( 'bg-shuffle-in-from-top', 'bg-shuffle-out-from-top' );
            } else {
                this.removeAnimation( 'bg-shuffle-in-from-top', 'bg-shuffle-out-from-top' );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get transitionShuffleBottom() {
        return this._transitionShuffleBottom; 
    }
    set transitionShuffleBottom(newtransitionShuffleBottom) {
        if (newtransitionShuffleBottom != this._transitionShuffleBottom) {
            this._transitionShuffleBottom = newtransitionShuffleBottom;
            if (this._transitionShuffleBottom) {
                this.addAnimation( 'bg-shuffle-in-from-bottom', 'bg-shuffle-out-from-bottom' );
            } else {
                this.removeAnimation('bg-shuffle-in-from-bottom', 'bg-shuffle-out-from-bottom' );
            }
        }
    }


    /**
     * @returns {'contain'|'cover'}
     */
    get size() {
        return this._size; 
    }

    /**
	 * Set to 'contain' or 'cover'
	 * @param {'contain'|'cover'} newsize 'contain' or 'cover'
	 */
    set size( newsize ) {
        this._size = newsize;
    }
	
    get blur() {
        return this._blur; 
    }
    set blur( newblur ) {
        this._blur = newblur;
    }
	
    /**
	 * @returns {'normal'|'multiply'|'screen'|'overlay'|'darken'|'lighten'|'color-dodge'|'color-burn'|'hard-light'|'soft-light'|'difference'|'exclusion'|'hue'|'saturation'|'color'|'luminosity'}
	 */
    get blend() {
        return this._blend; 
    }
    /**
	 * Set to 'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'
	 * @param {'normal'|'multiply'|'screen'|'overlay'|'darken'|'lighten'|'color-dodge'|'color-burn'|'hard-light'|'soft-light'|'difference'|'exclusion'|'hue'|'saturation'|'color'|'luminosity'} newblend
	 */
    set blend( newblend ) {
        this._blend = newblend;
    }

    /**
	 * @returns {number}
	 */
    get opacity() {
        return this._opacity * 100; 
    }
    set opacity( newopacity ) {
        this._opacity = newopacity / 100;
    }
	
    /**
	 * @returns {number}
	 */
    get volume() {
        return this._volume * 100; 
    }
    set volume( volume ) {
        this._volume = volume / 100;
        //TODO this.preps.video.volume = this._volume;
        //TODO this.shows.video.volume = this._volume;
    }


    /**
	 * 
	 * @param {string} animIn 
	 * @param {string} animOut 
	 */
    getAnimationIndex( animIn, animOut ) {
        let idx = -1;
        for ( let i = 0; i < this.animations.length; i++ ) {
            const a = this.animations[ i ];
            if ( a[ 0 ] == animIn && a[1] == animOut ) {
                idx = i;
                break;
            }
        }
        return idx;
    }
	
    /**
	 * 
	 * @param {string} animIn 
	 * @param {string} animOut 
	 */
    addAnimation( animIn, animOut ) {
        const idx = this.getAnimationIndex( animIn, animOut );
        if ( idx == -1 ) {
            this.animations.push( [ animIn, animOut ] );
            this.lastAddedAnimation = [ animIn, animOut ];
        }
    }
	
    /**
	 * 
	 * @param {string} animIn 
	 * @param {string} animOut 
	 */
    removeAnimation( animIn, animOut ) {
        const idx = this.getAnimationIndex( animIn, animOut );
        if ( idx != -1 ) {
            this.animations.splice( idx, 1 );
        }
    }

    /**
	 * @returns {boolean}
	 */
    get paused() {
        return this._paused; 
    }
    set paused(newPaused) { 
        this._paused = newPaused; 
        if ( this._paused) {
            this.pause();
        } else {
            this.play();
        }
    }
	
    /**
	 * Pause the slideshow
	 * @function
     * @instance
	 **/
    pause() {
        // console.log("ContentShow.pause()");
        this._paused = true;
        this.stopInterval();
    }

	
    getAndSetNewContent() {
        conSup.supply().then( newContent => this.setNextContent(newContent) );
        // conSup.supply().then( newContent => { this.setNextContent( newContent ) } );
    }

    onInterval() {
        console.error( this.constructor.name + ' must implement ContentShow.onInterval()' );
    }

    startInterval() {
        const intervalMs = this._interval * this._intervalMultiply + ( this._useTransitions ? 1000 * this._transitionDuration : 0 );

        if (this._intervalHandle == null) {
            this._intervalHandle = setInterval( () => this.onInterval(), intervalMs );
        } else {
            console.error('ContentShow.startInterval(): this._intervalHandle='+ this._intervalHandle);
        }
    }

    stopInterval() {
        clearInterval(this._intervalHandle);
        this._intervalHandle = null;
    }

    play() {
        // console.log("ContentShow.play()");
        this._paused = false;
        this.startInterval();
    }
	
    /**
	 * Show the next content
	 **/
    next() {
        // console.log("ContentShow.next()");
        if (! this._paused) {
            this.stopInterval();
        }
        if (! this._paused) {
            this.startInterval();
        }
    }
	

    flush() {
        this.stopInterval();
    }

    /**
	 * @returns {number}
	 */
    get interval() {
        return this._interval / 1000; 
    }
    /**
	 * Set interval between image updates
     * @param {number} ms - milliseconds between image changes when multiplier is set to 1
	 **/
    set interval( ms ) {
        ms = Math.max( 1, ms * 1000);
        if ( this._interval != ms ) {
            this._interval = ms;
            if ( this._intervalHandle ) {
                this.stopInterval();
                this.startInterval();
            }
        }
    }

    /**
	 * @returns {number}
	 */
    get intervalMultiplier() {
        return this._intervalMultiply; 
    }
    /**
	 * Set interval multiplier 
     * @param {number} i - time multiplier for interval, mostly implemented for easier settings
	 **/
    set intervalMultiplier(i) {
        i = Math.max( 1, 1*i );
        if ( this._intervalMultiply != i ) {
            this._intervalMultiply = i;
            if ( this._intervalHandle ) {
                this.stopInterval();
                this.startInterval();
            }
        }
    }
	
    /**
	 * @returns {boolean}
	 */
    get useTransitions() {
        return this._useTransitions;
    }
    /**
	 * @param {boolean} newUseTransition
	 */
    set useTransitions( newUseTransition ) {
        if ( newUseTransition != this._useTransitions ) {
            this._useTransitions = newUseTransition;
            if ( this._intervalHandle ) {
                this.pause();
                this.play();
            }
        }
    }
	
    /**
	 * @returns {number}
	 */
    get transitionDuration() {
        return this._transitionDuration; 
    }

    /**
	 * Set Transition Duration in seconds
     * @param {number} duration - duration of transition in seconds
	 **/
    set transitionDuration( duration ) {
        if ( duration != this._transitionDuration ) {
            this._transitionDuration = duration;
            if ( this._intervalHandle ) {
                this.pause();
                this.play();
            }
        }
    }		
}
