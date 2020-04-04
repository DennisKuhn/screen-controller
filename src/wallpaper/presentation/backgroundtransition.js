/**
 * Starts transitions and handles the oncomplete events. 
 **/
export default class BackgroundTransition {
    /**
	 * 
	 * @param {HTMLElement} el1 
	 * @param {HTMLElement} el2 
	 * @param {HTMLElement} el3
	 */
    constructor( el1, el2, el3  ) {
        this.el1 = el1;
        this.el2 = el2;
        this.el3 = el3;
		
        this.el1.addEventListener( 'animationend', ev => this.onAnimationEnd(ev) );
        this.el2.addEventListener( 'animationend', ev => this.onAnimationEnd(ev) );

        if (this.el3) {
            this.el3.addEventListener( 'animationend', ev => this.onAnimationEnd(ev) );
        } else {
            console.error('BackgroundTransition.constructor(): No Element3');
        }
        this.from = null; 
        this.to = null;

        this.inTransition = false;
        this.callback = null;
    }

    transitionCompleted() {
        if ( this.callback ) { 
            // console.log("TransitionCompleted: " + this.from.id + " - " + this.to.id );
        } else {
            console.error('TransitionCompleted: ' + this.from.id + ' - ' + this.to.id + ' no callback!');
        }
        this.to.style.animation = '';
        this.from.style.animation = '';
        // this.from.style.opacity = 0;
        // this.to.style.opacity = 1;
        // this.from.style.opacity = 1;
        this.from = null; 
        this.to = null;
        this.inTransition = false;

        if ( this.callback ) { 
            this.callback(); 
            this.callback = null;  
        }
    }
	
    stop() {
        const evt = document.createEvent('Event');
        evt.initEvent('animationend', true, true);
        this.to.dispatchEvent( evt );
        this.from.dispatchEvent( evt );
    }
	
    /**
	 * 
	 * @param {AnimationEvent} ev 
	 */
    onAnimationEnd(ev) {
        if (ev.target == this.from) {
            // console.log("onAnimationEnd[ from ]: " + this.from.id + " - " + this.to.id );
            this.from.style.display = 'none';
            this.transitionCompleted();
        } else if (ev.target == this.to) {
            // console.log("onAnimationEnd[ to ]: " + this.from.id + " - " + this.to.id );
        } else if (this.to == null ) {
            // console.log("onAnimationEnd[ " + ev.target.id + " ]" );
        } else {
            console.error('onAnimationEnd[' + ev.target.id + ']: ' + this.from.id + ' - ' + this.to.id );
        }
    }

    start( from, to, animationIn, animationOut, duration, callback ) {
        if ( this.inTransition ) {
            console.error('Transition.start( ' + this.from.id + ', ' + this.to.id + '): already inTransition!');
            return;
        }
        if ((from != this.el1) && (from != this.el2) && (from != this.el3)) {
            console.error('start: from is not registered!');
        }
        if ((to != this.el1) && (to != this.el2) && (to != this.el3)) {
            console.error('start: to is not registered!');
        }
        this.inTransition = true;
        this.callback = callback;
        this.from = from; 
        this.to = to;

        duration = 1*duration || 1;
		
        // console.log("Transition: " + this.from.id + " - " + this.to.id);
        this.to.style.opacity = 1;
        this.to.style.display = 'block';
        this.to.style.animation = animationIn + ' ' + duration + 's ease-in-out forwards';
        this.from.style.animation = animationOut + ' ' + duration + 's ease-in-out forwards';
    }
}