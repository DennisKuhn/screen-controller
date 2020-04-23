/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use strict';

// eslint-disable-next-line import/no-unresolved
import FileLoaderWorker from 'worker-loader!./fileloader';

import WpeOnDemandProducer from './wpeondemandproducer';
import { BufferStates } from './contentproducer';

import logo from './logos/hdd.svg';

let producedVideos = 0;

/**
 * Get fileloader to load video from local drive, then loads the video into a Video Element.
 */
class VideoPreloadInfo {
    loaded() {
        // console.log( "VideoPreloadInfo[" + this.iBuffer + "].loaded(" + this._content.uri + ")");
        try {
            this.video.src = this._content.uri;
            this.video.load();
        } catch (ex) {
            console.error('VideoPreloadInfo.loaded: video.load: ' + ex );
        }

        this.video.play().then( 
            () => {
                let pausedVideo = false;
                // console.log("VideoPreloadInfo[" + this.iBuffer + "].loaded(" + this._content.uri + "): video.playED");
                try {
                    this.video.pause();
                    pausedVideo = true;
                } catch (ex) {
                    console.error('VideoPreloadInfo[].loaded: video.pause: ', ex );
                }
                // console.log("VideoPreloadInfo[" + this.iBuffer + "].loaded(" + this._content.uri + "): video.pausED");
                if (pausedVideo) {
                    this.onLoaded(this.iBuffer, true, this.video);
                    this.createVideo();
                } else {
                    console.error('VideoPreloadInfo[' + this.iBuffer + '].loaded(' + this._content.uri + '): video.pause FAILED' );
                    this.processor.postMessage( {revokeUri: this._content.uri} );
                    this.onLoaded(this.iBuffer, false);
                }
            },
            reason => {
                if (this.abortLoad) {
                    console.warn('VideoPreloadInfo[' + this.iBuffer + '].loaded(): video.play abort: ' + this.content.uri + ' - ' + this.content._originalUri);
                    this.abortLoad = false;
                } else {
                    console.error('VideoPreloadInfo[' + this.iBuffer + '].loaded(' + this._content.uri + '): video.play FAILED: ' + reason + ': ' + this.content._originalUri);
                }
                this.processor.postMessage( {revokeUri: this._content.uri} );
                this.onLoaded(this.iBuffer, false);
            }
        );
    }

    createVideo() {
        this.video = document.createElement( 'video' );
        this.video.loop = true;
        this.video.volume = 0;
        this.video.poster = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        const css = {
            // 'position': 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'contain'
        };
        for ( const i in css ) {
            this.video.style[i] = css[ i ];
        }
    }


    onProcessorMessage(e) {
        // console.log( "VideoPreloadInfo[" + this.iBuffer + "].onProcessorMessage: " + e.data.dataUri );
        this._content.uri = e.data.dataUri;
        this._content.setLoaded();

        this.loaded();
    }


    /**
     * 
     * @param {ErrorEvent} ev 
     */
    onProcessorError( ev ) {
        console.error(
            `'VideoPreloadInfo[${this.iBuffer}][${producedVideos}].onProcessorError(): ${ev.message} - file: ${this.content ? this.content._originalUri : 'null-content'}`
        );
        // copyToClipboard(this.content._originalUri);
        this.onLoaded(this.iBuffer, false);
    }

    /**
     * 
     * @param {number} iBuffer 
     * @param {(iBuffer:number, success:boolean, video:string) => void} onLoaded 
     */
    constructor(iBuffer, onLoaded) {
        this.abortLoad = false;
        this.onLoaded = onLoaded;
        this.iBuffer = iBuffer;
        this._content = null;
        this.video = null;
        this.processor = new FileLoaderWorker({name: 'VideoLoader-' + iBuffer });
        this.processor.postMessage({name: 'VideoLoader-' + iBuffer });
        this.processor.onmessage = e => this.onProcessorMessage( e );
        this.processor.onerror = ev => this.onProcessorError( ev );

        this.createVideo();
    }

    get content() {
        return this._content; 
    }
    /**
     * @param {Content} newContent
     */
    set content(newContent) { 
        this._content = newContent;
        this._content.onFreeResources = content => this.processor.postMessage( {revokeUri: content._uri} ); 
        this._content.starter = content => {            
            content.element.play().then(
                () => {
                    //console.log("StartContent: Play video started: " + content.uri + ": " + content.originalUri )
                },
                reason => console.error('StartContent: This should not happen: Play video rejected: ' + reason )
            );
        };
        this._content.stopper = content => {
            try {
                content.element.pause();
            } catch (ex) {
                console.error('StopContent: This should not happen: Pause video threw: ' + ex );
            }
        };
        producedVideos++;
        this.processor.postMessage( {uri: this._content.uri });
    }

    abort() {
        if (this._content.uri == this._content._originalUri) {
            console.warn('VideoPreloadInfo[' + this.iBuffer + '].abort(): postMessage');
            this.processor.postMessage( {abortUri: this._content.uri} );
        } else {
            console.warn('VideoPreloadInfo[' + this.iBuffer + '].abort(): pause video');
            this.abortLoad = true;
            this.video.pause();
        }
    }
}

/**
 * @extends WpeOnDemandProducer
 */
class LocalVideoProducer extends WpeOnDemandProducer {
    bufferLoaded(iBuffer, success, video) {
        if (success) {
            this.onSuccessProduction(iBuffer, video);
        } else {
            this.onFailedProduction(iBuffer);
        }
    }

    constructor() {
        super(3, logo);

        this.preloadBuffer = new Array(this.bufferSize);

        for (let iBuffer=0; iBuffer < this.bufferSize; iBuffer++) {
            this.preloadBuffer[iBuffer] = new VideoPreloadInfo(iBuffer, (iBuffer, success, video) => this.bufferLoaded(iBuffer, success, video) );
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
    abortLoad(iBuffer, /*content*/) {
        console.warn(this.constructor.name + '.abortLoad( ' + iBuffer + ' )');
        this.preloadBuffer[iBuffer].abort();
    }
}

const localVideoProducer = new LocalVideoProducer();

export default localVideoProducer;