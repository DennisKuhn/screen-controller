'use strict';

import LoaderProducer from './loaderproducer';

/**
 *  @extends LoaderProducer
 */
class WallpaperAbyssProducer extends LoaderProducer {
    /**
     * 
     * @param {number} bufferSize used by this producer.
     */
    constructor(bufferSize) {
        super(bufferSize, 'WallpaperAbyss48.png', 'production/wallpaperabyssurlloader.js', 'WallpaperAbyss-Url-Loader' );
        // console.log("WallpaperAbyssProducer.constructor(): bufferSize=" + this.bufferSize);

        /**
         * Method like popular
         * @type {string}
         */
        this._method = 'popular';

        /**
         * Sort by, default newest
         * @type {"newest"|"rating"|"views"|"favorites"}
         */
        this._sort = 'newest';

        /**
         * Search term used with method=search
         */
        this._term = '';
    }

    get method() {
        return this._method; 
    }

    /**
     * @param {"highest_rated"|"newest"|"popular"|"by_views"|"by_favorites"|"category"|"collection"|"group"|"sub_category"|"featured"|"tag"|"user"|"search"|"random"|"search"} newMethod
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

    get sort() {
        return this._sort; 
    }
    set sort(newsort) {
        this._sort = newsort;
        this.urlLoader.postMessage({sort: this._sort});
        this.flush();
    }

}

const wallpaperAbyssProducer = new WallpaperAbyssProducer(3);