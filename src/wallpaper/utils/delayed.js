
/**
 * 
 */
export default class delayed {
    constructor(callback, timeout) {
        this.callback = callback;
        this.timeout = timeout;
        this._timeout = null;
    }

    setTimeout(time) {
        this.timeout = time;
    }

    setCallback(callback) {
        this.callback = callback;
    }

    trigger() {
        this.cancel();
        this._timeout = setTimeout(this.callback, this.timeout);

    }
    cancel() {
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
    }
}
