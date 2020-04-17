'use strict';

import DigiDisplay from './digidisplay';
import locale from '../utils/locale';

const weekdayLong = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];

const weekdayShort = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Shows a digital date, either "ddd dd/mm/yyyy" or "ddd mm/dd/yyyy"
 * @extends DigiDisplay
 */
export default class DigiDate extends DigiDisplay {
    constructor() {
        super('date');      

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
        // console.log("DigiDate.hide: " + this.name);

        if ( this.intervalID > 0) {
            clearInterval(this.intervalID); 					
            this.intervalID = 0; 
        }
    }
    
    interval() {
        // console.log('DigiDate.interval(' + this.intervalID + ')');
        if ( !this.visi ) {
            console.warn('DigiDate.interval(' + this.intervalID + ') not visible RETURN');
            return;
        }
        const dateText =  locale.formatDate( new Date() );

        if ( this.wrapperInner.innerText != dateText ) {
            this.wrapperInner.innerText = dateText;
        }
    }
}

