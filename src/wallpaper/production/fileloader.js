'use strict';
import { getPropertyValues } from '../utils/utils';
const context = self;


/**
 * Thread to async load a file from the local hard drive
 */
class FileLoader {
    constructor() {
        this.abortUri = '';
        this.createdObjectUrls = [];
        this.originalUri = '';
        this.dataUri = '';
        this.loader = null;
        this.name = 'FileLoader';
        this.createLoader();
        context.onmessage = e => this.processRequest(e);
    }

    createLoader() {
        this.loader = new XMLHttpRequest(); 
        this.loader.responseType = 'blob';

        this.loader.onload = e => this.loaded(e);
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
            // console.warn(`${this.name}.onabort():  abortUri=${this.abortUri} status:${this.loader.status}: ${this.loader.statusText} - file: ${this.originalUri}`, e);
        } else {
            // console.error(`${this.name}.onabort(): status:${this.loader.status}: ${this.loader.statusText} - file: ${this.originalUri}`, e);
            throw new Error('[' + this.name + '].onabort(): ' +  + this.loader.status + ': ' + this.loader.statusText + ': ' + this.originalUri);
        }
    }

    onerror( e ) {
        // console.error(`${this.name}.onerror(): status:${this.loader.status}: ${this.loader.statusText} - file: ${this.originalUri}`, e);
        throw new Error('[' + this.name + '].onerror(): ' + this.loader.status + ': ' + this.loader.statusText + ' - file: ' + this.originalUri);
    }

    loaded(e) {
        const loadedUri = this.originalUri;
        //console.log("FileLoader.loaded: "  + " headers:" + this.loader.getAllResponseHeaders() + " : " + this.originalUri);
        this.dataUri = URL.createObjectURL(this.loader.response);

        if ( ! [0, 200].includes(this.loader.status)) {
            console.warn('[' + this.name + '].loaded(): ' + this.loader.status + ': ' + this.loader.statusText + ': ' + this.dataUri + ': ' + this.originalUri);
        }
        this.createdObjectUrls.push(this.dataUri);

        if (this.abortUri == loadedUri) {
            console.warn('[' + this.name + ']: loaded(' + loadedUri + ') == abortUri)');
            this.revoke(this.dataUri);
            this.abortUri = '';
        } else {
            // console.log(`[${this.name}].loaded[${this.createdObjectUrls.length}]: ${this.dataUri} ${(performance.now() / 1000).toFixed(3)}: ${this.originalUri}`);
            postMessage( {dataUri: this.dataUri} );
        }
        this.dataUri = null;
    }

    revoke(revokeUri) {
        // console.log(`[${this.name}].revoke( ${revokeUri} ) ${(performance.now() / 1000).toFixed(3)}`);
        
        // console.log("[" + this.name + "].revoke( " + revokeUri + " ) NOT REVOKING");
        URL.revokeObjectURL(revokeUri);
        
        const iUrl = this.createdObjectUrls.indexOf(revokeUri);

        if (iUrl < 0) {
            console.error('[' + this.name + ']: revoke[' + this.createdObjectUrls.length + ']: can not find: ' + revokeUri);
        } else {
            // console.log(`[${this.name}].revoke[${iUrl}, ${this.createdObjectUrls.length}]: ${revokeUri} ${(performance.now() / 1000).toFixed(3)}: ${this.originalUri}`);
            this.createdObjectUrls.splice(iUrl, 1);
        }
        if (this.createdObjectUrls.length > 10) {
            console.error('[' + this.name + ']: revoke: Objects=' + this.createdObjectUrls.length );
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
        if (request.data.uri) {
            this.load(request.data.uri);
        } else if (request.data.revokeUri) {
            this.revoke(request.data.revokeUri);
        } else if ( request.data.abortUri) {
            this.abort(request.data.abortUri);
        } else if (request.data.name) {
            this.name = request.data.name;
            // console.log("FileLoader = [" + this.name + "]");
        } else {
            console.error('[' + this.name + '].processRequest(): unkown request: ' + Object.getOwnPropertyNames( request.data ) + Object.getPropertyValues( request.data ) );
        }
        // console.log(window.localStorage.getItem( 'fbaccesstoken' ));
    }
    
}

const loader = new FileLoader();