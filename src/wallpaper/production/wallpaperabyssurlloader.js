'use strict';

try {
    importScripts('./urlloader.js');
} catch (ex) {
    console.error(ex);
}

/**
 * Thread to async retrieve content URLs from WallpaperAbyss
 * @extends UrlLoader
 */
class WallpaperAbyssUrlLoader extends UrlLoader {
    constructor() {
        /**
         * WallpaperAbyss request size is fixed 30
         *  @type {number}
         */
        super(30);

        this.name = 'WallpaperAbyssUrlLoader';
        context.onmessage = e => this.processRequest(e);


        /// WallpaperAbyss

        /**
         * Base request url
         * @type {string}
         */
        this.urlBase = 'https://wall.alphacoders.com/api2.0/get.php';

        /**
         * Methode like popular
         * @type {"highest_rated"|"newest"|"popular"|"by_views"|"by_favorites"|"category"|"collection"|"group"|"sub_category"|"featured"|"tag"|"user"|"search"|"random"|"search"}
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


        /**
         * @type {1|2|3}
         */
        this._infoLevel = 2;

        /**
         * Current page of the request, 30 papers per page
         *  @type {string}
         */
        this._currentPage = 1;

        /**
         * Current page of the last of request, 30 papers per page
         *  @type {boolean}
         */
        this.lastPage = true;

        this.requesting = false;
        this.rerequest = false;

        this.getUrls(false);
    }

    get sortParameter() {
        if ( this._method in ['category', 'collection', 'group', 'sub_category', 'featured', 'popular', 'tag', 'user', 'search', 'random'] ) {
            return 'sort=' + this._sort + '&';
        }
        return '';
    }

    get termParameter() {
        if ( this._method == 'search' ) {
            return 'term=' + this._term + '&';
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

                const url = this.urlBase + '?' 
                + 'method=' + this._method + '&' 
                + this.sortParameter
                + this.termParameter
                + 'info_level=' + this._infoLevel + '&' 
                + 'page=' + this._currentPage + '&' 
                + 'check_last=' + '1' + '&' 
                + 'auth=' + this._apiKey;

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

                if (! this.rerequest) {
                    if (response.ok) {
                        responseObject = await response.json();
                    } else {
                        message = '[' + this.name + '].getUrls(): Error:' + response.status + ':' + response.statusText + ': ' + url;
                    }
                }
                if ((! this.rerequest) && responseObject) {
                    if (responseObject.success) {
                        this.handlePhotoList(responseObject);
                    } else {
                        message = '[' + this.name + '].getUrls(): Error reply:' + responseObject.error + ': ' + url;
                    }
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
     * @param {{wallpapers:[{id:number, url_page:string, url_image: string, category: string, category_id: number, sub_category: string, sub_category_id: number, user_name:string}], is_last: boolean}} list 
     */
    handlePhotoList(list) {
        // console.log("[" + this.name + "].handlePhotoList(): lastPage=" + list.is_last  );
        this.lastPage = list.is_last;
        this._currentPage = this.lastPage ? 1 : 1 + this._currentPage;

        list.wallpapers.forEach( 
            photoInfo =>
                this.addUrlContent(
                    {
                        title: photoInfo.user_name,
                        description: photoInfo.category + ( photoInfo.sub_category ? ' - ' + photoInfo.sub_category : ''),
                        uri: photoInfo.url_image,
                        userUri: photoInfo.url_page
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
        } else if (request.data.sort) {
            // console.log("[" + this.name + "].processRequest(sort) = " + request.data.sort);

            if ( this._sort != request.data.sort ) {
                this._sort = request.data.sort;
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

const loader = new WallpaperAbyssUrlLoader();