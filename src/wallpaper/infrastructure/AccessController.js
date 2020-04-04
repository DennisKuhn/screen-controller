'use strict';

/**
 * USed by AccessController to register each consumer, handeling setEnabled, OnShow -> lockAccess and OnHide -> releaseAccess
 */
class AccessConsumer {
    constructor(consumerID, consumer) {
        this.consumerID = consumerID;
        this.consumer = consumer;

        this.consumer.OnShow = () => accessController.lockAccess(this.consumerID);
        this.consumer.OnHide = () => accessController.releaseAccess(this.consumerID);
    }

    setEnabled(enable) {
        // console.log("AccessConsumer(" +this.consumerID + ", " + this.consumer.constructor.name + ").setEnabled(" + enable + ")");
        this.consumer.setEnabled(enable);
    }
}

/**
 * Controlls single access to one window, e.g. while one window is shown others are disabled.
 */
export default class AccessController {
    constructor() {
        this.consumers = [];
        this.activeConsumer = null;
    }

    get IsLocked() {
        return this.activeConsumer != null; 
    }

    registerConsumer(consumerID, occupant) {
        const newConsumer = new AccessConsumer(consumerID, occupant );
        this.consumers.push(newConsumer);
        // console.log("registeredConsumer(" + consumerID + ", " + occupant.constructor.name + ") consumers=" + this.consumers.length);
    }

    lockAccess(consumerID) {
        // console.log("lockAccess(" + consumerID + ") activeConsumer=" + this.activeConsumer + " this.consumers.length=" + this.consumers.length);
        if (consumerID) {
            if (this.activeConsumer) {
                console.error('lockAccess(' + consumerID + ') already locked by ' + this.activeConsumer);
            } else {
                // console.log("lockAccess(" + consumerID + ") activeConsumer=" + this.activeConsumer + " consumers=" + this.consumers.length);
                this.activeConsumer = consumerID;
                this.consumers.forEach( consumer => {
                    if (consumer.consumerID != this.activeConsumer) {
                        // console.log("lockAccess(" + consumerID + ") lock=" + consumer.consumerID);
                        consumer.setEnabled(false);
                    }
                });
            }
        } else {
            console.error('lockAccess(' + consumerID + ') this.activeConsumer=' + this.activeConsumer);
            console.trace();
        }
    }

    releaseAccess(consumerID) {
        // console.log("releaseAccess(" + consumerID + ") activeConsumer=" + this.activeConsumer + " this.consumers.length=" + this.consumers.length);
        if (consumerID) {
            if (this.activeConsumer != consumerID) {
                console.error('releaseAccess(' + consumerID + ') locked by ' + this.activeConsumer);
            } else {
                // console.log("releaseAccess(" + consumerID + ")");
                this.activeConsumer = null;
                this.consumers.forEach( function(consumer, index, array) {
                    if (consumer.consumerID != consumerID) {
                        // console.log("releaseAccess(" + consumerID + ") unlock=" + consumer.consumerID);
                        consumer.setEnabled(true);
                    }
                });
            }
        } else {
            console.error('releaseAccess(' + consumerID + ') this.activeConsumer=' + this.activeConsumer + ' Stack:' + new Error().stack );
        }
    }
}