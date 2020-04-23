/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use strict';

import Content from '../content';
import ContentProducer, {BufferStates} from './contentproducer';
import ImagePreloadInfo from './imagepreloadinfo';

/**
 * Base class for producers using an own UrlLoader. 
 * LoaderProducer handles the content retrieval using FileLoader and
 * Content creation using ImagePreloadInfo (NOT YET and VideoPreloadInfo)
 *   @extends ContentProducer
 */
export default class LoaderProducer extends ContentProducer {
    /**
     * 
     * @param {number} bufferSize used by this producer.
     * @param {string} logo name of logo image in production/logos
     * @param {Worker} loader Worker to load Urls
     */
    constructor(bufferSize, logo, loader) {
        super(bufferSize, logo);
        // console.log("LoaderProducer.constructor(): bufferSize=" + this.bufferSize);

        this.urlLoader = loader;
        
        this.urlLoader.onmessage = e => this.onUrlLoaderMessage( e.data );
        this.urlLoader.onerror = ev => this.onUrlLoaderError( ev );

        this.preloadBuffer = new Array(this.bufferSize);

        for (let iBuffer=0; iBuffer < this.bufferSize; iBuffer++) {
            this.preloadBuffer[iBuffer] = new ImagePreloadInfo(iBuffer, (iBuffer, success, image) => this.bufferLoaded(iBuffer, success, image), this.constructor.name );
        }
    }

    onBuffered(iBuffer, content) {       
        // console.log( "LoaderProducer.onBuffered(" + iBuffer + ", content)" );       
        this.setBufferState(iBuffer, BufferStates.loading);
        this.preloadBuffer[iBuffer].content = content;
    }

    /**
     * 
     * @param {number} iBuffer 
     * @param {Content} content 
     */
    abortLoad(iBuffer /*, content*/) {
        console.warn(this.constructor.name + '.abortLoad( ' + iBuffer + ' )');
        this.preloadBuffer[iBuffer].abort();
    }

    bufferLoaded(iBuffer, success, image) {
        if (this.bufferStates[iBuffer] != BufferStates.loading ) {
            console.error('LoaderProducer.bufferLoaded(' + [ iBuffer, success ] + '): State=' + this.bufferStates[iBuffer] );
        }
        if (success) {
            this.onSuccessProduction(iBuffer, image );
        } else {
            this.onFailedProduction(iBuffer);
        }
    }

    /**
     * 
     * @param {{contentInfo: {uri: string, title: string, description: string, date: Date, userUri: string}}} data 
     */
    onUrlLoaderMessage(data) {
        // console.log( "LoaderProducer.onUrlLoaderMessage: " + data.contentInfo.title );
        const content = new Content(
            this,
            data.contentInfo.uri,
            data.contentInfo.title,
            data.contentInfo.description,
            data.contentInfo.userUri,
            data.contentInfo.date ? new Date(data.contentInfo.date) : data.contentInfo.date
        );
        this.addToBuffer(content);
    }


    /**
     * 
     * @param {ErrorEvent} ev 
     */
    onUrlLoaderError( ev ) {
        console.error('LoaderProducer.onUrlLoaderError(): ' + ev.message );
    }

    produce() {
        this.urlLoader.postMessage({getNewContent: true});
    }

    /**
     * Size of the content 
     * @param {number} width 
     * @param {number} height 
     */
    setSize(width,height) {
        super.setSize(width, height);
        // console.log(`LoaderProducer.setSize(${width},${height})`, this.preloadBuffer );
        this.preloadBuffer.forEach( preloader => preloader.setSize(width,height) );
    }
}
