/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use strict';

import { getColorAsArray } from '../utils/utils';

/**
 * Interface between classes and properties of the Wallpaper Engine.
 */
class PropertyPropagator {
    constructor(name) {
        this.userPropertyListeners = new Object();
        this.userDirectoryFilesListener = new Object();
        this.generalPropertyListeners = [];
        this.windowPropertyListeners = [];
        this.pausedListeners = [];
        this.loadedListeners = [];
        this._isPaused = false;
        this.name = name;
        this._width = window.innerWidth;
        this._height = window.innerHeight;
        this.appliedStartupListener = [];
        // this.started = {userProperties: false, generalProperties: false, files: false}; // Use if using file list (directory, mode=fetchall)
        // this.started = { userProperties: false, generalProperties: false };
        // this.started = { userProperties: false };
        this.started = {}; // Defined in initialize !!

    }

    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }

    get isPaused() {
        return this._isPaused;
    }

    checkStarted(starter) {
        const oldStarted = { ...this.started };
        this.started = { ...this.started, ...starter };

        if (JSON.stringify(this.started) != JSON.stringify(oldStarted)) {
            // console.log( 'checkStarted(' + JSON.stringify(starter) + '): ' + JSON.stringify(this.started) + JSON.stringify(oldStarted) );

            let allTrue = true;

            for (const candidate in this.started) {
                if (this.started[candidate] == false) {
                    allTrue = false;
                    break;
                }
            }
            if (allTrue) {
                // console.log( 'checkStarted: call appliedStartupListener' );
                this.appliedStartupListener.forEach(listener => {
                    listener();
                });
                this.loadedListeners.forEach(listener => {
                    // console.log('checkStarted: call ' + listener.receiver.constructor.name + "." + listener.onLoaded);
                    listener.receiver[listener.onLoaded]();
                });
            }
        }
    }

    userPropertiesListener(p) {
        // console.log( 'userPropertiesListener' );
        for (const fullPropertyName in p) {
            for (const prefix in this.userPropertyListeners) {
                if ((fullPropertyName.length > prefix.length) && fullPropertyName.startsWith(prefix)) {
                    const propertyName = fullPropertyName.substr(prefix.length);
                    const property = p[fullPropertyName];
                    const listener = this.userPropertyListeners[prefix];

                    try {
                        //console.log("[" + listener.constructor.name + "]("+prefix+"].["+propertyName+"):" + property.type + " <= " + property.value );
                        // debugger;
                        if (propertyName in listener) {
                            switch (property.type) {
                                case 'color':
                                    {
                                        const colors = getColorAsArray(property.value);
                                        // console.log(
                                        // "[" + listener.constructor.name + "](" + prefix + "].[" + propertyName + "):"
                                        // + property.type + " = " + property.value + " = " + colors );
                                        // listener[propertyName] = rgbToHsl( colors[0], colors[1], colors[2], 255 );
                                        listener[propertyName] = colors;
                                    } break;
                                default:
                                    listener[propertyName] = property.value;
                            }
                            // console.log(
                            // "[" + listener.constructor.name + "](" + prefix + "].[" + propertyName + "):" + property.type + " == " + listener[propertyName]
                            // + " <= " + property.value );
                        } else {
                            console.error('userPropertiesListener: [' + listener.constructor.name + '](' + prefix + '].[' + propertyName + '):' + property.type + ' IGNORING');
                        }
                    } catch (ex) {
                        console.error('PropertyPropagator.userPropertiesListener setting ' + fullPropertyName + ': ' + ex, ex, p);
                        // throw ex;
                    }
                }
            }
        }
        // console.log("PropertyPropagator[" + this.name + "].userPropertiesListener" );

        this.checkStarted({ userProperties: true });
    }

    generalPropertiesListener(p) {
        // console.log( 'generalPropertiesListener(' + JSON.stringify(p) + ')' );

        Object.getOwnPropertyNames(p).forEach(
            propertyName => {
                const property = p[propertyName];
                this.generalPropertyListeners.forEach(listener => {
                    try {
                        const fullPropertyName = (listener.callPrefix ? listener.callPrefix : '') + propertyName;

                        if (fullPropertyName in listener.receiver) {
                            // console.log( listener.receiver.constructor.name + "["+listener.callPrefix+"]["+propertyName+"] <= " + property);

                            switch (propertyName) {
                                default:
                                    listener.receiver[fullPropertyName] = property;
                            }
                            // console.log( listener.receiver.constructor.name + "["+listener.callPrefix+"]["+propertyName+"] == " + listener.receiver[fullPropertyName]);
                        } else {
                            // console.log( listener.receiver.constructor.name + " ignoring ["+listener.callPrefix+"]["+propertyName+"] = " + property);
                        }
                    } catch (ex) {
                        console.error('PropertyPropagator.generalPropertiesListener setting ' + propertyName + ': ' + ex);
                        throw ex;
                    }
                }
                );
            }
        );
        this.checkStarted({ generalProperties: true });
    }

    setPausedListener(p) {
        // console.log( 'setPausedListener(' + JSON.stringify(p) + ')' );
        this._isPaused = p;
        this.pausedListeners.forEach(eventListener => {
            this.propagatePaused(eventListener);
        });
    }

    propagatePaused(listener) {
        // console.log(
        // "PropertyPropagator[" + this.name + "].propagatePaused( " + eventListener.receiver.constructor.name + ", " + eventListener.callPrefix + " ) = " + this._isPaused);
        try {
            const fullPropertyName = (listener.callPrefix ? listener.callPrefix : '') + 'paused';

            if (fullPropertyName in listener.receiver) {
                // console.log( listener.receiver.constructor.name + "["+listener.callPrefix+"]["+"paused"+"] <= " + this._isPaused);

                listener.receiver[fullPropertyName] = this._isPaused;
                // console.log( listener.receiver.constructor.name + "["+listener.callPrefix+"]["+"paused"+"] == " + listener.receiver[fullPropertyName]);
            } else {
                console.error(listener.receiver.constructor.name + ' IGNORING [' + listener.callPrefix + '+' + 'paused' + '=' + fullPropertyName + '] = ' + this._isPaused);
            }
        } catch (ex) {
            console.error(ex);
            throw ex;
        }
    }


    /**
     * 
     * @param {string} fullPropertyName 
     * @param {Array} changedFiles 
     * @param {boolean} removed 
     */
    propagateDirectoryAndFiles(fullPropertyName, changedFiles, removed) {
        for (const prefix in this.userDirectoryFilesListener) {
            if ((fullPropertyName.length > prefix.length) && fullPropertyName.startsWith(prefix)) {
                const propertyName = fullPropertyName.substr(prefix.length) + 'Changes';
                const listener = this.userDirectoryFilesListener[prefix];

                try {
                    // console.log( "[" + listener.constructor.name + "]("+prefix+"].["+propertyName+") " + (removed? "Remove " : "Add ") + changedFiles.length );
                    if (propertyName in listener) {
                        const cb = listener[propertyName];
                        // console.log( "[" + listener.constructor.name + "]("+prefix+"].["+propertyName+") " + (removed? "Remove " : "Add ") + changedFiles.length );
                        cb(changedFiles, removed);
                    } else {
                        console.error('propagateDirectoryAndFiles(' + removed + '): [' + listener.constructor.name + '](' + prefix + '].[' + propertyName + '): IGNORING');
                    }
                } catch (ex) {
                    console.error('propagateDirectoryAndFiles setting ' + prefix + '/' + fullPropertyName + ': ' + ex);
                    throw ex;
                }
            }
        }
        if (!removed) this.checkStarted({ files: true });
    }

    /**
     * called on window/screen resize
     **/
    onResize() {
        this._width = window.innerWidth;
        this._height = window.innerHeight;

        // console.log(`PropertyPropagator[${this.name}].onResize() = ${this._width}x${this._height}`);
        this.windowPropertyListeners.forEach(eventListener => {
            this.setWindowSize(eventListener);
        });
    }

    setWindowSize(listener) {
        // console.log("PropertyPropagator[" + this.name + "].setWindowSize()");
        try {
            const fullPropertyNameWidth = (listener.callPrefix ? listener.callPrefix : '') + 'width';
            const fullPropertyNameHeight = (listener.callPrefix ? listener.callPrefix : '') + 'height';
            const fullPropertyNameSize = (listener.callPrefix ? listener.callPrefix : '') + 'size';

            if (fullPropertyNameSize in listener.receiver) {
                // console.log( listener.receiver.constructor.name + "["+listener.callPrefix+"+"+"size"+"] <= " + [this._width, this._height]);

                listener.receiver[fullPropertyNameSize] = { width: this._width, height: this._height };
            } else if ((fullPropertyNameHeight in listener.receiver) && (fullPropertyNameWidth in listener.receiver)) {
                // console.log( listener.receiver.constructor.name + "["+listener.callPrefix+"+"+"height/width"+"] <= " + [this._width, this._height]);

                listener.receiver[fullPropertyNameWidth] = this._width;
                listener.receiver[fullPropertyNameHeight] = this._height;
                // console.log(
                // listener.receiver.constructor.name + "[" + listener.callPrefix + "+" + "height/width" + "] == " + [listener.receiver[fullPropertyNameWidth],
                // listener.receiver[fullPropertyNameHeight]]);
            } else {
                console.error(
                    listener.receiver.constructor.name + ' IGNORING ['
                    + listener.callPrefix + '+' + 'height/width or size' + '=' + fullPropertyNameWidth + ',' + fullPropertyNameWidth + '] = ' + [this._width, this._height]);
            }
        } catch (ex) {
            console.error(ex);
            throw ex;
        }
    }

    sizeListener(size) {
        // console.log(`PropertyPropagator[${this.name}].sizeListener() = ${JSON.stringify(size)}`, size);

        this._width = size.width;
        this._height = size.height;

        this.windowPropertyListeners.forEach(eventListener => {
            this.setWindowSize(eventListener);
        });

        this.checkStarted({ size: true });
    }

    initialize() {

        if (window.wallpaper && window.wallpaper.register) {
            this.started = { userProperties: false, size: false };
            window.wallpaper.register({
                user: p => this.userPropertiesListener(p),
                size: p => this.sizeListener(p)
            });
        } else {
            // this.started = {userProperties: false, generalProperties: false, files: false}; // Use if using file list (directory, mode=fetchall)
            this.started = { userProperties: false, generalProperties: false };
            window.wallpaperPropertyListener = {
                applyUserProperties: p => this.userPropertiesListener(p),
                applyGeneralProperties: p => this.generalPropertiesListener(p),
                setPaused: p => this.setPausedListener(p),
                userDirectoryFilesAddedOrChanged: (propertyName, changedFiles) => this.propagateDirectoryAndFiles(propertyName, changedFiles, false),
                userDirectoryFilesRemoved: (propertyName, removedFiles) => this.propagateDirectoryAndFiles(propertyName, removedFiles, true)
            };
            window.addEventListener('resize', () => this.onResize()); // in case screen resizes
        }
        //  else {
        //     console.error("PropertyPropagator.initialize: no window.wallpaper.register:", window.wallpaper);
        // }
    }

    addAppliedStartupListener(listener) {
        this.appliedStartupListener.push(listener);
    }


    /**
     * 
     * @param {string} propertyPrefix 
     * @param {object} receiver 
     * @param {string} generalPrefix 
     * @param {string} windowPrefix 
     * @param {string} pausedPrefix 
     * @param {string} loaded name of the function to call after all properties have been applied, e.g. onInit
     * @param {boolean} userProperties 
     * @param {boolean} generalProperties 
     * @param {boolean} filesAndDirectories 
     * @param {boolean} paused 
     * @param {boolean} windowProperties 
     */
    addReceiver(propertyPrefix, receiver, generalPrefix, windowPrefix, pausedPrefix, loaded, userProperties, generalProperties, filesAndDirectories, paused, windowProperties) {
        if (userProperties)
            this.userPropertyListeners[propertyPrefix] = receiver;

        if (generalProperties) {
            this.generalPropertyListeners.push({ receiver: receiver, callPrefix: generalPrefix });
        }
        if (filesAndDirectories) {
            this.userDirectoryFilesListener[propertyPrefix] = receiver;
        }
        if (windowProperties) {
            const eventListener = { receiver: receiver, callPrefix: windowPrefix };
            this.windowPropertyListeners.push(eventListener);
            // this.setWindowSize(eventListener);
        }
        if (paused) {
            this.pausedListeners.push({ receiver: receiver, callPrefix: pausedPrefix });
            // this.propagatePaused(eventListener);
        }
        if (loaded) {
            this.loadedListeners.push({ receiver: receiver, onLoaded: loaded });
        }
    }
}

const proPro = new PropertyPropagator('TiTahi');

export default proPro;
