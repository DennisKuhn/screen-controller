'use strict';

try {
    importScripts('../connectors/facebookconnector.js', './urlloader.js');
} catch (ex) {
    console.error(ex);
}

const context = self;

/**
 * Thread to async retrieve content URLs from Facebook
 * @extends UrlLoader
 */
class FacebookUrlLoader extends UrlLoader {
    constructor() {
        /**
         * Facebook usually returns 25 results
         */
        super(25);
        this.name = 'FacebookUrlLoader';
        context.onmessage = e => this.processRequest(e);

        /**
         * @type {FacebookConnector}
         */
        this.fbCon = null;

        /// Facebook 

        /**
         * Graph request url to receive own photos
         * @type {string}
         */
        this.urlMyPhotos = 'me/photos?fields=id,name,created_time,backdated_time,link,images';

        /**
         * Facebook paging cursor before
         *  @type {string}
         */
        this.cursorBefore = '';
        /**
         * First Facebook paging cursor before
         *  @type {string}
         */
        this.cursorStart = '';
        /**
         * Facebook paging cursor after
         *  @type {string}
         */
        this.cursorAfter = '';

        /**
         * Facebook paging previous Url
         *  @type {string}
         */
        this.previousUrl = '';
        /**
         * Facebook paging next Url
         *  @type {string}
         */
        this.nextUrl = '';
    }

    setAccessToken(accessToken) {
        // console.log("[" + this.name + "].setAccessToken(" + accessToken + ") fbCon=" + this.fbCon );
        this.accessToken = accessToken;

        if (this.accessToken && this.fbCon == null) {
            this.fbCon = new FacebookConnector(true, this.accessToken);
            this.fbCon.addConnectChangedListeners( connected => this.onConnectChanged(connected) );
        }
        if (this.fbCon) {
            this.fbCon.accessToken = this.accessToken;
        }
    }

    /**
     * 
     * @param {boolean} connected 
     */
    onConnectChanged(connected) {
        // console.log("[" + this.name + "].onConnectChanged(" + connected + ")" );

        if (connected) {
            this.getUrls();
        }
    }

    /**
     * 
     * @param {MessageEvent} request 
     */
    processRequest(request) { 
        if (request.data.accessToken) {
            this.setAccessToken(request.data.accessToken);
        } else {
            super.processRequest(request);
        }
    }

    getUrls() {
        let url = this.urlMyPhotos;
        if (this.cursorAfter) {
            if (this.nextUrl) {
                url = url + '&after=' + this.cursorAfter;
            } else {

            }
        }
        url = url + '&limit=' + this.requestSize;

        // console.log("[" + this.name + "].getUrls(): [" + this.firstFreeBuffer + "," + this.firstFullBuffer + "/" + this.infoBuffer.length + "," + this.promises + "]: " + url );

        return this.fbCon.fetchGraph(
            'GET',
            url,
            true
        )
            .then(
                list => this.handlePhotoList(list)
            );
    }

    /**
     * 
     * @param {{data:[{id:number, name:string, created_time:Date, backdated_time:Date, link:string, images: [{height:number, source:string, width:number}]}], paging:{cursors: {before:string,after:string}, next:string, previous:string}}} list 
     */
    handlePhotoList(list) {
        // console.log("[" + this.name + "].handlePhotoList(): [" + list.paging.cursors.after + " .. " + list.paging.cursors.before + ", " + (list.paging.previous ? 'previous': 'first') + ", " + (list.paging.next ? 'next': 'last') + "] [" + this.firstFreeBuffer + "," + this.firstFullBuffer + "/" + this.infoBuffer.length + "," + this.promises + "]" );
        this.cursorAfter = list.paging.cursors.after;
        this.cursorBefore = list.paging.cursors.before;
        if (! this.cursorStart) {
            this.cursorStart = this.cursorBefore;
        }
        this.previousUrl = list.paging.previous;
        this.nextUrl = list.paging.next;

        list.data.forEach( 
            photoInfo =>
                this.addUrlContent( 
                    {
                        title: photoInfo.name,
                        date: (photoInfo.backdated_time ? photoInfo.backdated_time : photoInfo.created_time ),
                        uri: photoInfo.images[0].source,
                        userUri: photoInfo.link
                    }
                )

        );
    }    
}

const loader = new FacebookUrlLoader();