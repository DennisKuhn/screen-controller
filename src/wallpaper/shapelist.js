/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
    shapeButterfly, shapeCircle, shapeHeart, shapeLeaf
} from './generators';
import { frame2 } from './audioframe';
import { shaperenderaudioframe } from './shaperenderaudioframe';
import mainMenu from './mainmenu';
import shapePointList from './shapePointList';

/**
 * 
 */
export default class ShapeList {
    constructor() {
        this.defaultShapes = {
            circle: shapeCircle,
            heart: shapeHeart,
            cannabis: shapeLeaf,
            butterfly: shapeButterfly
        };
        this.shapes = [new shapePointList()];

        this.useAutosave = true;
        this._radiusFactor = 1;
    }

    get radiusFactor() {
        return Number((this._radiusFactor * 100).toPrecision(16));
    }
    set radiusFactor(newRadiusFactor) {
        this._radiusFactor = newRadiusFactor / 100;
    }

    empty() {
        this.shapes = [];
    }
    add(shape) {
        if (shape.getLength() > 5) {
            this.shapes.push(shape);
        }
    }

    createShape(shapeName) {
        if (this.defaultShapes.hasOwnProperty(shapeName)) {
            const s = new this.defaultShapes[shapeName]();
            const s2 = new shapePointList([], false);
            s2.setDataFromShape(s);
            this.add(s2);
            return s2;
        }

        return null;
    }

    render(context, color, interpolationSteps, interpolationBalanced, renderMethod) {
        for (let i = 0; i < this.shapes.length; i++) {
            if (this.shapes[i].hasBeenRemoved) {
                this.shapes.splice(i, 1);
                i--;
                this.updateAutosave();
                continue;
            }
            shaperenderaudioframe(context, color, frame2, this.shapes[i], interpolationSteps, interpolationBalanced, renderMethod, this._radiusFactor);
        }
    }

    resetPreperation() {
        for (let i = 0; i < this.shapes.length; i++) {
            this.shapes[i].prevPointCount = -1;
        }
    }

    updateAutosave() {
        if (this.useAutosave) {
            window.storage.saveShapeList('as_autosave', this);
            mainMenu.updateStorageStats();
        }
    }

    importJson(json) {
        //console.log( json );
        const obj = JSON.parse(json);
        if (typeof obj == 'object' && obj) {
            this.empty();
            //console.log( obj.length );
            //console.log( 'importJson2 ' + obj.length );
            for (let i = 0; i < obj.length; i++) {
                const s = new shapePointList([], false);
                s.setData(obj[i]);
                this.add(s);
            }
        }
    }

    exportJson() {
        const arr = [];
        //console.log( this.shapes.length );
        for (let i = 0; i < this.shapes.length; i++) {
            arr.push(this.shapes[i].points);
        }
        return JSON.stringify(arr, (key, value) => {
            // limit precision of floats
            if (typeof value === 'number') {
                return parseFloat(value.toFixed(2));
            }
            return value;
        });
    }

    getShapesForPoint(point) {
        const arr = [];
        for (let i = 0; i < this.shapes.length; i++) {
            if (this.shapes[i].isPointInside(point, this._radiusFactor)) {
                arr.push(this.shapes[i]);
            }
        }
        return arr;
    }

    hasPointShape(point) {
        for (let i = 0; i < this.shapes.length; i++) {
            if (this.shapes[i].isPointInside(point, this._radiusFactor)) {
                return true;
            }
        }
        return false;
    }

}

export const shapeList = new ShapeList();

