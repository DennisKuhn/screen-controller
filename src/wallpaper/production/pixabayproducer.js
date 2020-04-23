'use strict';

import LoaderProducer from './loaderproducer';
import logo from './logos/Pixabay.svg';

// eslint-disable-next-line import/no-unresolved
import UrlLoaderWorker from 'worker-loader!./pixabayurlloader';

/**
 *  @extends LoaderProducer
 */
class PixabayProducer extends LoaderProducer {
    /**
     * 
     * @param {number} bufferSize used by this producer.
     */
    constructor(bufferSize) {
        super(bufferSize, logo, new UrlLoaderWorker({ name: 'Pixabay-Url-Loader' }));
        // console.log("PixabayProducer.constructor(): bufferSize=" + this.bufferSize);
    }
}

const pixabayProducer = new PixabayProducer(3);
export default pixabayProducer;