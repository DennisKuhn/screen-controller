export function getColor( val ) {
    return 'rgb(' + val.split(' ').map((c) => {
        return Math.ceil(c * 255);
    }).join(',') + ')'; 
}
export function getColorAsArray( val ) {
    return val.split(' ').map((c) => {
        return Math.ceil(c * 255);
    }); 
}
export function getSlider( val, min, max ) {
    return Math.max( min, Math.min( max, 1*val ) ); 
}
export function getBool( val ) {
    return val ? true : false; 
}

export function easeInOutQuad(t) {
    return t<.5 ? 2*t*t : -1+(4-2*t)*t; 
}
export function easeInOutCubic(t) {
    return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; 
}
export function easeInOutQuart(t) {
    return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t; 
}


export function rgbToHsl(r, g, b, factor) {
    r /= factor, 
    g /= factor, 
    b /= factor;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

export function hslToRgb(h, s, l) {
    let r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function rgbToHsv(r, g, b, factor) {
    var rr, gg, bb,
        r = r / factor,
        g = g / factor,
        b = b / factor,
        h, s,
        v = Math.max(r, g, b),
        diff = v - Math.min(r, g, b),
        diffc = function(c) {
            return (v - c) / 6 / diff + 1 / 2;
        };
    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(r);
        gg = diffc(g);
        bb = diffc(b);

        if (r === v) {
            h = bb - gg;
        } else if (g === v) {
            h = (1 / 3) + rr - bb;
        } else if (b === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        } else if (h > 1) {
            h -= 1;
        }
    }
    return [
        h, //Math.round(h * 360),
        s, //Math.round(s * 100),
        v  //Math.round(v * 100)
    ];
}

export function hsvToRgb(h, s, v) {
    let r, g, b;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [ Math.round(r * 255), Math.round(g * 255), Math.round(b * 255) ];
}


export function cosInterpolate( v1, v2, perc ) {
  	const mu2 = (1-Math.cos(perc*Math.PI))/2;
    return (v1*(1-mu2)+v2*mu2);
}


export function adjustPerc( perc, scale ) {
    if ( scale == 0 ) return perc;
	
    if ( perc < 0.5 ) {
        perc /= 0.5;
        if ( scale < 1 ) {
            perc = 1-Math.pow( 1-perc, -scale );
        } else {
            perc = Math.pow( perc, scale );
        }
        perc *= 0.5;
    } else {
        perc = 1 - perc;
        perc /= 0.5;
        if ( scale < 1 ) {
            perc = 1-Math.pow( 1-perc, -scale );
        } else {
            perc = Math.pow( perc, scale );
        }
        perc *= 0.5;
        perc = 1 - perc;
    }
    return perc;
}

	
export function shiftVal( i, shift, min, max ) {
    const d = max - min;
    i -= min;
    i += shift;
    i += d * 10000;
    i = i % d;
    i += min;
    i = Math.floor(i);
    return i;
}
    
export const getMethods = (obj) => {
    const properties = new Set();
    let currentObj = obj;
    do {
        Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
    } while ((currentObj = Object.getPrototypeOf(currentObj)));
    return [...properties.keys()].filter(item => typeof obj[item] === 'function');
};

export const getProperties = (obj) => {
    const properties = new Set();
    let currentObj = obj;
    do {
        Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
    } while ((currentObj = Object.getPrototypeOf(currentObj)));
    return [...properties.keys()].filter(item => typeof obj[item] != 'function');
};

export const getPropertyValues = (obj) => {
    return getProperties(obj).map(item => {
        return item + ': ' + obj[item]; 
    });
};

export function copyToClipboard( text ) {  
    const dummy = document.createElement('textarea'); 
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    // console.log('Copied to clipboard'); 
}

/**
 * Creates a new element and appends it to parent.
 * @param {string} elementName like div
 * @param {HTMLElement} parent 
 * @param {string} id 
 * @param {string} styleclass
 * @returns {HTMLElement}
 */
export function CreateAppend(elementName, parent, id, styleclass) {
    const newElement = document.createElement(elementName);
    parent.appendChild(newElement);

    if (id) {
        newElement.id = id;
    }
    if (styleclass) {
        newElement.classList.add( styleclass );
    }
    return newElement;
}
