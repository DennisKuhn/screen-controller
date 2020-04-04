'use strict';

/**
 * Displays an analog clock, optional markers and seconds hand.
 */
export default class AnalogClock {

    constructor() {
        this.size = 1;
        this.visible = true;
        this._width =  640;
        this._height = 640;
        this.showSeconds = true;
        this.showMarkers = true;
        this.ox = 0;
        this.oy = 0;
    }

    /**
     * @returns {number}
     */
    get width() {
        return this._width; 
    }
    set width(newWidth) {
        this._width = newWidth; 
    }

    /**
     * @returns {number}
     */
    get height() {
        return this._height; 
    }
    set height(newHeight) {
        this._height = newHeight; 
    }

    /**
     * @returns {number}
     */
    get Size() {
        return this.size * 100; 
    }
    set Size(newSize) {
        this.size = newSize / 100; 
    }

    /**
     * @returns {number}
     */
    get OffsetX() {
        return this.ox; 
    }
    set OffsetX(offset) {
        this.ox = offset; 
    }

    /**
     * @returns {number}
     */
    get OffsetY() {
        return this.oy; 
    }
    set OffsetY(offset) {
        this.oy = offset; 
    }

    /**
     * @returns {boolean}
     */
    get ShowSeconds() {
        return this.showSeconds; 
    }
    set ShowSeconds(show) {
        this.showSeconds = show; 
    }

    /**
     * @returns {boolean}
     */
    get ShowMarkers() {
        return this.showMarkers; 
    }
    set ShowMarkers(show) {
        this.showMarkers = show; 
    }

    /**
     * @returns {boolean}
     */
    get Visible() {
        return this.visible; 
    }
    set Visible(visible) {
        this.visible = visible; 
    }

    render(context, gradient) {
        if ( this.visible && (this.size > 0 )) {
            const w2 = this._width/2;//0;
            const h2 = this._height/2;//0;
            const baseRadius = Math.min( this._width, this._height )/3;
            const dt = new Date();
            let hour = -Math.PI * 2 * (dt.getHours()%12)/12;
            let m = -Math.PI * 2 * dt.getMinutes()/60;
            const s = -Math.PI * 2 * dt.getSeconds()/60;

            m += s / 60;
            hour += m / 12;
            context.fillStyle = gradient;
            context.strokeStyle = gradient;
        
            context.lineWidth = 8;
            context.beginPath();
            context.moveTo( this.ox + w2, this.oy + h2 );
            context.lineTo( this.ox + w2 + Math.sin( hour + Math.PI ) * this.size * baseRadius/2, this.oy + h2 + Math.cos( hour + Math.PI ) * this.size * baseRadius/2 );
            context.stroke();
            context.lineWidth = 4;
            context.beginPath();
            context.moveTo( this.ox + w2, this.oy + h2 );
            context.lineTo( this.ox + w2 + Math.sin( m + Math.PI ) * this.size * baseRadius/1, this.oy + h2 + Math.cos( m + Math.PI ) * this.size * baseRadius/1 );
            context.stroke();
    
            if (this.showSeconds) {
                context.beginPath();
                context.lineWidth = 0.5;
                context.moveTo( this.ox + w2, this.oy + h2 );
                //context.lineTo( w2 + Math.sin( s ) * height/16, h2 + Math.cos( s ) * height/16 );
                context.lineTo( this.ox + w2 + Math.sin( s + Math.PI ) * this.size * baseRadius/1, this.oy + h2 + Math.cos( s + Math.PI ) * this.size * baseRadius/1 );
                context.stroke();
            }
    
            if (this.showMarkers) {
                context.lineWidth = 2;
                for ( let i = 0; i < 360; i += 30 ) {
                    const sz = i % 90 == 0 ? -0.5 : 0;
                    context.beginPath();
                    context.moveTo( this.ox + w2 + Math.sin( i*Math.PI/180 + Math.PI ) * this.size * baseRadius*(21+sz)/20, this.oy + h2 + Math.cos( i*Math.PI/180 + Math.PI ) * this.size * baseRadius*(21+sz)/20 );
                    context.lineTo( this.ox + w2 + Math.sin( i*Math.PI/180 + Math.PI ) * this.size * baseRadius*22/20, this.oy + h2 + Math.cos( i*Math.PI/180 + Math.PI ) * this.size * baseRadius*22/20 );
                    context.stroke();
                }
            }
        }
    
    }
}

