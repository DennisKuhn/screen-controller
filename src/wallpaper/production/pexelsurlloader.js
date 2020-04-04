'use strict';

try {
    importScripts('./urlloader.js');
} catch (ex) {
    console.error(ex);
}


/**
 * Thread to async retrieve content URLs from Pexels
 * @extends UrlLoader
 */
class PexelsUrlLoader extends UrlLoader {
    constructor() {

        /**
         * Pexels request size 1-80, default 15
         */
        super(15);

        this.name = 'PexelsUrlLoader';

        /**
         * Base request url
         * @type {string}
         */
        this.urlBase = 'https://api.pexels.com/v1';

        /**
         * Methode like search, curated
         * @type {"curated"|"search"}
         */
        this._method = 'curated';

        /**
         * Search term used with method=search
         */
        this._term = '';

        /**
         * Current page of the request
         *  @type {number}
         */
        this._currentPage = 1;
        /**
         * Current page the last of request
         *  @type {boolean}
         */
        this.lastPage = true;

        this.requesting = false;
        this.rerequest = false;

        /**
         * @type {number} timespan in second of the rateLimit, 1 hour
         */
        this.rateSpan = 60 * 60;

        this.rateLimit = 200;
        this.rateRemaining = this.rateLimit;
        this.rateResetAt = new Date();
        this.rateResetAt.setTime(this.rateResetAt.getTime() + (this.rateSpan * 1000));

        this.getUrls();
    }

    get termParameter() {
        if ( this._method == 'search' ) {
            return 'query=' + this._term.replace( / /g, '+') + '&';
        }
        return '';
    }

    /**
     * 
     * @param {boolean} rerequestIfBusy if false the promise resolves as soon as the current request is done, otherwise a new request is started first
     */
    async getUrls(rerequestIfBusy) {
        if (this.requesting) {
            // console.log("[" + this.name + "].getUrls(" + rerequestIfBusy + "): rerequest - return promise");
            this.rerequest |= ( rerequestIfBusy ? true : false);
        } else {
            do {
                this.requesting = true;

                const url = this.urlBase + '/'
                + this._method + '?' 
                + this.termParameter
                + 'per_page=' + this.requestSize + '&' 
                + 'page=' + this._currentPage;

                // console.log("[" + this.name + "].getUrls(): rerequest=" + this.rerequest + " :" + url );
                this.rerequest = false;

                this.rateRemainingReduce(1);
                const response = await fetch( url, {headers: {Authorization: this._apiKey}} );
                let responseObject = null;
                let message = null;

                const headers = [];

                for (const header of response.headers.entries() ) {
                    headers.push(header[0] + '=' + header[1]);
                }
                // console.log("[" + this.name + "].getUrls(): rerequest=" + this.rerequest + " :" + url + " Headers: " + headers );

                
                if (! this.rerequest) {
                    if (response.ok) {
                        responseObject = await response.json();
                    } else {
                        switch ( response.status ) {
                            case 429:
                                message = '[' + this.name + '].getUrls(): Error:' + response.status + ':' + response.statusText + ': too many requests: ' + url;
                                break;
                            case 502:
                                // console.log(`[${this.name}].getUrls(${rerequestIfBusy}): error: 502: rerequest`);
                                this.rerequest = true;
                            default:
                                message = '[' + this.name + '].getUrls(): Error:' + response.status + ':' + response.statusText + ': ' + url;
                                break;
                        }
                    }
                }
                if ((! this.rerequest) && responseObject) {
                    this.rateRemainingReduce(responseObject.photos.length);
                    this.handlePhotoList(responseObject);
                }
                if (message) {
                    console.error('[' + this.name + '].getUrls(): Error: ' + message );
                    throw new Error( message );
                }

                this.requesting = false;
            } while ( this.rerequest );
        }
    }

    /**
     * 
     * @param {{photos:[{url:string, photographer: string, width: number, height: number, src: {original: string, large: string, large2x: string, medium: string, small: string, portrait: string, landscape: string, tiny: string }}], page: number, per_page: number, total_resuls: number, next_page: string, prev_page: string}} list 
     */
    handlePhotoList(list) {
        this.lastPage = list.next_page ? true : false;
        // console.log("[" + this.name + "].handlePhotoList(): lastPage=" + this.lastPage );
        this._currentPage = this.lastPage ? 1 : 1 + this._currentPage;

        list.photos.forEach( 
            photoInfo =>
                this.addUrlContent( 
                    {
                        title: photoInfo.photographer,
                        description: 'Photo provided by Pexels',
                        uri: photoInfo.src.original,
                        userUri: photoInfo.url
                    })
        );
    }
    
    /**
     * 
     * @param {MessageEvent} request 
     */
    processRequest(request) { 
        if (request.data.method) {
            // console.log("[" + this.name + "].processRequest(method) = " + request.data.method);

            if (this._method != request.data.method) {
                this._method = request.data.method;
                this.flush();
            }
        } else if (request.data.term) {
            // console.log("[" + this.name + "].processRequest(term) = " + request.data.term);

            if (this._term != request.data.term) {
                this._term = request.data.term;
                this.flush();
            }
        } else {
            super.processRequest(request);
        }

    }
}

const loader = new PexelsUrlLoader();