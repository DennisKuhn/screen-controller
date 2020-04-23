'use strict';

import delayed from '../utils/delayed';
import conSup from './contentsupplier';

export const BufferStates = {
    empty: '&#x25A2;',
    url: '&#x1f517;',
    loading: '&#x21E9;',
    loaded: '&#x2713;'
};

/**
 * Contains resolve and reject for an accepted promise.
 */
class PromiseInfo {
    constructor(resolve, reject) {
        this.resolve = resolve;
        this.reject = reject;
    }
}

/**
 * Base class for all content producers, like local images. Handles buffering and delivery request from ContentSupplier.
 */
export default class ContentProducer {
    /**
     * 
     * @param {number} bufferSize used by this producer.
     * @param {string} logo name of logo image in production/logos
     */
    constructor(bufferSize, logo) {
        this.promises = [];
        this.totalPromises = 0;

        this._width = -1;
        this._height = -1;

        this.bufferSize = bufferSize;
        this.buffer = new Array(this.bufferSize);
        this.bufferStates = new Array(this.bufferSize);
        for (let iBuffer = 0; iBuffer < this.bufferSize; iBuffer++) {
            this.bufferStates[iBuffer] = BufferStates.empty;
        }

        this.toBeProduced = this.bufferSize;

        this.production = new delayed(() => {
            this.produce();
            this.toBeProduced -= 1;

            if (this.toBeProduced > 0) {
                this.production.trigger();
            }
        }, 1);

        this._weight = 1;

        this._excludeFilter = '';
        this._includeFilter = '';
        this._filter = '';

        this._promiseCell = null;
        this._monitorCells = [];

        this.initialised = false;

        this._logo = logo;
    }

    /**
     * Size of the content 
     * @param {number} width 
     * @param {number} height 
     */
    setSize(width, height) {
        // console.log(`ContentProducer[${this.constructor.name}].setSize(${width},${height})`);
        this._width = width;
        this._height = height;
    }

    get logo() {
        return this._logo; 
    }
    set logo(newlogo) {
        this._logo = newlogo; 
    }

    /**
     * @returns {number}
     */
    get weight() {
        return this._weight; 
    }
    /**
     * @param {number} newWeight
     */
    set weight(newWeight) {
        if (newWeight != this._weight) {
            this._weight = newWeight;

            if (this.initialised) {
                conSup.updateWeight(this);
            }
        }
    }

    /**
     * 
     * @param {number} iBuffer 
     * @param {BufferStates} newState 
     */
    setBufferState(iBuffer, newState) {
        this.bufferStates[iBuffer] = newState;

        if (this._monitorCells.length > 0) {
            this._promiseCell.innerText = this.promises.length + '/' + this.totalPromises;
            this._monitorCells[iBuffer].innerHTML = newState;
        }
        if (this.promises.length && newState == BufferStates.loaded) {
            const firstPromise = this.promises.pop();
            const content = this.buffer[iBuffer];

            this.buffer[iBuffer] = null;
            this.setBufferState(iBuffer, BufferStates.empty);
            this.toBeProduced += 1;
            // console.log("ContentProducer.setBufferState(): trigger production=" + this.toBeProduced);
            this.production.trigger();

            firstPromise.resolve(content);
        }
    }

    get promiseCell() {
        return this._promiseCell; 
    }
    set promiseCell(cell) {
        this._promiseCell = cell;
        if (this._promiseCell && this._monitorCells.length) {
            this.initMonitor();
        }
    }

    get monitorCells() {
        return this._monitorCells; 
    }
    set monitorCells(cells) {
        this._monitorCells = cells;
        if (this._promiseCell && this._monitorCells.length) {
            this.initMonitor();
        }
    }

    initMonitor() {
        // console.log(this.constructor.name + ".init() excludeFilter = " + this._excludeFilter);
        this._promiseCell.innerText = this.promises.length;
        for (let iBuffer = 0; iBuffer < this.bufferSize; iBuffer++) {
            this._monitorCells[iBuffer].innerHTML = this.bufferStates[iBuffer];
        }
    }

    init() {
        this.production.trigger();

        this.registerWithSupplier();
        this.initialised = true;
    }

    /**
     * The last applied filter, e.g. last excludeFilter or includeFilter having a value
     * @returns {string}
     */
    get filter() {
        return this._filter; 
    }

    /**
     * @returns {string}
     */
    get excludeFilter() {
        return this._excludeFilter; 
    }
    /**
     * @param {string} filterString
     */
    set excludeFilter(filterString) {
        this._excludeFilter = filterString; if (this._excludeFilter) this._filter = this._excludeFilter; 
    }

    /**
     * @returns {string}
     */
    get includeFilter() {
        return this._includeFilter; 
    }
    /**
     * @param {string} filterString
     */
    set includeFilter(filterString) {
        this._includeFilter = filterString; if (this._includeFilter) this._filter = this._includeFilter; 
    }

    /**
     * Empties the buffer and restarts production. Usually after a  filter change.
     */
    flush() {
        for (let iBuffer = 0; iBuffer < this.bufferSize; iBuffer++) {
            const content = this.buffer[iBuffer];

            switch (this.bufferStates[iBuffer]) {
                case BufferStates.empty:
                    break;
                case BufferStates.url:
                    console.error(this.constructor.name + '.flush()[' + iBuffer + '] state=uri WHAT TO DO');
                    content.freeResources();
                    break;
                case BufferStates.loading:
                    console.warn(this.constructor.name + '.flush()[' + iBuffer + '] state=loading');
                    this.abortLoad(iBuffer, content);
                    break;
                case BufferStates.loaded:
                    content.freeResources();
                    break;
            }
            if (this.bufferStates[iBuffer] != BufferStates.empty) {
                this.setBufferState(iBuffer, BufferStates.empty);
            }
        }
        this.toBeProduced = this.bufferSize;
        this.production.trigger();
    }

    /**
     * Appends a Promise to this.promises which are resolved by setBufferState( , Loaded )
     * @param {(content) => void} resolve 
     * @param {(reason) => void} reject 
     */
    promiser(resolve, reject) {
        this.totalPromises++;
        this.promises.unshift(new PromiseInfo(resolve, reject));
    }

    /**
     * Called by ContentSupplier to get content
     */
    deliver() {
        let promise = null;
        let content = null;

        for (let iBuffer = 0; iBuffer < this.bufferSize; iBuffer++) {
            if (this.bufferStates[iBuffer] == BufferStates.loaded) {
                content = this.buffer[iBuffer];
                // console.log(this.constructor.name + ".deliver(): Found buffer " + iBuffer + " = " + content);
                this.buffer[iBuffer] = null;
                this.setBufferState(iBuffer, BufferStates.empty);
                break;
            }
        }
        if (!content) {
            console.warn(this.constructor.name + '.deliver(): [' + this.bufferStates + '] empty buffer');

            promise = new Promise((resolve, reject) => this.promiser(resolve, reject));
        } else {
            promise = new Promise((resolve, reject) => {
                this.toBeProduced += 1;
                // console.log("ContentProducer.deliver(): trigger production=" + this.toBeProduced);
                this.production.trigger();
                resolve(content);
            });
        }
        return promise;
    }

    registerWithSupplier() {
        const size = conSup.register(this);
        if (size.width && size.height) {
            this.setSize(size.width, size.height);
        }
    }

    /**
     * Adds a new Content to the buffer, sets state to BufferStates.url. 
     * Finally calls onBuffered, to let subclass verify and preload content.
     * @param {Content} content 
     */
    addToBuffer(content) {
        let stored = false;

        for (let iBuffer = 0; iBuffer < this.bufferSize; iBuffer++) {
            if (this.bufferStates[iBuffer] == BufferStates.empty) {
                this.buffer[iBuffer] = content;
                this.setBufferState(iBuffer, BufferStates.url);
                content.setBuffered();
                this.onBuffered(iBuffer, content);
                stored = true;
                break;
            }
        }
        if (!stored) {
            content.freeResources();
            console.error(this.constructor.name + '.ContentProducer.addToBuffer(): [' + this.bufferStates + ']: NO SPACE FOR: ' + content.uri + ' (' + content.originalUri + ')');
        }
    }

    /**
     * Called by subclass when produced contentElement for this.buffer[iBuffer].element, bufferState is set to loaded 
     * @param {number} iBuffer 
     * @param {HTMLElement} contentElement 
     */
    onSuccessProduction(iBuffer, contentElement) {
        // console.log( this.constructor.name + ".onSuccessProduction(" + iBuffer + ", " + contentElement + ")" );
        this.buffer[iBuffer].element = contentElement;
        this.setBufferState(iBuffer, BufferStates.loaded);
    }

    /**
     * Called by sub class is production of a buffer failed, 
     * causes the buffer to be emptied and one production to be triggered.
     * @param {number} iBuffer 
     */
    onFailedProduction(iBuffer) {
        // console.warn(this.constructor.name + ".onFailedProduction("+iBuffer+")")
        this.setBufferState(iBuffer, BufferStates.empty);
        this.toBeProduced += 1;
        this.production.trigger();
    }

    /**
     * Called by this.production.trigger(). Must be implemented by sub class and start producing one Content.
     * The Content is added by calling addToBuffer(content).
     */
    produce() {
        console.error(this.constructor.name + ' NEEDS TO IMPLEMENT produce');
    }

    /**
     * Called when new Content is added to the buffer. The subclass implements it to preload/verify
     * the content:
     * - call this.setBufferState(iBuffer, BufferStates.loading)
     * - preload content to contentElement, e.g. Image/Video HMTLElement
     * -- if successfull, call this.onSuccessProduction(iBuffer, contentElement )  
     * -- if failed, call this.onFailedProduction(iBuffer )  
     * @param {number} iBuffer 
     * @param {Content} content 
     */
    onBuffered(iBuffer, content) {
        console.error(this.constructor.name + ' NEEDS TO IMPLEMENT onBuffered');
    }

    /**
     * Implemented by sub class to cancel a loading buffer
     * @param {number} iBuffer 
     * @param {Content} content 
     */
    abortLoad(iBuffer, content) {
        console.error(this.constructor.name + ' NEEDS TO IMPLEMENT abortLoad');
    }
}