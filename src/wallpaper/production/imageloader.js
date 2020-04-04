'use strict';

const context = self;

/**
 * Thread to async load an image
 */
class ImageLoader {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.ratio = 0;

        this.originalBitmap = null;
        this.originalRatio = 0;


        this.abortUri = '';
        this.originalUri = '';
        this.loader = null;
        this.name = 'ImageLoader';
        this.createLoader();
        context.onmessage = e => this.processRequest(e);
    }

    createLoader() {
        this.loader = new XMLHttpRequest(); 
        this.loader.responseType = 'blob';

        this.loader.onload = e => this.loaded(e).catch( reason => setTimeout( () => {
            throw reason; 
        }, 1)  );
        this.loader.onreadystatechange = e => this.readyStateChanged(e);
        this.loader.onabort = e => this.onabort(e);
        this.loader.onerror = e => this.onerror(e);
    }

    readyStateChanged( e ) {
        if (this.loader.readyState > 4 || this.loader.readyState < 0) {
            console.error( '[' + this.name + '].readyStateChanged(' + getPropertyValues( e ) + '):'+ this.loader.readyState);
        }
    }

    onabort( e ) {
        if (this.abortUri) {
            console.warn('[' + this.name + '].onabort(): abortUri= ' + this.abortUri + ' :' + this.loader.status + ':' + this.loader.statusText + ': ' + this.originalUri);
        } else {
            console.error( '[' + this.name + '].onabort(): ' +  + this.loader.status + ': ' + this.loader.statusText + ': ' + this.originalUri);
            throw new Error('[' + this.name + '].onabort(): ' +  + this.loader.status + ': ' + this.loader.statusText + ': ' + this.originalUri);
        }
    }

    onerror( e ) {
        console.error('[' + this.name + '].onerror(): ' + this.loader.status + ': ' + this.loader.statusText + ' - file: ' + this.originalUri);
        throw new Error('[' + this.name + '].onerror(): ' + this.loader.status + ': ' + this.loader.statusText + ' - file: ' + this.originalUri);
    }

    async loaded(e) {
        if ( ! [0, 200].includes(this.loader.status)) {
            console.warn('[' + this.name + '].loaded(): ' + this.loader.status + ': ' + this.loader.statusText + ': ' + this.originalUri);
        }
        //console.log("ImageLoader.loaded: "  + " headers:" + this.loader.getAllResponseHeaders() + " : " + this.originalUri);


        try {
            this.originalBitmap = null;
            this.originalBitmap = await createImageBitmap( this.loader.response );
            this.originalRatio = this.originalBitmap.height / this.originalBitmap.width;
        } catch (decodeException) {
            // console.error(`[${this.name}].loaded: caught: `, decodeException );
            throw decodeException;
        }

        if (this.originalBitmap && this.ratio) {
            await this.scaleAndPost();
        }
    }

    async scaleAndPost() {
        let targetHeight = this.height;
        let targetWidth = this.width;

        if ( this.ratio < this.originalRatio) {
            targetWidth = targetHeight / this.originalRatio;
        } else {
            targetHeight = targetWidth * this.originalRatio;
        }
        try {
            const bitmap = await createImageBitmap(this.loader.response, { resizeWidth: targetWidth, resizeHeight: targetHeight, resizeQuality: 'high' });

            if (this.abortUri == this.originalUri) {
                console.warn('[' + this.name + ']: loaded(' + this.originalUri + ') == abortUri)');
                this.abortUri = '';
                bitmap.close();
            } else {
                // console.log("[" + this.name + "].loaded: " + (performance.now() / 1000).toFixed(3) + ": " + this.originalUri);
                postMessage( {originalUri: this.originalUri, height: targetHeight, width: targetWidth, offsetX: ((this.width - targetWidth) / 2), offsetY: ((this.height - targetHeight) / 2), bitmap}, [bitmap] );
            }
        } catch (scaleException) {
            console.error(`[${this.name}].scaleAndPost: caught: `, scaleException );
            throw scaleException;
        } finally {
            this.originalUri = '';
            this.originalBitmap.close();
            this.originalBitmap = null;
            this.originalRatio = 0;
        }
    }

    load(originalUri) {
        this.originalUri = originalUri;
        // console.log("[" + this.name + "].load( " + this.originalUri + " )");
        this.loader.open('GET', this.originalUri, true);
        this.loader.send();
    }

    abort(originalUri) {
        if (originalUri == this.originalUri) {
            console.warn('[' + this.name + ']: cancel(' + originalUri + ')' );
            this.abortUri = originalUri;
            this.loader.abort();
        } else {
            console.error('[' + this.name + ']: cancel(' + originalUri + ') != ' + this.originalUri );
        }
    }

    /**
     * 
     * @param {MessageEvent} request 
     */
    processRequest(request) { 
        // console.log("[" + this.name + "].processRequest:", request );
        if (request.data.uri) {
            this.load(request.data.uri);
        } else if ( request.data.abortUri) {
            this.abort(request.data.abortUri);
        } else {
            if (request.data.name) {
                this.name = request.data.name;
            }
            if (request.data.height && request.data.width) {
                // console.log("[" + this.name + "].setSize:", request );
                this.height = request.data.height;
                this.width = request.data.width;
                this.ratio = this.height / this.width;
                if (this.originalRatio) {
                    this.scaleAndPost().catch( reason => {
                        throw reason;
                    }  );
                }
            }
            if ( !(request.data.uri || request.data.abortUri || request.data.name || (request.data.height && request.data.width) )) {
                console.error('[' + this.name + '].processRequest(): unkown request: ', request.data, request );
            }
        }
    }    
}

const loader = new ImageLoader();