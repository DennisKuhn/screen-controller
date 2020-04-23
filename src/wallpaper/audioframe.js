/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use strict';

import AudioData from './audiodata';
import timer from './timer';
import { performanceMonitor } from './performancemonitor';

/**
 * Squee Powered!
 * Classified by Dennis
 */
class AudioFrameConfig {
    constructor()  {
        this._animateWhenSilent = 1;
        this._animateWhenSilentHeight = 0.01;
        this._normalize = true; //false;
        this._normalizeFactor = 0; //0.5;
        this._motionBlur = true; //false;
        this._motionBlurFactor = 0.99; //0.5;
        this._smooth = true; //false;
        this._smoothFactor = 0.75; //0.05;
        this._powerOf = 4; //1;
        this._mono = true;

        this._heightCutoff = 0;
        this._heightCutoffFactor = 0;
		
        this._ampFactor = 1;
        this._downSample = 1;
        this._reverseFreq = false;
        this._eqStrength = 0.5;
        this._eqWidth = 15;
        this._eqFreq1 = 1000;
        this._eqFreq2 = 10000;
        this._eqFreq3 = 15000;
        this._eqFreq1Strength = 1;
        this._eqFreq2Strength = 1;
        this._eqFreq3Strength = 1;
        this.lastEqChange = -1000000000000;
    }

    setHeightCutOff() {
        this._heightCutoff = (this._heightCutoffFactor * this._ampFactor) * (this._heightCutoffFactor * this._ampFactor); 
    }

    get animateWhenSilent() {
        return this._animateWhenSilent; 
    }
    get animateWhenSilentHeight() {
        return this._animateWhenSilentHeight; 
    }
    get normalize() {
        return this._normalize; 
    }
    get normalizeFactor() {
        return this._normalizeFactor; 
    }
    get motionBlur() {
        return this._motionBlur; 
    }
    get motionBlurFactor() {
        return ((1 - this._motionBlurFactor) * 100).toPrecision(15); 
    }
    get smooth() {
        return this._smooth; 
    }
    get smoothFactor() {
        return this._smoothFactor; 
    }
    get powerOf() {
        return this._powerOf; 
    }
    get mono() {
        return this._mono; 
    }
    get heightCutoffFactor() {
        return this._heightCutoffFactor; 
    }
    get heightCutoff() {
        return this._heightCutoff; 
    }
    get ampFactor() {
        let h = this._ampFactor; 

        h -= 0.01;
        h /= 0.99; 
        h = Math.sqrt( h ); 
        h *= 0.99; 
        h += 0.01; 

        return Number( (h * 100).toPrecision(16) ); 
    }
    get downSample() {
        return this._downSample; 
    }
    get reverseFreq() {
        return this._reverseFreq; 
    }
    get eqStrength() {
        return this._eqStrength * 100; 
    }
    get eqWidth() {
        return this._eqWidth; 
    }
    get eqFreq1() {
        return this._eqFreq1 / 100; 
    }
    get eqFreq2() {
        return this._eqFreq2 / 100; 
    }
    get eqFreq3() {
        return this._eqFreq3 / 100; 
    }
    get eqFreq1Strength() {
        return this._eqFreq1Strength * 100; 
    }
    get eqFreq2Strength() {
        return this._eqFreq2Strength * 100; 
    }
    get eqFreq3Strength() {
        return this._eqFreq3Strength * 100; 
    }

    set animateWhenSilent(newanimateWhenSilent) {
        this._animateWhenSilent = newanimateWhenSilent; 
    }
    set animateWhenSilentHeight(newanimateWhenSilentHeight) {
        let h = newanimateWhenSilentHeight/100; 
        h -= 0.01; h /= 0.99; h = Math.pow( h, 2 ); h *= 0.99; h += 0.01;
        this._animateWhenSilentHeight = h;
    }
    set normalize( newnormalize ) {
        this._normalize = newnormalize; this.lastEqChange = performance.now(); 
    }
    set normalizeFactor( newnormalizeFactor ) {
        this._normalizeFactor = newnormalizeFactor; this.lastEqChange = performance.now(); 
    }
    set motionBlur( newmotionBlur ) {
        this._motionBlur = newmotionBlur; this.lastEqChange = performance.now(); 
    }
    set motionBlurFactor( newmotionBlurFactor ) {
        this._motionBlurFactor = 1 - newmotionBlurFactor / 100; this.lastEqChange = performance.now(); 
    }
    set smooth( newsmooth ) {
        this._smooth = newsmooth; this.lastEqChange = performance.now(); 
    }
    set smoothFactor( newsmoothFactor ) {
        this._smoothFactor = newsmoothFactor; this.lastEqChange = performance.now(); 
    }
    set powerOf( newpowerOf ) {
        this._powerOf = newpowerOf; this.lastEqChange = performance.now(); 
    }
    set mono( newmono ) {
        this._mono = newmono; this.lastEqChange = performance.now(); 
    }

    set ampFactor( newampFactor ) { 
        let h = newampFactor/100; 
        h -= 0.01; h /= 0.99; h = Math.pow( h, 2 ); h *= 0.99; h += 0.01;
        this._ampFactor = h; 
        this.setHeightCutOff(); 
        this.lastEqChange = performance.now(); 
    }
    set heightCutoffFactor(newheightCutoffFactor) {
        this._heightCutoffFactor = newheightCutoffFactor;
        this.setHeightCutOff();
        this.lastEqChange = performance.now();
    }

    set downSample( newdownSample ) {
        this._downSample = newdownSample; this.lastEqChange = performance.now(); 
    }
    set reverseFreq( newreverseFreq ) {
        this._reverseFreq = newreverseFreq; this.lastEqChange = performance.now(); 
    }
    set eqStrength( neweqStrength ) {
        this._eqStrength = neweqStrength / 100; this.lastEqChange = performance.now(); 
    }
    set eqWidth( neweqWidth ) {
        this._eqWidth = neweqWidth; this.lastEqChange = performance.now(); 
    }
    set eqFreq1( neweqFreq1 ) {
        this._eqFreq1 = neweqFreq1 * 100; this.lastEqChange = performance.now(); 
    }
    set eqFreq2( neweqFreq2 ) {
        this._eqFreq2 = neweqFreq2 * 100; this.lastEqChange = performance.now(); 
    }
    set eqFreq3( neweqFreq3 ) {
        this._eqFreq3 = neweqFreq3 * 100; this.lastEqChange = performance.now(); 
    }
    set eqFreq1Strength( neweqFreq1Strength ) {
        this._eqFreq1Strength = neweqFreq1Strength / 100; this.lastEqChange = performance.now(); 
    }
    set eqFreq2Strength( neweqFreq2Strength ) {
        this._eqFreq2Strength = neweqFreq2Strength / 100; this.lastEqChange = performance.now(); 
    }
    set eqFreq3Strength( neweqFreq3Strength ) {
        this._eqFreq3Strength = neweqFreq3Strength / 100; this.lastEqChange = performance.now(); 
    }

}

/**
 * 
 */
export default class AudioFrame {
    constructor(opts) {
        // console.log("AudioFrame.constructor(" + JSON.stringify(opts) + ")");
        this.audioData = new AudioData();
        this.audioDataPrev = new AudioData();
        this.audioDataBuffer = new AudioData();
        this.audioDataNormalized = new AudioData();
        this.audioDataResult = new AudioData();
        this.audioPeakAverage = 1;
        
        this.hadAudioFrame = false;

        this.peakHistoryWriteIdx = 0;
        this.peakHistory = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        this.hasAudio = false;
		
        this.config = new AudioFrameConfig();
		
        // idx to freq
        // freq = (idx/64) ^ sqrt( 2 )
		
        // freq to idx
        //  freq  = (idx/64) ^ sqrt( 2 ) * 22000
        //  (freq/22000) ^ sqrt( 1/2 ) = idx/64
        //  (freq/22000) ^ sqrt( 1/2 ) * 64
		
        if ( typeof opts == 'object' ) {
            for ( const i in opts ) {
                if ( i in this.config ) {
                    if ( this.config[ i ] != opts[ i ] ) {
                        // console.log("AudioFrame.constructor [" + i + "] = " + this.config[ i ] + " <= " +  opts[ i ]);
                        this.config[ i ] = opts[ i ];
                    }
                    // console.log("AudioFrame.constructor [" + i + "] = " + this.config[ i ] + " <= " +  opts[ i ]);
                } else {
                    console.error('AudioFrame.constructor ONLY opts has [' + i + ']');
                }
            }
        } else {
            console.error('AudioFrame.constructor typeof opts = ' + (typeof opts) + ' !');
        }
    }

    animate( data ) {
        for ( let i = 0; i < 64; i++ ) {
            const p = i / 63;
            const p2 = performance.now()/(60*1000);
            let v = Math.sin( 23 * ( p + p2 ) * Math.PI*2 )+1;
            v += Math.cos( -31 * ( p - p2 ) * Math.PI/3 )/2;

            v/=2;
            data[i] = v;
            data[i+64] = v ;
        }
    }
	
    /**
	 * called when new fft data is avabile
	 *
	 * @param data Array of 128 floats 
	 **/
    onAudioData( data ) {
        const t0 = performance.now();
        timer.start('audio update');
		
        try {
            // update data in the 2 frames
            this.update( data, false );
            // console.log("hasAudio=" + this.hasAudio + " animateWhenSilent=" + this.config._animateWhenSilent + " " + (this.config._animateWhenSilent == 1));
            if ( !this.hasAudio && this.config._animateWhenSilent ) {
                this.animate(data);
                this.update( data, true );
            }
        } catch (ex) { 
            console.error( ex.message );
            throw ex;
        }				
        this.hadAudioFrame = true;
        timer.stop('audio update');
        const t1 = performance.now();
        performanceMonitor.fpsRenderTime += t1 - t0;
    }
	

    update( data, isFake ) {
        isFake = isFake || false;
        try {
            this.audioData.setData( data );
			
            if ( !isFake ) {
                this.audioData.correctPinkNoise();
            }
			
            if ( this.config._mono ) {
                this.audioDataBuffer.copyFrom( this.audioData );
                this.audioDataBuffer.left.add( this.audioData.right );
                this.audioDataBuffer.right.add( this.audioData.left );
                this.audioDataBuffer.left.divide(2);
                this.audioDataBuffer.right.divide(2);
                this.audioData.copyFrom( this.audioDataBuffer );
            }
			
            this.audioDataPrev.copyFrom( this.audioDataNormalized );
			
            for ( let i = 0; i < 64; i++ ) {
                const a = this.getEqValueForIdx( i );
				
                this.audioData.left.data[i] *= a;
                this.audioData.right.data[i] *= a;
            }
			
			
            this.audioDataNormalized.copyFrom( this.audioData );
            if ( this.config._reverseFreq ) {
                this.audioDataNormalized.reverse();
            }
            if ( this.config._downSample ) {
                //this.audioDataNormalized.downsample( this.config._downSample );
            }
			
            if ( this.config._smooth ) {
                // using a 1d convolution matrix to smooth. 
                // See AudioData::smooth() function for the values I've use in case you might want to chage those
                this.audioDataNormalized.smooth( this.config._smoothFactor );
            }
			
            this.audioDataNormalized.power( this.config._powerOf );			
			
            const maxValue = this.audioDataNormalized.max();
            this.audioPeakAverage = this.audioPeakAverage * this.config._normalizeFactor + maxValue * (1-this.config._normalizeFactor);
            this.audioPeakAverage = Math.max( this.audioPeakAverage, 0.001 );
			
            if ( this.config._normalize ) {
                // divide by peak average to normalize
                this.audioDataNormalized.divide( this.audioPeakAverage );
            }
			
            if ( !isFake ) {
                this.peakHistory[ this.peakHistoryWriteIdx ] = maxValue;
                this.peakHistoryWriteIdx = ( this.peakHistoryWriteIdx+1) % this.peakHistory.length;
				
				
                let totalPeakValue = 0;
                for (let i = 0; i < this.peakHistory.length; i++ ) {
                    totalPeakValue += this.peakHistory[i];
                }
                if ( totalPeakValue > 0.01 ) {
                    this.hasAudio = true;
                } else {
                    this.hasAudio = false;
                }
            } else {
                this.audioDataNormalized.multiply( this.config._animateWhenSilentHeight * 3 );
            }
			
			
            if ( this.config._motionBlur ) {
                // motion blur is basically using the old frame to create more smooth movement over several frames
                this.audioDataBuffer.copyFrom( this.audioDataPrev );
                this.audioDataBuffer.multiply( this.config._motionBlurFactor );
                this.audioDataNormalized.multiply( (1-this.config._motionBlurFactor) );
                this.audioDataNormalized.add( this.audioDataBuffer );
            }
			
            this.audioDataResult.copyFrom( this.audioDataNormalized );
            this.audioDataResult.multiply( this.config._ampFactor );
        } catch ( ex ) {
            console.error( ex.message ); 
        }
    }
	
    renderEQ( ctx ) {
        ctx.fillStyle = 'rgba( 1, 1, 1, 0.25 )';
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
		
        ctx.beginPath();
        ctx.fillRect( 100, 100, 420, 300 );
		
        ctx.beginPath();
        ctx.moveTo( 100, 100 );
        ctx.lineTo( 420, 100 );
		
        ctx.moveTo( 100, 300 );
        ctx.lineTo( 420, 300 );
		
        ctx.stroke();
		
        ctx.strokeStyle = 'silver';
        ctx.beginPath();
        for ( let i = 0; i < 64; i++ ) {
            const x = 100 + ( 320 / 63 ) * i;
            const y = 300 - 200 * this.getEqValueForIdx( i );
            if ( i == 0 ) {
                ctx.moveTo( x, y );
            } else {
                ctx.lineTo( x, y );
            }
        }
        ctx.stroke();
        const maxVal = this.audioData.left.max();
		
        ctx.strokeStyle = 'rgb( 64, 0, 0 )';
        ctx.beginPath();
        for ( let i = 0; i < 64; i++ ) {
            const x = 100 + ( 320 / 63 ) * i;
            let f = this.getEqValueForIdx( i );
            if ( f == 0 ) f = 0.00000000000000001;
            const y = 300 - 200 * ( this.audioData.left.data[ i ] / maxVal / f  )  ;
            if ( i == 0 ) {
                ctx.moveTo( x, y );
            } else {
                ctx.lineTo( x, y );
            }
        }
        ctx.stroke();
		
        ctx.strokeStyle = 'rgb( 0, 128, 0 )';
        ctx.beginPath();
        for (let i = 0; i < 64; i++ ) {
            const x = 100 + ( 320 / 63 ) * i;
            const y = 300 - 200 * ( this.audioData.left.data[ i ] / maxVal );
            if ( i == 0 ) {
                ctx.moveTo( x, y );
            } else {
                ctx.lineTo( x, y );
            }
        }
        ctx.stroke();
    }
	
    getEqValueForIdx( idx ) {
        let result = 0;
        try {
            const eq1 = this.freqToIdx( this.config._eqFreq1 );
            const eq2 = this.freqToIdx( this.config._eqFreq2 );
            const eq3 = this.freqToIdx( this.config._eqFreq3 );
			
            const dist1 = ( eq1 - idx );
            const dist2 = ( eq2 - idx );
            const dist3 = ( eq3 - idx );
			
            let valuesUsed = 0;
			
            const c = 10;
            const w = 10;
            if ( idx < ( w * 2 + 1 ) ) {
                //var p = idx / (w*2);
                // use cos from -PI to -PI
                //var v = (1 + Math.cos( -Math.PI + Math.PI*2*p )) / 2;
                //result += v;
                //valuesUsed++;
            }
			
            if ( Math.abs( dist1 ) <= this.config._eqWidth ) {
                const min = eq1 - this.config._eqWidth;
                const max = eq1 + this.config._eqWidth;
                const p = ( idx - min ) / ( max - min );
                const v = (1 + Math.cos( -Math.PI + Math.PI*2*p )) / 2;
                result = v * this.config._eqFreq1Strength;
                //result += v;
                valuesUsed += this.config._eqFreq1Strength;//Math.pow( v, 1/1.4142 );
            }
            if ( Math.abs( dist2 ) <= this.config._eqWidth ) {
                const min = eq2 - this.config._eqWidth;
                const max = eq2 + this.config._eqWidth;
                const p = ( idx - min ) / ( max - min );
                const v = (1 + Math.cos( -Math.PI + Math.PI*2*p )) / 2;
                result = Math.max( result, v * this.config._eqFreq2Strength );
                //result += v;
                valuesUsed += this.config._eqFreq2Strength;//Math.pow( v, 1/1.4142 );
				
            }
            if ( Math.abs( dist3 ) <= this.config._eqWidth ) {
                const min = eq3 - this.config._eqWidth;
                const max = eq3 + this.config._eqWidth;
                const p = ( idx - min ) / ( max - min );
                const v = (1 + Math.cos( -Math.PI + Math.PI*2*p )) / 2;
                result = Math.max( result, v * this.config._eqFreq3Strength );
                //result += v;
                valuesUsed += this.config._eqFreq3Strength;//Math.pow( v, 1/1.4142 );
            }
        } catch ( ex ) {
            console.error( ex ); 
        }
			
        return this.config._eqStrength * result + ( 1 - this.config._eqStrength );// / valuesUsed;
    }
	
    idxToFreq( idx ) {
        return -188.75596010894685 +  81.79508702900829 * Math.pow( 30.416291139283476, 0.2812954890617726 + idx / 49.91248369525583 );
        // -44.51401880248667 +  77.50771033219084 * Math.pow( 2.8864295611172226, 13.050180958147799 + idx \/ 0.293946557709426 )
        // return -44.51401880248667 +  77.50771033219084 * Math.pow( 2.8864295611172226, 0.293946557709426 + (idx/1) / 13.050180958147799 );
    }
	
    getBaseLog(x, y) {
        return Math.log(x) / Math.log(y);
    }
	
    freqToIdx( freq ) {
        const v1 = -188.75596010894685;
        const v2 = 81.79508702900829;
        const v3 = 30.416291139283476;
        const v4 = 0.2812954890617726;
        const v5 = 49.91248369525583;
        let val = ( this.getBaseLog( (freq - v1 ) / v2, v3 ) - v4 ) * v5;
		
        // freq = v1 + v2 * Math.pow( v3, v4 * idx / v5 ) + v6 * Math.pow( v7, v8 * idx / v9 );
        // freq - v1 = v2 * Math.pow( v3, v4 * idx / v5 ) + v6 * Math.pow( v7, v8 * idx / v9 );
		
        // freq = -44.51401880248667 +  77.50771033219084 * Math.pow( 2.8864295611172226, 13.050180958147799 + idx / 0.293946557709426 );
        // (freq + 44.51401880248667 ) / 77.50771033219084 = Math.pow( 2.8864295611172226, 13.050180958147799 + idx / 0.293946557709426 );
        // getBaseLog( (freq + 44.51401880248667 ) / 77.50771033219084, 2.8864295611172226)  = 13.050180958147799 + idx / 0.293946557709426;
        // ( getBaseLog( (freq + 44.51401880248667 ) / 77.50771033219084, 2.8864295611172226) - 13.050180958147799 ) * 0.293946557709426 = idx;
        //var val = ( this.getBaseLog( (freq + 44.51401880248667 ) / 77.50771033219084, 2.8864295611172226 ) - 0.293946557709426 ) * 13.050180958147799;
        val = Math.max( 0, Math.min( 63, Math.round( val ) ) );
        return val;
    }
	
}

// create container to store processed data
export const frame2 = new AudioFrame({
    normalize: true,
    normalizeFactor: 0,
    motionBlur: true,
    motionBlurFactor: 1,
    smooth: true,
    smoothFactor: 0.75,
    powerOf: 4,
    mono: true
});
