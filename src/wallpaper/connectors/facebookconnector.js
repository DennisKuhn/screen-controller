'use strict';

import FacebookConnectPopup from './connectpopup';
import FacebookConnectedPopup from './connectedpopup';
import FacebookDisconnectedPopup from './disconnectedpopup';

import { FB_APP_ID, FB_CLIENT_TOKEN } from '../apikeys';

/**
 * 
 * @class
 */
class FacebookConnector {
    /**
     * 
     * @param {boolean} callInit if true init() is called at the end of constructor
     * @param {string} accessToken optional, used by workers if local storage inaccessible
     */
    constructor(callInit, accessToken) {
        this.graphUrl = 'https://graph.facebook.com/v2.6/';

        this.graphUrlLogin = 'device/login';
        this.graphUrlPoll = 'device/login_status';
        this.graphUrlUserInfo = 'me';

        this.pollCount = 0;
        this.pollInterval = 0;
        this.pollIntervalHandle = 0;
        this.connectStart = null;
        this.connectExpiry = null;

        this.showConnectedPopupWhenInfoReceived = false;
        this.connectedPopup = null;
        this.connectPopup = null;
        this.disconnectedPopup = null;

        this.initAccessToken = FB_APP_ID + '|' + FB_CLIENT_TOKEN;
        this.connectCode = '';
        this.connectUserCode = '';
        this.connectUserUri = '';

        this.accessTokenKey = 'fbaccesstoken';
        this.accessTokenExpiryKey = 'fbaccesstokenexpiry';
        this.accessToken = accessToken;
        this.accessTokenExpiry = null;

        this.userId = null;
        this.userName = null;
        this.avatarUrl = null;

        this.connectChangedListeners = [];

        if (callInit == true) {
            this.init();
        }
    }

    get isConnected() {
        return (this.accessToken != null);
    }

    /**
     * 
     * @param {(connected:boolean) => void} listener 
     * */ 
    addConnectChangedListeners( listener ) {
        this.connectChangedListeners.push(listener);
    }

    /**
     * 
     * @param {"POST"|"GET"} method 
     * @param {string} graphSubUrl like "me?"
     * @param {boolean} appendAccessToken if true, append "&access_token=' + this.accessToken" to request url
     * @param {*} bodyObject if present, will be JSON.stringify and send with request
     */
    fetchGraph(method, graphSubUrl, appendAccessToken, bodyObject) {
        // console.log( this.constructor.name + ".fetchGraph( " + method + ", " + graphSubUrl + ", " + appendAccessToken + ", " + bodyObject + " (" + (bodyObject? JSON.stringify(bodyObject) : bodyObject) + ")");

        const url = this.graphUrl + graphSubUrl + ( appendAccessToken ? '&access_token=' + this.accessToken : '');
        const options = {
            method: method, // *GET, POST, PUT, DELETE, etc.
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            }
        };
        if (bodyObject) {
            // body data type must match "Content-Type" header
            options.body = JSON.stringify( bodyObject );
        }

        // console.log( this.constructor.name + ".fetchGraph(): fetch( " + url + ", " + JSON.stringify(options) +  " )" );
        return fetch( url, options ).then( response => {
            // console.log(this.constructor.name + ".fetchGraph(): fetch( " + url + " ): " + response.ok + " :" + response.status + ": " + response.statusText );
            if (response.ok) {
                return response.json();
            } if (response.status == 404 ) {
                console.error(this.constructor.name + '.fetchGraph(): ' + response.status + ': ' + url );
                return response.json().then( result => this.handleErrorResponse(result.error) );
            } else {
                console.error(this.constructor.name + '.fetchGraph(): status: ' + response.status + ': ' + url );
                return response.json().then( result => this.handleErrorResponse(result.error) );
            }
        });
    }

    connect() {
        this.fetchGraph(
            'POST',
            this.graphUrlLogin,
            false,
            { 
                access_token : this.initAccessToken,
                scope: 'public_profile,user_photos,user_likes,user_videos'
            }
        )
            .then(
                e => this.onConnectCode(e)
            )
            .catch( error => console.error( this.constructor.name + '.connect().catch( ' + error + ' )' ) );
    }

    disconnect() {
        this.clearAccessToken();
        this.showDisconnectedPopup();
    }

    startConnectPoll() {
        this.pollIntervalHandle = setInterval(
            () => this.pollConnectStatus(),
            this.pollInterval
        );
        if (this.connectPopup) {
            this.connectPopup.reuse(
                this.connectUserCode,
                this.connectUserUri,
                this.connectUserUri + '?user_code=' + this.connectUserCode,
                this.connectExpiry,
                this.connectStart
            );
            this.connectPopup.Show();
        } else {
            this.connectPopup = new FacebookConnectPopup(
                this.connectUserCode,
                this.connectUserUri,
                this.connectUserUri + '?user_code=' + this.connectUserCode,
                this.connectExpiry,
                this.connectStart
            );
        }
        this.connectPopup.OnHide = () => this.cancelConnect();
    }

    cancelConnect() {
        this.stopPoll();
    }


    onConnectCode(response) {
        // console.log(this.constructor.name + ".onConnectCode: code: " + response.code + ' user_code: ' + response.user_code + ' uri: ' + response.verification_uri + ' expires: ' + response.expires_in + ' interval: ' + response.interval);

        const startValue = Date.now();
        const expiryValue = startValue + (1000 * response.expires_in);

        this.connectStart = new Date( startValue );
        this.connectExpiry = new Date( expiryValue );
        this.pollInterval = response.interval * 1000;
        this.pollCount = response.expires_in / response.interval;
        this.connectCode = response.code;
        this.connectUserCode = response.user_code;
        this.connectUserUri = response.verification_uri;
        this.startConnectPoll();
    }

    pollConnectStatus() {
        // console.log(this.constructor.name + ".pollConnectStatus[ " + this.pollCount + " ]()");
        this.pollCount--;

        this.fetchGraph(
            'POST',
            this.graphUrlPoll,
            false,
            { 
                access_token : this.initAccessToken,
                code: this.connectCode
            }
        )
            .then(
                e => this.onPolledConnectStatus(e)
            );

        if (this.pollCount == 0) {
            console.warn(this.constructor.name + '.pollConnectStatus[ ' + this.pollCount + ' ](): sent last poll - stopPoll' );
            this.stopPoll();
        }
    }
    
    showConnectedPopup() {
        if (this.connectedPopup) {
            this.connectedPopup.reuse(
                this.userName,
                this.avatarUrl,
                this.accessTokenExpiry
            );
            this.connectedPopup.Show();
        } else {
            this.connectedPopup = new FacebookConnectedPopup(
                this.userName,
                this.avatarUrl,
                this.accessTokenExpiry
            );
        }
    }

    showDisconnectedPopup() {
        if (this.disconnectedPopup) {
            this.disconnectedPopup.Show();
        } else {
            this.disconnectedPopup = new FacebookDisconnectedPopup();
        }
    }

    onConnected() {        
        this.stopPoll();
        this.storeAccessToken();
        this.showConnectedPopupWhenInfoReceived = true;
        this.getUserInfo();
        this.notifyConnectChangedListeners();
    }

    notifyConnectChangedListeners() {
        const connected = this.isConnected;

        this.connectChangedListeners.forEach( listener => listener( connected ) );
    }

    onPolledConnectStatus(response) {
        if (response.error) {
            if ((response.error.code == 31) && (response.error.error_subcode && response.error.error_subcode == 1349174)) {
                // console.log(this.constructor.name + ".onPolledConnectStatus() wait");
            } else {
                this.handleErrorResponse(response.error);
            }
        } else {
            // console.log(this.constructor.name + ".onPolledConnectStatus() connected");
            const expiryValue = Date.now() + 1000 * response.expires_in;
            this.accessTokenExpiry = new Date(expiryValue);            
            this.accessToken = response.access_token;

            this.onConnected();
        }
    }

    /**
     * 
     * @param {{code:number,error_subcode:number, message: string, type:string}} error 
     */
    handleErrorResponse(error) {
        // console.log(this.constructor.name + ".handleErrorResponse( " + JSON.stringify( error ) + " )");

        if (error) {
            switch (error.code) {
                case 190: // Access token has expired
                    console.warn(this.constructor.name + '.handleErrorResponse(' + error.code + (error.error_subcode ? '.' + error.error_subcode : '') + '): clearAccessToken: ' + error.message );
                    this.clearAccessToken();
                    this.showDisconnectedPopup();
                    return;
                default:
                    if (error.error_subcode) {
                        switch (error.error_subcode ) {
                            case 1349152: // The device code has expired. Cancel the device login flow and send the user back to the initial screen.
                            // Status 400
                                console.warn(this.constructor.name + '.handleErrorResponse(' + error.code + ')[ ' + this.pollCount + ' ](): Expired' );
                                this.stopPoll();
                                break;
                            case 1349174: // Waiting for user - keep polling
                            case 1349172: // Your device is polling too frequently. Slow down the polling to the interval specified in the first API call.
                            default:
                                console.error(this.constructor.name + ':handleErrorResponse: error:' + error.code + '.' + error.error_subcode + ': ' + error.type + ': ' + error.message );
                        }
                    } else {
                        console.error(this.constructor.name + ':handleErrorResponse: error:' + error.code + ': ' + error.type + ': ' + error.message );
                    }
            }
            throw new Error(this.constructor.name + ':handleErrorResponse: error:' + error.code + (error.error_subcode ? '.' + error.error_subcode : '') + ': ' + error.type + ': ' + error.message);
        }

        throw new Error(this.constructor.name + ':handleErrorResponse: error: no error:' + error );
    }

    clearAccessToken() {
        this.accessToken = null;
        this.accessTokenExpiry = null;
        this.storeAccessToken();
        this.notifyConnectChangedListeners();
    }

    stopPoll() {
        clearInterval(this.pollIntervalHandle);
        this.pollIntervalHandle = 0;
        this.connectPopup.OnHide = null;
        this.connectPopup.Hide();
    }

    storeAccessToken() {
        // console.log(this.constructor.name + ".storeAccessToken(): [ " + this.accessTokenKey + " ]=" + this.accessToken + " [ " + this.accessTokenExpiryKey + " ]=" + this.accessTokenExpiry );
        try {
            if (this.accessToken) {
                window.localStorage.setItem( this.accessTokenKey, this.accessToken );
                window.localStorage.setItem( this.accessTokenExpiryKey, this.accessTokenExpiry.toISOString() );
            } else {
                window.localStorage.removeItem( this.accessTokenKey );
                window.localStorage.removeItem( this.accessTokenExpiryKey );
            }
        } catch ( ex ) {
            console.error(this.constructor.name + '.storeAccessToken() caught: ' + ex);
        }
    }

    /**
     * If accessToken has not been set, try to load it from localStorage.
     * If accessToken found, call getUserInfo, if still connected notifyConnectChangedListeners
     */
    init() {
        if (this.accessToken == null) {
            this.loadAccessToken();
        }
        if (this.accessToken) {
            this.getUserInfo()
                .then(
                    () => {
                        if (this.isConnected) {
                            this.notifyConnectChangedListeners();
                        }
                    }
                );
        }        
    }

    loadAccessToken() {
        // console.log(this.constructor.name + ".loadAccessToken( " + this.accessTokenKey + ", " + this.accessTokenExpiryKey + " )" );

        try {
            this.accessToken = window.localStorage.getItem( this.accessTokenKey);
            if (this.accessToken == null) {
                console.warn(this.constructor.name + '.loadAccessToken(): loaded: token=' + this.accessToken );
            } else {
                this.accessTokenExpiry = new Date( window.localStorage.getItem( this.accessTokenExpiryKey ));
                // console.log(this.constructor.name + ".loadAccessToken(): loaded: expiry=" + this.accessTokenExpiry + " token=" + this.accessToken );
            }
        } catch ( ex ) {
            console.error(this.constructor.name + '.loadAccessToken() caught: ' + ex);
        }
    }

    /**
     * 
     * @param {{name:string, id: number, picture: { data: {is_silhouette: boolean, url: string}} }} response 
     */
    onUserInfo(response) {
        // console.log(this.constructor.name + ".onUserInfo: name: " + response.name + ' id: ' + response.id + ' pictureUrl: ' + response.picture.data.url );
        this.userId = response.id;
        this.userName = response.name;
        this.avatarUrl = response.picture.data.url;

        if (this.showConnectedPopupWhenInfoReceived) {
            this.showConnectedPopupWhenInfoReceived = false;
            this.showConnectedPopup();
        }
    }

    getUserInfo() {
        return this.fetchGraph( 'GET', this.graphUrlUserInfo + '?fields=name,picture', true )
            .then( 
                response => this.onUserInfo(response)
            )
            .catch( error => console.error( this.constructor.name + '.getUserInfo().catch( ' + error + ' )' ) );
    }
}


/**
 * 
 */
const fbCon = new FacebookConnector();
export default fbCon;
