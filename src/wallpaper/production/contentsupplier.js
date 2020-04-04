'use strict';

import delayed from '../utils/delayed';

/**
 * 
 */
class ContentSupplier {
    constructor() {
        this.buffer = [];
        this.producerBufferSize = 1;

        this.producers = [];
        this.totalWeight = 0;
        this.maxSuppliedBatches = 0;
        this.maxProducedBatches = 0;
        this.maxProducerBuffer = 0;

        this.promiseRejects = [];
        this.promiseResolves = [];
        this.getContent = new delayed( () => this.triggerProducer() );
        this.toBeProduced = [];

        this.width = 0;
        this.height = 0;

        /**
         * @type {HTMLTableDataCellElement[]}
         */
        this.monitorCells = [];
        /**
         * @type {HTMLTableDataCellElement[]}
         */
        this.producerCells = [];
        /**
         * @type {HTMLTableDataCellElement[]}
         */
        this.requestedCells = [];
        /**
         * @type {HTMLTableDataCellElement[]}
         */
        this.batchesCells = [];
        /**
         * @type {HTMLTableDataCellElement[]}
         */
        this.totalCells = [];
        
    }

    init() {
        this.producerCells = supplyMonitor.createMonitorRow('Producers', this.producers.length);

        /**
         * Create Buffer Status cells for Producers
         */
        for (let iBuffer=0; iBuffer < this.maxProducerBuffer; iBuffer++) {
            const bufferRow = supplyMonitor.createMonitorRow('Buffer' + iBuffer, this.producers.length);
            for (let iProducer=0; iProducer < this.producers.length; iProducer++) {
                this.producers[iProducer].bufferCells[iBuffer] = bufferRow[iProducer];
            }
        }
        const promiseCells = supplyMonitor.createMonitorRow('Promises', this.producers.length);
        for (let iProducer=0; iProducer < this.producers.length; iProducer++) {
            this.producers[iProducer].producer.promiseCell = promiseCells[iProducer];
            this.producers[iProducer].producer.monitorCells = this.producers[iProducer].bufferCells;
        }


        this.monitorCells = supplyMonitor.createMonitorRow('Supplier' + ' Buffer', this.producers.length + 1);
        for (let iBuffer=0; iBuffer < this.producers.length; iBuffer++) {
            this.monitorCells[iBuffer].innerHTML = '&#x25A2;';
        }
        this.monitorCells[this.producers.length].innerText = this.promiseResolves.length;

        this.requestedCells = supplyMonitor.createMonitorRow('Total Batches', this.producers.length);
        this.batchesCells = supplyMonitor.createMonitorRow('Current Batches', this.producers.length);
        this.totalCells = supplyMonitor.createMonitorRow('Total', this.producers.length);

        for (let iProducer=0; iProducer < this.producers.length; iProducer++) {
            const producerInfo = this.producers[iProducer];

            // console.log("ContentSupplier.init(): [ " + iProducer + " ].background = " + producerInfo.producer.logo);

            this.producerCells[iProducer].style.backgroundImage = 'url("' + producerInfo.producer.logo + '")';
            this.producerCells[iProducer].style.backgroundPosition = 'center';
            this.producerCells[iProducer].style.backgroundRepeat = 'no-repeat';
            this.producerCells[iProducer].style.backgroundSize = 'contain';

            if (producerInfo.weight) {
                this.requestedCells[iProducer].innerText = (producerInfo.produced / producerInfo.weight).toFixed(2);
                this.batchesCells[iProducer].innerText = (producerInfo.supplied / producerInfo.weight).toFixed(2);
                this.totalCells[iProducer].innerText = producerInfo.totalSupplied;
            } else {
                this.requestedCells[iProducer].innerText = '|' + producerInfo.produced + '|';
                this.batchesCells[iProducer].innerText = '|' + producerInfo.totalSupplied + '|';
                this.totalCells[iProducer].innerText = '|' + producerInfo.totalSupplied + '|';
            }
            for (let producerBuffer=0; producerBuffer < this.producerBufferSize; producerBuffer++) {
                this.toBeProduced.push(producerInfo);
            }
        }

        this.getContent.trigger();
    }


    /**
     * Flushes each registered producers, empties the buffer and requests delivery. Usually after a  filter change.
     */
    flush() {
        this.producers.forEach( info => info.producer.flush() );

        this.buffer.forEach( (buffer,iBuffer) => {
            if (buffer) {
                buffer.freeResources();
                this.emptyBuffer(iBuffer);
            }
        } );
    }

    /**
     * 
     * @param {content => void} resolve 
     * @param {reason => void} reject 
     */
    promiser(resolve, reject) {
        this.logFillLevel();
        this.promiseRejects.unshift(reject);
        this.promiseResolves.unshift(resolve);
    }


    getSupplyGap(content) {
        const producerInfo = this.producers.find( info => info.producer == content.producer );
        if ( producerInfo.weight) {
            const gap = (this.maxSuppliedBatches - (producerInfo.supplied / producerInfo.weight)) * producerInfo.weight;
            return gap;
        }
        return -1;
    }

    countSupply(content) {
        let sameBatch = 0;
        let noWeight = 0;

        this.producers.forEach((info, iProducer) => {
            if (info.producer == content.producer) {
                info.supplied += 1;
                info.totalSupplied += 1;
                this.batchesCells[iProducer].innerText = info.weight ? (info.supplied / info.weight).toFixed(2) : '|' + info.supplied + '|';
                this.totalCells[iProducer].innerText = info.totalSupplied;
            }
            if (info.weight) {
                const batches = info.supplied / info.weight;

                if (batches == this.maxSuppliedBatches) {
                    ++sameBatch;
                } else if (batches > this.maxSuppliedBatches) {
                    this.maxSuppliedBatches = batches;
                    sameBatch = 1;
                }
            } else {
                ++noWeight;
            }
        });
        if ((sameBatch + noWeight )== this.producers.length) {
            this.producers.forEach( (info, iProducer) => { 
                info.supplied = 0; 
                if (info.weight) {
                    this.batchesCells[iProducer].innerText = (info.supplied / info.weight).toFixed(2);
                } else {
                    this.batchesCells[iProducer].innerText = '|' + info.totalSupplied + '|';
                }
                //                this.suppliedCells[iProducer].innerText = 0;
            } );
            this.maxSuppliedBatches = 0;
        }
    }

    countProduced(content) {
        this.producers.forEach((info, iProducer) => {
            if (info.producer == content.producer) {
                info.produced += 1;
                info.totalProduced += 1;
                if (info.weight) {
                    this.requestedCells[iProducer].innerText = (info.produced / info.weight).toFixed(2);
                } else {
                    this.requestedCells[iProducer].innerText = '|' + info.produced + '|';
                }
                this.totalCells[iProducer].innerText = info.totalProduced;
            }
        });
    }

    /**
     * Called by consumer to receive content
     * @returns {Content}
     */
    supply() {
        let promise = null;
        let content = null;
        let buffer=-1; 
        let gap = -1;

        for (let iBuffer=0; iBuffer < this.buffer.length; iBuffer++) {
            if (this.buffer[iBuffer]) {
                const newGap = this.getSupplyGap(this.buffer[iBuffer]);
                if (newGap >= gap) {
                    buffer = iBuffer;
                    gap = newGap;
                    content = this.buffer[iBuffer];
                }
            }
        }
        if (!content) {            
            console.warn('ContentSupplier.supply(): Empty' );

            promise = new Promise( (resolve, reject) => this.promiser(resolve, reject) );
        } else {
            this.emptyBuffer(buffer);

            promise = new Promise( (resolve, reject) => {
                resolve(content); 
            } );
        }
        return promise;
    }

    /**
     * Size of the content 
     * @param {number} width 
     * @param {number} height 
     */
    setSize(width,height) {
        console.log(`ContentSupplier.setSize(${width},${height}): ${this.producers.length}`, this.producers);
        this.width = width;
        this.height = height;

        this.producers.forEach(
            producerInfo => {
                producerInfo.producer.setSize(width,height); 
            }
        );
    }

    getFirstProducerBuffer(producer) {
        let iBuffer = -1;

        for (let iProducer=0; iProducer < this.producers.length; iProducer++) {
            const info = this.producers[iProducer];
            
            if (info.producer == producer) {
                iBuffer = producer.iBuffer;
            }
            break;
        }
        return iBuffer;
    }

    triggerProducer() {
        this.toBeProduced.forEach( info => {
            info.producer.deliver().then( newContent => {
                // console.log("ContentSupplier.triggerProducer: delivered: " + info.producer.constructor.name );
                let stored = false;
                let iBuffer= info.iBuffer;

                for (; iBuffer < (info.iBuffer + this.producerBufferSize ); iBuffer++) {
                    if (! this.buffer[iBuffer]) {
                        this.buffer[iBuffer] = newContent;
                        stored = true;
                        break;
                    }
                }
                if (stored) {
                    // console.log("ContentSupplier.triggerProducer: delivered: " + iBuffer );
                    this.onNewContent(iBuffer, newContent);
                } else {
                    console.error('ContentSupplier.triggerProducer(): no room in buffer from ' + info.iBuffer + ' to ' + (info.iBuffer + this.producerBufferSize) );
                }
            });
        });
        this.toBeProduced.length = 0;
    }

    logFillLevel() {
        if (this.monitorCells.length > 0) {
            this.monitorCells[this.buffer.length].innerText = this.promiseResolves.length;

            for (let iBuffer=0; iBuffer < this.buffer.length; iBuffer++) {
                this.monitorCells[iBuffer].innerHTML = this.buffer[iBuffer] ? ((this.buffer[iBuffer].originalUri.substr(-5, 5 ) == '.webm')  ? '&#x1F39E;' : '&#x1f5bc;' ): '&#x25A2;';
            }
        }
    }

    /**
     * @param {number} iBuffer 
     */
    onNewContent(iBuffer, content) {
        // console.log( "ContentSupplier.onNewContent(" + iBuffer + "): promises=" + this.promiseResolves.length );
        this.countProduced(content);
        this.logFillLevel();
        if (this.promiseResolves.length) {
            const firstResolve = this.promiseResolves.pop();
            const firstReject = this.promiseRejects.pop();

            this.emptyBuffer(iBuffer);

            firstResolve(content);
        }
    }

    /**
     * Count supply, logFillLevel, buffer[iBuffer] = null, add producerInfo to toBeProduced and trigger getContent
     * @param {number} iBuffer 
     */
    emptyBuffer(iBuffer) {
        if (this.buffer[iBuffer]) {
            const producer = this.buffer[iBuffer].producer;
            this.countSupply(this.buffer[iBuffer]);
            this.buffer[iBuffer] = null;
            this.logFillLevel();
            this.producers.forEach(info => {
                if (info.producer == producer) {
                    this.toBeProduced.push(info);
                }
            });
            this.getContent.trigger();
        } else {
            console.error('ContentSupplier.emptyBuffer(' + iBuffer + '): is empty');
        }
    }


    /**
     * 
     * @param {ContentProducer} producer 
     * @returns {{width: number, height: number}} producer index, used by Producer to log to SupplyMonitor
     */
    register(producer) {
        const iProducer = this.producers.length;

        this.producers.push({producer: producer, weight: producer.weight, produced: 0, supplied: 0, iBuffer: this.buffer.length, totalProduced: 0, totalSupplied: 0, bufferCells: [] });
        this.buffer.length = this.buffer.length + this.producerBufferSize;
        this.totalWeight += producer.weight;
        this.maxProducerBuffer = Math.max(this.maxProducerBuffer, producer.bufferSize);
        // console.log("registerED(" + [producer.constructor.name, producer.weight ] + ") totalWeight=" + this.totalWeight + " producers=" + this.producers.length);

        return {width: this.width, height: this.height};
    }

    updateWeight(producer) {
        const producerInfo = this.producers.find( info => {
            return info.producer == producer; 
        } );
        const diff = producerInfo.weight - producer.weight;
        producerInfo.weight = producer.weight;
        this.totalWeight -= diff;
    }

    updateWeights() {
        this.totalWeight = 0;
        this.producers.forEach( producer => {
            this.totalWeight += producer.weight; 
        } );
    }
}

const conSup = new ContentSupplier();

export default conSup;