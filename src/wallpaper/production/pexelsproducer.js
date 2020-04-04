'use strict';

import LoaderProducer from './loaderproducer';

/**
 *  @extends LoaderProducer
 */
export default class PexelsProducer extends LoaderProducer {
    /**
     * 
     * @param {number} bufferSize used by this producer.
     */
    constructor(bufferSize) {
        super(bufferSize, 'Pexels.svg', 'production/pexelsurlloader.js', 'Pexels-Url-Loader');
        // console.log("PexelsProducer.constructor(): bufferSize=" + this.bufferSize);

        /**
         * Method like popular
         * @type {"curated"|"search"}
         */
        this._method = 'curated';

        /**
         * Search term used with method=search
         */
        this._term = '';
    }

    get method() {
        return this._method; 
    }

    /**
     * @param {"curated"|"search"} newMethod
     */
    set method(newMethod) {
        if (this._method != newMethod) {
            this._method = newMethod;
            this.urlLoader.postMessage({method: this._method});
            this.flush();
        }
    }

    get term() {
        return this._term; 
    }

    /**
     * Search term used with method=search
     * @param {string} newTerm
     */
    set term(newTerm) {
        if (this._term != newTerm) {
            this._term = newTerm;
            this.urlLoader.postMessage({term: this._term});
            this.flush();
        }
    }

}

const pexelsProducer = new PexelsProducer(3);