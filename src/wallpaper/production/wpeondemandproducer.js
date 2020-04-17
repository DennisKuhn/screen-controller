'use strict';

import ContentProducer from './contentproducer';
import Content from '../content';

/**
 * @extends ContentProducer
 */
export default class WpeOnDemandProducer extends ContentProducer {
    /**
     * 
     * @param {number} bufferSize used by this producer.
     * @param {string} logo name of logo image in production/logos
     */
    constructor(bufferSize, logo) {
        super(bufferSize, logo);
        this.propertyName = this.constructor.name + '_folder';
        this._folder = '';
        this.backlog = 0;
        // console.log("WpeOnDemandProducer.constructor(): propertyName=" + this.propertyName);
    }

    /**
     * @returns {string}
     */
    get folder() {
        return this._folder; 
    }

    set folder(newFolder) {
        if (newFolder != this._folder) {
            this._folder = newFolder;

            if (newFolder) {
                while (this.backlog) {
                    this.produce();
                    this.backlog--;
                }
            } else {
                this.flush();
            }

        }
    }

    /**
     * Calls getNextFile to request random file from Wallpaper engine.
     */
    produce() {
        // console.log(this.constructor.name + ".produce()");
        if (this.folder) {
            this.getNextFile();
        } else {
            this.backlog++;
            // console.log(this.constructor.name + ".produce() ++backlog=" + this.backlog);
        }
    }

    /**
     * Gets a random file URI from Wallpaper Engine. If the uri makes it through the filter, addToBuffer is called, otherwise start again.
     */
    getNextFile() {
        window.wallpaperRequestRandomFileForProperty( this.propertyName, ( p, newFile ) => this.onNewFile(p, newFile) );
    }

    onNewFile(p, newFile) {
        if ( newFile ) {
            if (((! this._excludeFilter ) || (newFile.indexOf(this._excludeFilter) < 0))
            && ((! this._includeFilter ) || (newFile.indexOf(this._includeFilter) >= 0))) {
                const content = new Content(this, encodeURI( 'file:///' + newFile ).replace( /#/g, '%23' ));
                // let content = new Content(this, newFile.replace( /#/g, "%23" ));
                // let content = new Content(this, newFile);
                const matches = /(^.*\/)([^/]+)\/([^/]+$)/g.exec(newFile);

                if (matches && (matches.length >= 3)) {
                    content.title = matches[3].replace( /[_\.-]/g, ' ');
                    content.description =  matches[2].replace( /[_\.-]/g, ' ');
                } else {
                    console.error('WpeOnDemandProducer.wallpaperRequestRandomFileForProperty.getNextFile() NO MATCH: ' + newFile);
                } 

                // console.log( this.constructor.name + '.getNextFile.wallpaperRequestRandomFileForProperty: addToBuffer: ' + fileUri);
                this.addToBuffer( content );
            } else {
                // console.log("getNextFile: skip image: " + i);
                this.getNextFile();
            }
        } else {
            console.error('getNextFile: no file:' + newFile);
        }

    }
}