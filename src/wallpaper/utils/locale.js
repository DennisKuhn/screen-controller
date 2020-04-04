'use strict';

class Locale {
    constructor() {
        this._code = '';
        this.dateTimeFormatter = null;
        this.dateFormatter = null;
        this.timeFormatter = null;
        this.numberFormatter = null;

        this.code = 'en-NZ';
    }

    get code() {
        return this._code; 
    }
    set code(newCode) { 
        if ( /([A-z]{2,4})(-[A-z]{2,})*/.test(newCode) ) {
            this._code = newCode;
            this.dateTimeFormatter = new Intl.DateTimeFormat( 
                this._code, 
                {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric'
                    // Force 12-hour or 24-hour
                    //hour12: true | false,
                }
            );
            this.dateFormatter = new Intl.DateTimeFormat( 
                this._code, 
                {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                }
            );
            this.timeFormatter = new Intl.DateTimeFormat( 
                this._code, 
                {
                    hour: 'numeric',
                    minute: 'numeric'
                }
            );
            this.numberFormatter = new Intl.NumberFormat( this._code );
        } else {
            console.log('Locale.code=' + newCode + ' skip, no match, hopefully caused by reactive interface');
        }
    }

    timeText(date) {

    }

    /**
     * 
     * @param {Date} value to be formatted as time with the set locale
     * @returns {string} the formated value
     */
    formatTime(value) {
        if ( value instanceof Date ) {
            // console.log( this.constructor.name + ".formatTime: " + value);
            return this.timeFormatter.format(value);
        } else {
            console.error( this.constructor.name + '.formatTime( ' + value +' ) unkown type: '+ (typeof value) + (value ? ', ' + value.constructor.name : ''));
            throw new Error(this.constructor.name + '.formatTime( ' + value +' ) unkown type: ' + (typeof value) + (value ? ', ' + value.constructor.name : ''));
        }
    }

    /**
     * 
     * @param {Date} value to be formatted as date with the set locale
     * @returns {string} the formated value
     */
    formatDate(value) {
        if ( value instanceof Date ) {
            // console.log( this.constructor.name + ".formatDate: " + value);
            return this.dateFormatter.format(value);
        } else {
            console.error( this.constructor.name + '.formatDate( ' + value +' ) unkown type: '+ (typeof value) + (value ? ', ' + value.constructor.name : ''));
            throw new Error(this.constructor.name + '.formatDate( ' + value +' ) unkown type: ' + (typeof value) + (value ? ', ' + value.constructor.name : ''));
        }
    }


    /**
     * 
     * @param {Date|number} value to be formatted with the set locale
     * @returns {string} the formated value
     */
    format(value) {
        // console.log( this.constructor.name + ".format( " + value + " : " + (value ? value.constructor.name : value) +" )");
        if ( typeof value == 'number') {
            // console.log( this.constructor.name + ".format number");
            return this.numberFormatter.format(value);
        } else if ( value instanceof Date ) {
            // console.log( this.constructor.name + ".format date");
            return this.dateTimeFormatter.format(value);
        } else {
            console.error( this.constructor.name + '.format( ' + value +' ) unkown type: '+ (typeof value) + (value ? ', ' + value.constructor.name : ''));
            throw new Error(this.constructor.name + '.format( ' + value +' ) unkown type: ' + (typeof value) + (value ? ', ' + value.constructor.name : ''));
        }
    }
}

const locale = new Locale();

export default locale;