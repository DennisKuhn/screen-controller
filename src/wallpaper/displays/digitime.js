'use strict';

import DigiDisplay from './digidisplay';
import locale from '../utils/locale';

/**
 * Displays a digital clock either 24 hours or 12 hours with am/pm
 * @extends DigiDisplay
 */
export default class DigiTime extends DigiDisplay {
    interval() {
        // console.log('DigiDate.interval(' + this.intervalID + ')');
        if ( !this.visi ) {
            console.warn('DigiDate.interval(' + this.intervalID + ') not visible RETURN');
            return;
        }
        let timeText =  locale.formatTime( new Date() );

        if (this.hideSeparator) {
            timeText = timeText.replace( /[^\d\w\s]/g, ' ' );
        }
        this.hideSeparator = ! this.hideSeparator;

        this.wrapperInner.innerText = timeText;
    }  

    constructor() {
        super('time');

        this.hideSeparator = true;

        this.intervalID = setInterval( () => this.interval(), 1000 );
    }


    show() {
        super.show();

        if ( this.intervalID == 0 ) {
            this.intervalID = setInterval( () => this.interval(), 1000 );
        }
        this.interval(); 
    }

    hide() {
        super.hide();
        // console.log("DigiTime.hide: " + this.name);

        if ( this.intervalID > 0) {
            clearInterval(this.intervalID); 					
            this.intervalID = 0; 
        }
    }
            
}
