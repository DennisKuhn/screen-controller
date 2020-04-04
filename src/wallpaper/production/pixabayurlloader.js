'use strict';

try {
    importScripts('./urlloader.js');
} catch (ex) {
    console.error(ex);
}


/**
 * Thread to async retrieve content URLs from Pixabay
 * @extends UrlLoader
 */
class PixabayUrlLoader extends UrlLoader {
    constructor() {

        /**
         * Pixabay request size 3-200, default 20
         */
        super(20);

        this.name = 'PixabayUrlLoader';

        /**
         * Base request url
         * @type {string}
         */
        this.urlBase = 'https://pixabay.com/api/';


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

        this.getUrls();
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

        
                const url = this.urlBase + '?' + 'key=' + this._apiKey + '&' + 'per_page=' + this.requestSize + '&' + 'page=' + this._currentPage;

                // console.log("[" + this.name + "].getUrls(): rerequest=" + this.rerequest + " :" + url );
                this.rerequest = false;

                const response = await fetch( url );
                let responseObject = null;
                let message = null;

                const headers = [];

                for (const header of response.headers.entries() ) {
                    headers.push(header[0] + '=' + header[1]);
                }
                // console.log("[" + this.name + "].getUrls(): rerequest=" + this.rerequest + " :" + url + " Headers: " + headers );

                this.rateLimit = response.headers.get('X-RateLimit-Limit');
                this.rateRemaining = response.headers.get('X-Ratelimit-Remaining');
                this.rateResetAt = new Date( response.headers.get('X-Ratelimit-Reset') );

        
                if (! this.rerequest) {
                    if (response.ok) {
                        responseObject = await response.json();
                    } else {
                        switch ( response.status ) {
                            case 429:
                                message = '[' + this.name + '].getUrls(): Error:' + response.status + ':' + response.statusText + ': too many requests: ' + url;
                                break;
                            default:
                                message = '[' + this.name + '].getUrls(): Error:' + response.status + ':' + response.statusText + ': ' + url;
                                break;
                        }
                    }
                }

                if ((! this.rerequest) && responseObject) {
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
     * @param {{
     *  total: number,
     *  totalHits: number,
     *  hits:[{
     *      id:number, 
     *      pageURL:string, 
     *      type:string, 
     *      tags: string, 
     *      previewURL: string, 
     *      previewWidth: number, 
     *      previewHeight: number,
     *      largeImageURL: string,
     *      imageHeight: number,
     *      fullHDURL: string,
     *      imageURL: string,
     *      vectorURL: string,
     *      imageWidth: number,
     *      imageHeight: number,
     *      imageSize: number,
     *      views: number,
     *      downloads: number,
     *      favorites: number,
     *      likes: number,
     *      comments: number,
     *      user_id: number,
     *      user: string,
     *      userImageURL: string
     *      }]}} list 
     */
    handlePhotoList(list) {
        // console.log("[" + this.name + "].handlePhotoList():[ " + list.totalHits + " ]" + list.hits.filter( photoInfo => photoInfo.imageURL ).length ? " restricted api" : " :-) FULL API :-)"  );
        this.lastPage = this._currentPage >= (list.totalHits / this.requestSize);
        this._currentPage = this.lastPage ? 1 : 1 + this._currentPage;

        list.hits.forEach( 
            photoInfo =>
                this.addUrlContent( 
                    {
                        title: photoInfo.user,
                        description: photoInfo.tags,
                        uri: photoInfo.largeImageURL,
                        userUri: photoInfo.pageURL
                    })
        );
    }
    
}

const loader = new PixabayUrlLoader();