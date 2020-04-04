'use strict';

/**
 * Created by producer, delivered by supplied and consumed by shows.
 * Contains originalUri, possibly dataObject Uri (as uri), contentElement. 
 */
export default class Content {

    /**
     * 
     * @param {*} producer 
     * @param {string} uri 
     * @param {string} [title]
     * @param {string} [description] 
     * @param {string} [userUri]
     * @param {Date} [date]
     */
    constructor( producer, uri, title, description, userUri, date) {
        this.producer = producer;
        this.title = title;
        this.description = description;

        /**
         * @type {Date}
         */
        this._date = date ? date : null;

        this.constructed = performance.now();
        this.uriSet = 0;
        this.uriReset = 0;
        this.buffered = 0;
        this.loaded = 0;
        this.decoded = 0;
        this._volume = -1;

        this.element = null;

        this._uri = '';
        this._originalUri = '';
        this._userUri = userUri;

        if (uri) this.uri = uri;

        this._onFreeResources = null;
        this._start = null;
        this._stop = null;
        this._attach = null;

        this.data = null;
    }

    get date() {
        return this._date; 
    }
    /**
     * @param {Date} newDate
     */
    set date(newDate) {
        this._date = newDate; 
    }

    /**
     * @returns {string}
     */
    get userUri() {
        return this._userUri; 
    }
    /**
     * @param {string} newUri
     */
    set userUri(newUri) {
        this._userUri = newUri; 
    }

    get onFreeResources() {
        return this._onFreeResources; 
    }
    /**
     * @param {(content:Content) => void} cleaner 
     */
    set onFreeResources( cleaner ) {
        this._onFreeResources = cleaner;
    }
    
    get attacher() {
        return this._attach; 
    }
    /**
     * @param {(content:Content) => void} cbAttacher
     */
    set attacher( cbAttacher ) {
        this._attach = cbAttacher; 
    }

    get starter() {
        return this._start; 
    }
    /**
     * @param {(content:Content) => void} cbStarter
     */
    set starter( cbStarter ) {
        this._start = cbStarter; 
    }

    get stopper() {
        return this._stop; 
    }
    /**
     * @param {(content:Content) => void} cbStopper
     */
    set stopper( cbStopper ) {
        this._stop = cbStopper; 
    }

    get originalUri() {
        return this._originalUri; 
    }

    /**
     * @returns {string}
     */
    get uri() {
        return this._uri; 
    }
    /**
     * @param {string} newUri
     */
    set uri(newUri) { 
        if ( this.uriSet) { 
            this.uriReset = performance.now();
        } else { 
            this.uriSet = performance.now();
            this._originalUri = newUri;
        } 
        this._uri = newUri;
    }

    setBuffered() {
        this.buffered = performance.now(); 
    }
    setLoaded() { 
        this.loaded = performance.now();  
        if (this.uriReset) {
            // console.log( "load=" + ((this.loaded - this.buffered) / 1000).toFixed(3) + " " + this._uri + " - " + this._originalUri );
        }
    }

    setDecoded() { 
        this.decoded = performance.now();  
        // console.log( "load=" + ((this.loaded - this.buffered) / 1000).toFixed(3) + " " + "deco=" + ((this.decoded - this.loaded) / 1000).toFixed(3) + " " + this.description );
    }

    freeResources() {
        if ( this.element) {
            this.stop();
            if ( this.element.src) {
                // console.log("Content.freeResources(): clear src: " + this.uri);
                // this.element.src = null '' //:0; data:, // Causes error on image
                this.element.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
                if (this.element.parentElement) {
                    console.error('Content.freeResources(): ' + this.element.tagName + '-element has parent: ' + this.element.parentElement.tagName + '#' + this.element.parentElement.id + ' : ' + this.uri);
                }
                this.element = null;
            }
        }
        if (this._onFreeResources) {
            this._onFreeResources( this );
        } else {
            console.warn('Content.freeResources(): no _onFreeResources: ' + this._uri);
        }
        if (this._originalUri != this._uri) {
            // console.log("Content.freeResources(): revoke: " + this.uri);
            // URL.revokeObjectURL(this._uri);
            this._uri = this._originalUri;
        } else {
            // console.warn("Content.freeResources(): (data)uri == originalUri: " + this.uri);
        }
    }

    /**
     * @returns {number}
     */
    get volume() {
        return this._volume; 
    }

    /**
     * @param {number} newVolume
     */
    set volume(newVolume) {
        this._volume = newVolume;

        if ('volume' in this.element) {
            try {
                this.element.volume = this._volume;
            } catch (ex) {
                console.error('content[' + this.uri + '].volume=' + newVolume + ': threw: ' + ex + ': ' + this._originalUri);
            }
        }
    }

    stop() {
        if (this._stop) {
            this._stop(this);
        } else {
            // console.warn("content[" + this.uri + "].stop(): no stopper: " + this._originalUri );
        }
    }

    start() {
        if (this._start) {
            this._start(this);
        } else {
            // console.warn("content[" + this.uri + "].start(): no starter: " + this._originalUri );
        }
    }

    attach() {
        if (this._attach) {
            this._attach(this);
        } else {
            // console.warn("content[" + this.uri + "].attach(): no attacher: " + this._originalUri );
        }
    }
}
