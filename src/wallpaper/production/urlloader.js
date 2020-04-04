'use strict';

const context = self;

/**
 * Base Class for thread to async retrieve content URLs from provider.
 * Organises queuing, "promises" and delivery
 */
export default class UrlLoader {
    /**
     * 
     * @param {number} requestSize 
     */
    constructor(requestSize) {
        this.name = 'PexelsUrlLoader';
        context.onmessage = e => this.processRequest(e);


        /**
         * Request size to allocate infoBuffer, the infoBuffer will become roughly requestSize * (1+refillAt)
         *  @type {number}
         */
        this.requestSize = requestSize;


        /// Internal
        /**
         * Content info with URL ready to be delivered to PexelsProducer to be downloaded.
         * Initial length is requestSize to catch the entire first request. It will grow depnding 
         * on the needs of checkRefill, roughly infoBuffer.length = requestSize * (1+refillAt)
         * @type {[{uri: string, title: string, description: string, date: Date, userUri: string}]}
         */
        this.infoBuffer = new Array(this.requestSize);

        /**
         * Index of first infoBuffer to be filled with content.
         * If firstFreeBuffer==firstFullBuffer, new content will appended to infoBuffer
         * @type {number}
         */
        this.firstFreeBuffer = 0;
        /**
         * Index of first infoBuffer with content to be delivered. If -1, no content is available.
         * @type {number}
         */
        this.firstFullBuffer = -1;

        /**
         * Count of outstanding content requests
         * @type {number}
         */
        this.promises = 0;

        /**
         * Relative fill level, start refilling when empty/bufferSize >= refillAt
         * @type {number}
         */
        this.refillAt = 0.5;

        /**
         * @type {number}
         */
        this.rateLimit = 0;
        /**
         * @type {number}
         */
        this.rateRemaining = 0;
        /**
         * @type {Date}
         */
        this.rateResetAt = null;
    }


    /**
     * 
     * @param {number} by 
     */
    rateRemainingReduce( by ) {
        this.rateRemaining -= by;
        // console.log("[" + this.name + "].rateRemainingReduce( " + by + " ) = " + this.rateRemaining );
    }

    getNewContent() {
        // console.log("[" + this.name + "].getNewContent(): [" + this.firstFreeBuffer + "," + this.firstFullBuffer + "/" + this.infoBuffer.length + "," + this.promises + "]" );

        if (this.firstFullBuffer < 0) {
            this.promises++;
            // console.log("[" + this.name + "].getNewContent(): [" + this.firstFreeBuffer + "," + this.firstFullBuffer + "/" + this.infoBuffer.length + "," + this.promises + "] buffered request" );
        } else {
            const info = this.infoBuffer[this.firstFullBuffer];
            this.firstFullBuffer = (this.firstFullBuffer + 1) % this.infoBuffer.length;
            if (this.firstFreeBuffer == this.firstFullBuffer) {
                this.firstFullBuffer = -1;
            }
            postMessage({contentInfo: info});
            this.checkRefill();
        }
        // console.log("[" + this.name + "].getNewContent(): [" + this.firstFreeBuffer + "," + this.firstFullBuffer + "/" + this.infoBuffer.length + "," + this.promises + "]" );
    }

    checkRefill() {
        const emptyCount = ( (this.infoBuffer.length - this.firstFreeBuffer) + this.firstFullBuffer) % this.infoBuffer.length;
        const emptyLevel = emptyCount / this.infoBuffer.length;

        // console.log("[" + this.name + "].checkRefill(): " + emptyCount + "/" + this.infoBuffer.length + "=" + emptyLevel + " @" + this.refillAt);

        if (emptyLevel >= this.refillAt) {
            // console.log("[" + this.name + "].checkRefill(): start refilling");
            this.getUrls(false);
        }
    }

    /**
     * 
     * @param {MessageEvent} request 
     */
    processRequest(request) { 
        if (request.data.getNewContent) {
            this.getNewContent();
        } else if (request.data.name) {
            this.name = request.data.name;
            // console.log("PexelsUrlLoader = [" + this.name + "]");
        } else {
            console.error('[' + this.name + '].processRequest(): unkown request: ' + Object.getOwnPropertyNames( request.data ) + Object.getPropertyValues( request.data ) );
        }

    }

    /**
     * Must be implemented by sub class to produce Urls wich are then added by calling addUrlContent
     * @param {boolean} rerequestIfBusy if false the promise resolves as soon as the current request is done, otherwise a new request is started first
     * @returns {Promise<void>}
     */
    async getUrls(rerequestIfBusy) {
        throw new Error('[' + this.name + '].getUrls is not implemented');
    }

    /**
     * Called by sub class with new content. If "promises" exist, they are "fullfilled", otherwise the content is added to the infoBuffer.
     * @param {{title: string, description: string, uri: string, userUri: string, date: Date }} newContentInfo
     */
    addUrlContent(newContentInfo) {
        // console.log("[" + this.name + "].addUrlContent(): [" + this.firstFreeBuffer + "," + this.firstFullBuffer + "/" + this.infoBuffer.length + "," + this.promises + "]" );

        if (this.promises) {
            this.promises--;
            postMessage({contentInfo: newContentInfo});
            // console.log("[" + this.name + "].addUrlContent(): [" + this.firstFreeBuffer + "," + this.firstFullBuffer + "/" + this.infoBuffer.length + "]{" + this.promises + "} = " + JSON.stringify(newContentInfo)  )
        } else {
            // Grow buffer if full, otherwise place content at firstFreeBuffer 
            const iBuffer = this.firstFreeBuffer == this.firstFullBuffer ? this.infoBuffer.length : this.firstFreeBuffer;
            this.infoBuffer[iBuffer] = newContentInfo;

            if (this.firstFreeBuffer != this.firstFullBuffer) {
                if (this.firstFullBuffer < 0) {
                    this.firstFullBuffer = this.firstFreeBuffer;
                }
                this.firstFreeBuffer = (this.firstFreeBuffer + 1) % this.infoBuffer.length;
            }
            // console.log("[" + this.name + "].handlePhotoList(): [" + this.firstFreeBuffer + "," + this.firstFullBuffer + "/" + this.infoBuffer.length + "][" + iBuffer + "] = " + JSON.stringify(newContentInfo)  )
        }
    }

    flush() {
        // console.log("[" + this.name + "].flush(): [" + this.firstFreeBuffer + "=0," + this.firstFullBuffer + "=-1/" + this.infoBuffer.length + "," + this.promises + "]" );
        this.firstFreeBuffer = 0;
        this.firstFullBuffer = -1;
        this.getUrls(true);
    }
    
}
