'use strict';

import delayed from './utils/delayed';
import { shapePointList } from './shapelist';

/**
 * 
 */
export default class SvgSource {
    constructor(src, removeDetailAmount, shapeList, cbUpdate, cbComplete) {
        this.removeDetailAmount = removeDetailAmount;
        this.shapeList = shapeList;
        this.cbUpdate = cbUpdate;
        this.cbComplete = cbComplete;

        this.minX = Number.POSITIVE_INFINITY;
        this.minY = Number.POSITIVE_INFINITY;
        this.maxX = Number.NEGATIVE_INFINITY;
        this.maxY = Number.NEGATIVE_INFINITY;

        const parser = new DOMParser();
        const doc = parser.parseFromString(src, 'image/svg+xml');
        this.paths = doc.getElementsByTagName('path');
        this.pointLists = [];
        this.totalPaths = this.paths.length;
        this.currentPath = 0;
        // console.log("SvgSource.constructor() totalPaths=" + this.totalPaths);

        this.delayedProcess = new delayed( () => this.process(), 1);

        this.delayedProcess.trigger();
    }

    process() {
        const pathEl = this.paths[this.currentPath];
        const pts = [];
        const pathLen = pathEl.getTotalLength();

        for (let j = 0; j <= (1024); j++) {
            const pt = pathEl.getPointAtLength(pathLen * j / (1024));

            this.minX = Math.min( pt.x, this.minX);
            this.minY = Math.min( pt.y, this.minY);
            this.maxX = Math.max( pt.x, this.maxX);
            this.maxY = Math.max( pt.y, this.maxY);

            // console.log("Add ( " + pt.x + ", " + pt.y + " ) = ( " + x + ", " + y + " ) X=" + this.minX + ".." + this.maxX + " y=" + this.minY + ".." + this.maxY );
            pts.push([pt.x, pt.y]);
        }
        this.pointLists.push(pts);
        this.currentPath++;
        if (this.currentPath < this.totalPaths) {
            if (this.cbUpdate) {
                this.cbUpdate(this.currentPath / this.totalPaths);
            }
            this.delayedProcess.trigger();
        } else {
            this.onComplete();
        }
    }

    onComplete() {
        const dx = this.maxX - this.minX;
        const dy = this.maxY - this.minY;
        const d = Math.max(dx, dy);
        const d2 = Math.min(dx, dy);
        let dx1 = 1;
        let dy1 = 1;
        if (d == dx) {
            dy1 = dy / dx;
        } else {
            dx1 = dx / dy;
        }
        for (let i = 0; i < this.pointLists.length; i++) {
            const points = this.pointLists[i];
            // console.log("onComplete(): pointLists["+ i + "] = " + points);
            for (let j = 0; j < points.length; j++) {
                // console.log("onComplete(): points["+ j + "] = " + points[j]);
                points[j][0] = ((points[j][0] - this.minX) / dx) * dx1 * 400 - 200 * dx1;
                points[j][1] = ((points[j][1] - this.minY) / dy) * dy1 * 400 - 200 * dy1;
            }
        }
        if (hasInit) {
            this.toShapeList();
        }
        if (this.cbComplete)
            this.cbComplete();
    }

    toShapeList() {
        this.shapeList.empty();
        // console.log("toShapeList pointLists.length=" + this.pointLists.length);
        for (let i = 0; i < this.pointLists.length; i++) {
            const points = this.pointLists[i];
            const s = new shapePointList();
            s.setRemoveDetailAmount(this.removeDetailAmount);
            s.setData(points);
            this.shapeList.add(s);
        }
    }
}

export let svgSource;

export function SvgFileSource(fileuri, removeDetailAmount, shapeList, cbUpdate, cbComplete) {
    const reader = new FileReader();

    reader.onload = function(e) {
        
        svgSource = new SvgSource( 
            reader.result, 
            removeDetailAmount,
            shapeList,
            cbUpdate, 
            cbComplete );
    };

    reader.readAsText(fileuri); 
}

export let hasInit = false;
