'use strict';

import LoaderProducer from './loaderproducer';

/**
 *  @extends LoaderProducer
 */
export default class PixabayProducer extends LoaderProducer {
    /**
     * 
     * @param {number} bufferSize used by this producer.
     */
    constructor(bufferSize) {
        super(bufferSize, 'Pixabay.svg', 'production/pixabayurlloader.js', 'Pixabay-Url-Loader');
        // console.log("PixabayProducer.constructor(): bufferSize=" + this.bufferSize);
    }
}

const pixabayProducer = new PixabayProducer(3);