import { rgbToHsl } from './utils/utils';
import { frame2 } from './audioframe';

/**
 * Contains settings for render() function, called by PropertyPropagator
 */
class Renderer {
    constructor() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.rotation = 0;
        this.renderMethod = 1;
        this.interpolationSteps = 1;
        this.interpolationBalanced = true;
        this._color1 = [1, 0, 0];
        this._color2 = [0, 1, 0];
        this._color3 = [0, 0, 1];
        this.hslcolor1 = [0, 1, 0.5];
        this.hslcolor2 = [0.333333, 1, 0.5];
        this.hslcolor3 = [0.666666, 1, 0.5];
        this.colorGradient = 2;
        this.colorRotation = true;
        this._colorGlow = 0;
        this.colorGlowStrength = 2;
        this.paused = false;
        this.width = 0;
        this.height = 0;
        this._loaded = false;
        this.canvasBg = document.getElementById('canvasBg'); // reference to our canvas element
    }

    init() {
        frame2.config.lastEqChange = performance.now() - 5000;
        this._loaded = true;
    }

    get color1() {
        return this._color1;
    }
    set color1(rgbColor) {
        this._color1 = rgbColor;
        this.hslcolor1 = rgbToHsl(rgbColor[0], rgbColor[1], rgbColor[2], 255);
    }

    get color2() {
        return this._color2;
    }
    set color2(rgbColor) {
        this._color2 = rgbColor;
        this.hslcolor2 = rgbToHsl(rgbColor[0], rgbColor[1], rgbColor[2], 255);
    }

    get color3() {
        return this._color3;
    }
    set color3(rgbColor) {
        this._color3 = rgbColor;
        this.hslcolor3 = rgbToHsl(rgbColor[0], rgbColor[1], rgbColor[2], 255);
    }


    get colorGlow() {
        return this._colorGlow;
    }
    set colorGlow(glow) {
        this._colorGlow = glow;
        if (this._colorGlow == 0) {
            this.canvasBg.style.display = 'none';
        } else {
            this.canvasBg.style.display = 'block';
        }
        if (this._colorGlow >= 1) this._colorGlow += 1;
        this.canvasBg.style.filter = 'blur(' + this._colorGlow + (this._colorGlow ? 'px' : '') + ')';
    }
}

export const renderer = new Renderer();
