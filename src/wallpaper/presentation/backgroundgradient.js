/**
 * Class for writing css gradients
 **/
export default class BackgroundGradient {
    constructor() {
        this._colorCount = 1;
        this._colors = [];
        this.settingsUpdated = true;
        this.updatedColors = [];
        this.type = 'linear';
        this.linearDirection = 'top';
        this.radialPosition = 'center center'; // 
        this.radialSize = 'farthest-corner'; // ellipse (closest-side | closest-corner | farthest-side | farthest-corner | contain | cover) 
    }

    get colors() {
        if (this.settingsUpdated) {
            this.applySettings(); 
        }

        return this._colors;
    }

    getCssColor( val ) {
        if (val) 
            return 'rgb(' + val.map( c => {
                return Math.ceil(c * 1 /* 255*/ );
            }).join(',') + ')'; 
    }

    applySettings() {
        if (this.settingsUpdated) {
    		this._colors = [];
    		for ( let i = 0; i < this._colorCount; i++ ) {
    			this._colors.push( [ i / (this._colorCount-1), this.getCssColor( this.updatedColors[i]) ] ); // array is [ position in %, color ]
    		}
            this.settingsUpdated = false;
        }
    }
	
    /**
     * @returns {number}
     */
    get colorCount() {
        return this._colorCount; 
    }
    set colorCount(count) {
        this._colorCount = count; this.settingsUpdated = true; 
    }

    get color0() {
        return this.updatedColors[0]; 
    }
    set color0(color) {
        this.updatedColors[0] = color; this.settingsUpdated = true; 
    }

    get color1() {
        return this.updatedColors[1]; 
    }
    set color1(color) {
        this.updatedColors[1] = color; this.settingsUpdated = true; 
    }

    get color2() {
        return this.updatedColors[2]; 
    }
    set color2(color) {
        this.updatedColors[2] = color; this.settingsUpdated = true; 
    }

    get color3() {
        return this.updatedColors[3]; 
    }
    set color3(color) {
        this.updatedColors[3] = color; this.settingsUpdated = true; 
    }

    get color4() {
        return this.updatedColors[4]; 
    }
    set color4(color) {
        this.updatedColors[4] = color; this.settingsUpdated = true; 
    }

    /**
	 * Something like "linear,left" or "radial,center center,ellipse cover"
	 * @param {string} newStyle up to 3 comma seperated values, first 'linear' or 'radial', the linear-direcation or radial-posiiton, third might be radial-size
	 */
    set style(newStyle) {
        const styles = newStyle.split(',');
        if ( styles[0] == 'linear' ) {
            this.type = 'linear';
            if ( styles.length > 1 ) this.linearDirection = styles[1];
        } else if ( styles[0] == 'radial' ) {
            this.type = 'radial';
            if ( styles.length > 1 ) this.radialPosition = styles[1];
            if ( styles.length > 2 ) this.radialSize = styles[2];
        }
    }
	
	
    getCssColorStops() {
        let css = '';

        for ( let i = 0; i < this.colors.length; i++ ) {
            if ( css.length ) css += ', ';
            css += this.colors[i][1] + ' ' + Math.round( 100 * this.colors[i][0] ) + '%';
        }
        // console.log("BackgroundGradient.getCssColorStops(): colors=" + this.colors.length + " = " + css );
        return css;
    }
	
    getCssValue() {
        if ( this.colors.length == 0 ) {
            return 'green'; // 'magenta';
        } else if ( this.colors.length == 1 ) {
            return '' + this.colors[ 0 ][ 1 ] + '';
        } else if ( this.type == 'radial' ) {
            var css = '-webkit-radial-gradient(' + this.radialPosition + ', ' + this.radialSize + ', ';
            css += this.getCssColorStops();
            css += ' )';
            return css;						
        } else /* if( this.type == 'linear' ) */ {
			
            var css = '-webkit-linear-gradient(' + this.linearDirection + ', ';
            css += this.getCssColorStops();
            css += ' )';
            return css;						
        }
    }
}
