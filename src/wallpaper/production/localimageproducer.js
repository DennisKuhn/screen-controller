'use strict';

import WpeOnDemandProducer from './wpeondemandproducer';

/**
 * @extends WpeOnDemandProducer
 */
export default class LocalImageProducer extends WpeOnDemandProducer {
    bufferLoaded(iBuffer, success, image) {
        if (this.bufferStates[iBuffer] != BufferStates.loading ) {
            console.error('LocalImageProducer.bufferLoaded(' + [ iBuffer, success ] + '): State=' + this.bufferStates[iBuffer] );
        }
        if (success) {
            this.onSuccessProduction(iBuffer, image );
        } else {
            this.onFailedProduction(iBuffer);
        }
    }

    constructor() {
        super(3, 'hdd.svg');

        this.preloadBuffer = new Array(this.bufferSize);

        for (let iBuffer=0; iBuffer < this.bufferSize; iBuffer++) {
            this.preloadBuffer[iBuffer] = new ImagePreloadInfo(iBuffer, (iBuffer, success, image) => this.bufferLoaded(iBuffer, success, image), this.constructor.name );
        }
    }

    onBuffered(iBuffer, content) {        
        this.setBufferState(iBuffer, BufferStates.loading);
        this.preloadBuffer[iBuffer].content = content;
    }

    /**
     * 
     * @param {number} iBuffer 
     * @param {Content} content 
     */
    abortLoad(iBuffer, content) {
        console.warn(this.constructor.name + '.abortLoad( ' + iBuffer + ' )');
        this.preloadBuffer[iBuffer].abort();
    }

    /**
     * Size of the content 
     * @param {number} width 
     * @param {number} height 
     */
    setSize(width,height) {
        super.setSize(width, height);
        // console.log(`LocalImageProducer.setSize(${width},${height})`, this.preloadBuffer );
        this.preloadBuffer.forEach( preloader => preloader.setSize(width,height) );
    }

}

const localImageProducer = new LocalImageProducer();