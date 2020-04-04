'use strict';

let producedImages = 0;

/**
 * 
 */
class ImagePreloadInfo {
    loaded(e) {
        // console.log("ImagePreloadInfo[" + this.iBuffer + "].loaded: " + this._content.uri );
        this._content.setDecoded();
        this.image.onerror = null;
        this.image.onload = null;

        if (this.abortLoad) {
            console.warn('ImagePreloadInfo[' + this.name + '].loaded.decoded abort: ' + this._content.uri);
            this.abortLoad = false;
            this.onLoaded(this.iBuffer, false);
        } else {
            // console.log("ImagePreloadInfo[" + this.iBuffer + "].loaded.decoded: " + this._content.uri );
            this.onLoaded(this.iBuffer, true, this.image);            
        }
        this.createImage();
    }

    createImage() {
        this.image = document.createElement('CANVAS');

        this.image.onerror = event => {
            console.error('ImagePreloadInfo.onError[' + this.name + ']: ' + event + ': ' + JSON.stringify(event)  + ': ' + this.content.uri + ': ' + this.content._originalUri );
            this.onLoaded(this.iBuffer, false);
        };

        this.image.width = this.width;
        this.image.height = this.height;
        const css = {
            position: 'absolute',
            width: this.width,
            height: this.height,
            objectFit: 'contain',
            //            'mixBlendMode': this.blend,
            //            'opacity': this._opacity,
            //            'filter': 'blur('+this.blur+'px)',
        };
        for ( const i in css ) {
            this.image.style[ i ] = css[ i ];
        }
    }

    onProcessorMessage(e) {
        // console.log( "ImagePreloadInfo[" + this.name + "].onProcessorMessage: ", e );
        // this._content.uri = e.data.originalUri;
        this._content.setLoaded();

        this._content.data = { bitmap: e.data.bitmap, height: e.data.height, width: e.data.width, offsetX: e.data.offsetX, offsetY: e.data.offsetY };

        this.loaded();
    }


    /**
     * 
     * @param {ErrorEvent} ev 
     */
    onProcessorError( ev ) {
        console.error(`ImagePreloadInfo[${this.name}][${producedImages}].onProcessorError(): ${ev.message} - file: ${this.content._originalUri}`, ev);
        // copyToClipboard(this.content._originalUri);
        setTimeout(
            () => this.onLoaded(this.iBuffer, false),
            5000 
        );
    }

    constructor(iBuffer, onLoaded, name) {
        this.name = name + '-ImageLoader-' + iBuffer;
        this.abortLoad = false;
        this.iBuffer = iBuffer;
        this.onLoaded = onLoaded;
        this._content = null;
        this.image = null; 
        this.createImage();
        this.processor = new Worker('production/imageloader.js', {name: this.name });
        this.width = 0;
        this.height = 0;

        if (this.processor) {
            this.processor.postMessage({name: this.name});
            this.processor.onmessage = e => this.onProcessorMessage( e );
            this.processor.onerror = ev => this.onProcessorError( ev );
        } else {
            console.error('ImagePreloadInfo[' + this.name + '] can\'t create processor!');
        }
    }

    /**
     * @returns {Content}
     */
    get content() {
        return this._content; 
    }
    set content(newContent) {        
        this._content = newContent;
        this._content.onFreeResources = content => content.data.bitmap.close();
        this._content.attacher = content => {            
            setTimeout(
                content => {
                    const destinationContext = content.element.getContext('2d');
                    destinationContext.drawImage(
                        content.data.bitmap,
                        content.data.offsetX,
                        content.data.offsetY,
                        content.data.width,
                        content.data.height
                    );
                },
                1,
                newContent
            );
        };
        producedImages++;
        this.processor.postMessage( {uri: this._content.uri });
    }

    abort() {
        if (this._content.uri == this._content._originalUri) {
            console.warn('ImagePreloadInfo[' + this.name + '].abort(): postMesage');
            this.processor.postMessage( {abortUri: this._content.uri} );
        } else {
            console.warn('ImagePreloadInfo[' + this.name + '].abort()');
            this.abortLoad = true;
        }
    }

    /**
     * Size of the content 
     * @param {number} width 
     * @param {number} height 
     */
    setSize(width,height) {
        // console.log(`${this.name}.setSize(${width},${height}) posting` );
        this.width = width;
        this.height = height;
        this.createImage();
        
        this.processor.postMessage({width: width, height: height });
    }
}
