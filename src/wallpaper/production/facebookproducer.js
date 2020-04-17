'use strict';

import LoaderProducer from './loaderproducer';
import fbCon from '../connectors/facebookconnector';
/**
 *  @extends LoaderProducer
 */
class FacebookProducer extends LoaderProducer {
    /**
     * 
     * @param {number} bufferSize used by this producer.
     */
    constructor(bufferSize) {
        super(bufferSize, 'Facebook.svg', 'production/facebookurlloader.js', 'FB-Url-Loader'  );
        // console.log("FacebookProducer.constructor(): bufferSize=" + this.bufferSize);

        this._accessToken = null;

        if (fbCon.isConnected) {
            this.accessToken = fbCon.accessToken;
        } else {
            fbCon.addConnectChangedListeners( connected => this.onConnectChanged(connected) );
        }
    }


    onConnectChanged(connected) {
        if (connected) {
            this.accessToken = fbCon.accessToken;
        } else {

        }
    }

    /**
     * @returns {string}
     */
    get accessToken() {
        return this._accessToken; 
    }
    set accessToken(accessToken) {
        this._accessToken = accessToken;
        this.urlLoader.postMessage({ accessToken: this._accessToken });
    }
}

const facebookProducer = new FacebookProducer(3);
export default facebookProducer;