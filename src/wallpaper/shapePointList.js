import proPro from './infrastructure/propertypropagator';
// import { shapeHeart } from './generators';
import { adjustPerc } from './utils/utils';

let nextShapeID = 0;


function shapePointList(points, smooth) {
    this.id = nextShapeID++;

    this.points = points || [];
    this.dontSmooth = !(smooth || false);
    this.removeDetail = 0;
    this.lengths = [];
    this.totalLength = 0;
    this.centerDeg = 0;
    this.height = 100;

    this.cx = 0;
    this.cy = 0;

    this.isSelected = false;
    this.isHighlighted = false;
    this.hasBeenRemoved = false;


    // if (this.points.length < 1) {
    //     const shape = new shapeHeart();

    //     for (let i = 0; i <= 1000; i++) {
    //         const pt = shape.getPositionFor(i / 1000, 0);
    //         this.points.push(pt[0]);
    //     }
    // }

    this.points2 = [];

    this.prevPointCount = -1;

    this.setRemoveDetailAmount = function(f) {
        this.removeDetail = f;
    };

    this.setSmoothing = function(b) {
        this.dontSmooth = !b;
    };

    this.setDataFromShape = function(shape) {
        this.points = [];
        this.prevPointCount = -1;
        this.lengths = [];
        this.points2 = [];

        for (let i = 0; i <= 1000; i++) {
            const pt = shape.getPositionFor(i / 1000, 0);
            this.points.push(pt[0]);
        }

        if (!this.dontSmooth) {
            for (let i = 0; i < this.points.length - 1; i++) {
                const xx = this.points[i][0] - this.points[i + 1][0];
                const yy = this.points[i][1] - this.points[i + 1][1];
                const len = (xx * xx + yy * yy);
                if (len < 50) {
                    this.points.splice(i + 1, 1);
                    i--;
                }
            }

            for (let i = 0; i < this.points.length - 2; i++) {
                const pt1 = this.points[i];
                const pt2 = this.points[i + 1];
                const pt3 = this.points[i + 2];

                const p1 = i == 0 ? 1 / 4 : 1 / 3;
                const p2 = i == this.points.length - 3 ? 1 / 4 : 1 / 3;

                const ptn1 = [pt2[0] + (pt1[0] - pt2[0]) * p1, pt2[1] + (pt1[1] - pt2[1]) * p1];
                const ptn2 = [pt2[0] + (pt3[0] - pt2[0]) * p2, pt2[1] + (pt3[1] - pt2[1]) * p2];


                this.points.splice(i + 1, 1, ptn2);
                this.points.splice(i + 1, 0, ptn1);
                i++;
            }

            //console.log( this.points );
        }
    };

    this.setData = function(points) {
        this.points = points;
        this.prevPointCount = -1;
        this.lengths = [];
        this.points2 = [];
        //console.error( 'dont smooth: ' + ( this.dontSmooth ? 'true' : 'false' ) );
        //console.error( 'remove detail ' + ( this.removeDetail ) );
        //console.error( 'before: ' + this.points.length );
        if (this.removeDetail) {
            for (let i = 0; i < this.points.length - 1; i++) {
                const xx = this.points[i][0] - this.points[i + 1][0];
                const yy = this.points[i][1] - this.points[i + 1][1];
                const len = (xx * xx + yy * yy);
                if (len < this.removeDetail) {
                    this.points.splice(i + 1, 1);
                    i--;
                }
            }
        }

        if (!this.dontSmooth) {
            for (let i = 0; i < this.points.length - 2; i++) {
                const pt1 = this.points[i];
                const pt2 = this.points[i + 1];
                const pt3 = this.points[i + 2];

                const p1 = i == 0 ? 1 / 4 : 1 / 3;
                const p2 = i == this.points.length - 3 ? 1 / 4 : 1 / 3;

                const ptn1 = [pt2[0] + (pt1[0] - pt2[0]) * p1, pt2[1] + (pt1[1] - pt2[1]) * p1];
                const ptn2 = [pt2[0] + (pt3[0] - pt2[0]) * p2, pt2[1] + (pt3[1] - pt2[1]) * p2];


                this.points.splice(i + 1, 1, ptn2);
                this.points.splice(i + 1, 0, ptn1);
                i++;
            }
            //console.log( this.points );
        }

        //console.error( 'after ' +  this.points.length );

    };

    this.getLength = function() {
        let totalLen = 0;
        for (let i = 0; i < this.points.length - 1; i++) {
            const xx = this.points[i][0] - this.points[i + 1][0];
            const yy = this.points[i][1] - this.points[i + 1][1];
            totalLen += Math.sqrt(xx * xx + yy * yy);
        }

        this.totalLength = totalLen;
        return totalLen;
    };

    this.prepare = function(totalPoints, scaleAdjustment) {
        if (totalPoints == this.prevPointCount) return;
        scaleAdjustment = scaleAdjustment || 0;

        //console.log( 'prepare(' + totalPoints + ')' );
        let totalLen = 0;
        let xx, yy, len;

        let cx = 0, cy = 0;

        this.lengths = [];
        this.points2 = [];

        if (this.points.length < 2) {
            return;
        }

        cx += this.points[0][0];
        cy += this.points[0][1];
        for (let i = 0; i < this.points.length - 1; i++) {
            xx = this.points[i][0] - this.points[i + 1][0];
            yy = this.points[i][1] - this.points[i + 1][1];
            this.lengths[i] = len = Math.sqrt(xx * xx + yy * yy);
            totalLen += len;

            cx += this.points[i + 1][0];
            cy += this.points[i + 1][1];
        }

        this.totalLength = totalLen;

        this.cx = cx / this.points.length;
        this.cy = cy / this.points.length;


        let parseLen = 0;
        let nextLen = 0;
        let nextPoint = 0;
        let dx0, dy0, dx1, dy1, dx2, dy2, l;

        for (let i = 0; i < this.points.length - 1; i++) {
            const segLen = this.lengths[i];
            while (nextLen >= parseLen && nextLen < segLen + parseLen) {
                const p = (nextLen - parseLen) / (segLen);
                const x = this.points[i][0] + (this.points[i + 1][0] - this.points[i][0]) * p;
                const y = this.points[i][1] + (this.points[i + 1][1] - this.points[i][1]) * p;



                dx1 = this.points[i + 1][1] - this.points[i][1];
                dy1 = -(this.points[i + 1][0] - this.points[i][0]);
                l = Math.sqrt(dx1 * dx1 + dy1 * dy1);
                dx1 /= l; dy1 /= l;

                if (p < 0.5) {
                    if (i > 0) {
                        dx0 = this.points[i][1] - this.points[i - 1][1];
                        dy0 = -(this.points[i][0] - this.points[i - 1][0]);
                        l = Math.sqrt(dx0 * dx0 + dy0 * dy0);
                        dx0 /= l; dy0 /= l;

                        //var f1 = 

                        dx1 = dx0 * (0.5 - p) + dx1 * (p + 0.5);
                        dy1 = dy0 * (0.5 - p) + dy1 * (p + 0.5);
                    } else {

                    }
                }


                if (p >= 0.5) {
                    if (i < this.points.length - 2) {
                        dx2 = this.points[i + 2][1] - this.points[i + 1][1];
                        dy2 = -(this.points[i + 2][0] - this.points[i + 1][0]);
                        l = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                        dx2 /= l; dy2 /= l;

                        dx1 = dx2 * (p - 0.5) + dx1 * (1 - p + 0.5);
                        dy1 = dy2 * (p - 0.5) + dy1 * (1 - p + 0.5);
                    } else {

                    }
                }


                this.points2.push([x, y, dx1, dy1]);

                nextPoint++;
                nextLen = totalLen * adjustPerc(nextPoint / (totalPoints - 1), scaleAdjustment);
            }
            parseLen += segLen;
        }

        if (this.points2.length < totalPoints) {
            // for rare case it actually end up perfectly at 100% and the final point does not get made :)
            this.points2.push([this.points[this.points.length - 1][0], this.points[this.points.length - 1][1], dx1, dy1]);
        }

        this.prevPointCount = totalPoints;
        //console.log( 'prepare Finished(' + this.points2.length + ')' );
        //console.log( this.points2 );
    };
    const heightDir = 3;


    this.getPositionFor = function(perc, val) {
        if (this.points2.length < 2) return [[0, 0], [0, 0]];
        const idx = Math.round(perc * (this.points2.length - 1));

        const pt = this.points2[idx];

        let pt0;
        let pt1;
        if ((heightDir & 1) != 0) {
            pt0 = [pt[0] - pt[2] * this.height * val, pt[1] - pt[3] * this.height * val];
        } else {
            pt0 = [pt[0], pt[1]];
        }

        if ((heightDir & 2) != 0) {
            pt1 = [pt[0] + pt[2] * this.height * val, pt[1] + pt[3] * this.height * val];
        } else {
            pt1 = [pt[0], pt[1]];
        }

        return [pt0, pt1];
    };

    this.isPointInside = function(point, radiusFactor) {
        // console.log("shapePointList.isPointInside(" + point + ") radius=" + radiusFactor + " " + [proPro.width, proPro.height])

        // ray-casting algorithm based on
        // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
        const cx = proPro.width / 2;
        const cy = proPro.height / 2;

        const points = [];
        const innerPoints = [];
        const outerPoints = [];
        for (let i = 0; i <= 100; i++) {
            const pos = this.getPositionFor(i / 100, 0.1);
            const inner = pos[0];
            const outer = pos[1];
            inner[0] *= radiusFactor;
            inner[1] *= radiusFactor;
            outer[0] *= radiusFactor;
            outer[1] *= radiusFactor;
            inner[0] += cx;
            inner[1] += cy;
            outer[0] += cx;
            outer[1] += cy;
            innerPoints.push(inner);
            outerPoints.push(outer);
        }

        const l = outerPoints.length;
        for (let i = 0; i < l; i++) {
            points.push(outerPoints[i]);
        }
        for (let i = l - 1; i >= 0; i--) {
            points.push(innerPoints[i]);
        }

        const vs = points;

        const x = point[0], y = point[1];

        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i][0], yi = vs[i][1];
            const xj = vs[j][0], yj = vs[j][1];

            const intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    };

    this.translate = function(x, y) {
        for (let i = 0; i < this.points.length; i++) {
            this.points[i][0] += x;
            this.points[i][1] += y;
        }
        this.prevPointCount = -1;
    };

    this.rotate = function(r) {
        for (let i = 0; i < this.points.length; i++) {
            const x = this.points[i][0] - this.cx;
            const y = this.points[i][1] - this.cy;

            const pt = this.rotatePoint(x, y, r);

            this.points[i][0] = pt[0] + this.cx;
            this.points[i][1] = pt[1] + this.cy;

        }

        this.prevPointCount = -1;
    };

    this.scale = function(x, y) {
        for (let i = 0; i < this.points.length; i++) {
            this.points[i][0] = (this.points[i][0] - this.cx) * x + this.cx;
            this.points[i][1] = (this.points[i][1] - this.cy) * y + this.cy;
        }
        this.prevPointCount = -1;
    };

    this.rotatePoint = function(x, y, rad) {

        const x2 = x * Math.cos(rad) - y * Math.sin(rad);
        const y2 = y * Math.cos(rad) + x * Math.sin(rad);
        return [x2, y2];
    };
}

export default shapePointList;