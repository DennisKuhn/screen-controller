/**
 * renders an audioFrame obect 
 *
 * @param ctx 2d canvas context
 * @param color strokeStyle value
 * @param frame AudioFrame object
 * @param offset horizontal offset in degrees for the "vertical" lines
 *
 **/
class AudioShapeRenderer {
	 constructor() {
		 this._freqScaleAdjustment = 1;
		 this._freqScaleAdjustmentAnim = true;
	 }
	 get freqScaleAdjustment() {
        if ( this._freqScaleAdjustment < 0 ) {								
            return -( (newfreqScaleAdjustment * -100) - 1 );
        } else if ( this._freqScaleAdjustment == 0 ) {								
            return 0;
        } else {
            return ( (newfreqScaleAdjustment * 100) - 1 );
        }
    }
	 get freqScaleAdjustmentAnim() {
        return this._freqScaleAdjustmentAnim; 
    }
	 
	 set freqScaleAdjustment(newfreqScaleAdjustment) {
			
        if ( newfreqScaleAdjustment < 0 ) {								
            newfreqScaleAdjustment = -( 1 + newfreqScaleAdjustment / -100 );
        } else if ( newfreqScaleAdjustment == 0 ) {								
            newfreqScaleAdjustment = 0;
        } else {
            newfreqScaleAdjustment = ( 1 + newfreqScaleAdjustment / 100 );
        }
        this._freqScaleAdjustment = newfreqScaleAdjustment; 
		
        shapeList.resetPreperation();
    }
    set freqScaleAdjustmentAnim(newfreqScaleAdjustmentAnim) { 
		 this._freqScaleAdjustmentAnim = newfreqScaleAdjustmentAnim; 
		 shapeList.resetPreperation();
    }
}

const audioShapeRender = new AudioShapeRenderer();

function shaperenderaudioframe( ctx, color, frame, shape, interpolation, interpolationBalanced, renderMethod, radiusFactor ) {
    timer.start( 'render shape' );
    timer.start( 'calculate shape' );
    const cx = proPro.width / 2;
    const cy = proPro.height / 2;
	
    let audioArray = frame.audioDataResult.left;
	
    const highlight = shape.isHighlighted || shape.isSelected;
    if ( highlight ) {
        renderMethod = '3'; 
    }
	
    let minAudioIdx = 0;
    let maxAudioIdx = 63;
    let totalValues = maxAudioIdx + 1 - minAudioIdx;
	
    let interpolationSteps = interpolation || 1;	
	
    if ( interpolationBalanced && shape.totalLength ) {
        let pointsWanted =  shape.totalLength * radiusFactor * interpolationSteps / 40;
        //pointsWanted = Math.pow(2, Math.ceil(Math.log(pointsWanted)/Math.log(2)));
        if ( pointsWanted < totalValues ) {
            if ( pointsWanted < 4 ) pointsWanted = 4;
            const step = totalValues / pointsWanted;
            const newAudioArray = new AudioArray();
            for ( var i = 0; i <= totalValues; i+= step ) {
                var v = audioArray.max( Math.floor(i), Math.ceil( i + step - 1 ) );
                newAudioArray.data[ Math.round( i / step ) ] = v;
            }
            audioArray = newAudioArray;
            minAudioIdx = 0;
            maxAudioIdx = Math.floor(pointsWanted-1);
            totalValues = Math.floor( maxAudioIdx + 1 - minAudioIdx );
            interpolationSteps = 1;
        } else if ( pointsWanted > totalValues ) {
            interpolationSteps = Math.round(pointsWanted / totalValues);
        }
        /*
		var altInterpolationSteps =  shape.totalLength * radiusFactor / 20 / totalValues;
		if( altInterpolationSteps < 1 ) altInterpolationSteps = 1 + -1 / altInterpolationSteps;
		altInterpolationSteps -= 1;
		interpolationSteps += Math.min(10, Math.max(1, altInterpolationSteps + interpolationSteps ) );*/
        //console.log( ( shape.totalLength * radiusFactor ) + ' : ' + pointsWanted + ':' + interpolationSteps );
    }
	
    const totalSteps = ((totalValues) * 2 - 1) +  ((totalValues) * 2 - 2)* (interpolationSteps-1) ;  // -1 is for shared item
    //console.log( 'totalSteps ' + totalSteps );
	
    // do any preperation calculations needed
    if ( audioShapeRender._freqScaleAdjustmentAnim ) {
        shape.prevPointCount = -1;
    }
	
    let scale = audioShapeRender._freqScaleAdjustment;
    let scaleAnimValue = 0;

    if ( audioShapeRender._freqScaleAdjustmentAnim ) {
        const p = (performance.now() / 200) % 360;
        scaleAnimValue = 60 * Math.sin( p * Math.PI / 180 );
        if ( scaleAnimValue < 0 ) {								
            scale = -( 1 +  scaleAnimValue / -100 );
        } else if ( scaleAnimValue == 0 ) {								
            scale = 0;
        } else {
            scale = 1 + scaleAnimValue / 100;
        }
    }
	
    shape.prepare( totalSteps, scale );
	
    const innerPoints = [];
    const outerPoints = [];
	
    // start building up point list
    var v, v2 = null;
    let inner, outer;
    for ( var i = maxAudioIdx; i >= minAudioIdx; i-- ) {
        v = highlight ? 0.05 : audioArray.data[ i ]; //shiftVal(i, frameCount/10, minAudioIdx, maxAudioIdx+1 ) ];
        if ( v2 !== null ) {
            for ( var j = 1; j < interpolationSteps; j++ ) {
                var k = j / interpolationSteps;
                var v3 = cosInterpolate( v, v2, 1-k );   
				
                //console.log( ( ( (maxAudioIdx-i-1) - minAudioIdx ) * interpolationSteps + j ) +' //  '+ (totalSteps-1) + ' = ' + (( ( (maxAudioIdx-i-1) - minAudioIdx ) * interpolationSteps + j ) / (totalSteps-1)) )		
                var pos = shape.getPositionFor( ( ( ( (maxAudioIdx-i-1) - minAudioIdx ) * interpolationSteps + j ) / (totalSteps-1) ), v3 );
                inner = pos[ 0 ];
                outer = pos[ 1 ];
                inner[ 0 ] *= radiusFactor;
                inner[ 1 ] *= radiusFactor;
                outer[ 0 ] *= radiusFactor;
                outer[ 1 ] *= radiusFactor;
                inner[ 0 ] += cx;
                inner[ 1 ] += cy;
                outer[ 0 ] += cx;
                outer[ 1 ] += cy;
                //inner[ 0 ] = Math.round( inner[0] );
                //inner[ 1 ] = Math.round( inner[1] );
                //outer[ 0 ] = Math.round( outer[0] );
                //outer[ 1 ] = Math.round( outer[1] );
                innerPoints.push( inner );
                outerPoints.push( outer );
            }		
        }

        //console.log( ( ( (maxAudioIdx-i) - minAudioIdx ) * interpolationSteps ) +' /  '+ (totalSteps-1) + ' = ' + (( ( (maxAudioIdx-i) - minAudioIdx ) * interpolationSteps ) / (totalSteps-1)) )		
        var pos = shape.getPositionFor( ( ( ( (maxAudioIdx-i) - minAudioIdx ) * interpolationSteps ) / (totalSteps-1) ), v );
        //console.log( i + " " + ( ( ( (maxAudioIdx-i) - minAudioIdx ) * interpolationSteps ) / (totalSteps-1) ) + ' ' + v + ' ' + pos );
        inner = pos[ 0 ];
        outer = pos[ 1 ];
        inner[ 0 ] *= radiusFactor;
        inner[ 1 ] *= radiusFactor;
        outer[ 0 ] *= radiusFactor;
        outer[ 1 ] *= radiusFactor;
        inner[ 0 ] += cx;
        inner[ 1 ] += cy;
        outer[ 0 ] += cx;
        outer[ 1 ] += cy;
        //inner[ 0 ] = Math.round( inner[0] );
        //inner[ 1 ] = Math.round( inner[1] );
        //outer[ 0 ] = Math.round( outer[0] );
        //outer[ 1 ] = Math.round( outer[1] );
        innerPoints.push( inner );
        outerPoints.push( outer );
        v2 = v;
    }
	
    v2 = null;
    for ( var i = minAudioIdx; i <= maxAudioIdx; i++ ) {
        v = highlight ? 0.05 : audioArray.data[ i ]; // shiftVal(i, frameCount/10, minAudioIdx, maxAudioIdx+1 ) ];
        if ( v2 !== null ) {
            for ( var j = 1; j < interpolationSteps; j++ ) {
                var k = j / interpolationSteps;
                var v3 = cosInterpolate( v, v2, 1 - k );   
				
                //console.log( ( ( totalValues-1 + i - minAudioIdx - 1 ) * interpolationSteps + j  ) + ' // ' + (totalSteps) + ' = ' + ( ( ( totalValues-1 + i - minAudioIdx - 1 ) * interpolationSteps + j  ) / (totalSteps-1) ));
                var pos = shape.getPositionFor( ( ( ( totalValues-1 + i - minAudioIdx - 1 ) * interpolationSteps + j  ) / (totalSteps-1) ), v3 );
                inner = pos[ 0 ];
                outer = pos[ 1 ];
                inner[ 0 ] *= radiusFactor;
                inner[ 1 ] *= radiusFactor;
                outer[ 0 ] *= radiusFactor;
                outer[ 1 ] *= radiusFactor;
                inner[ 0 ] += cx;
                inner[ 1 ] += cy;
                outer[ 0 ] += cx;
                outer[ 1 ] += cy;
                //inner[ 0 ] = Math.round( inner[0] );
                //inner[ 1 ] = Math.round( inner[1] );
                //outer[ 0 ] = Math.round( outer[0] );
                //outer[ 1 ] = Math.round( outer[1] );
                innerPoints.push( inner );
                outerPoints.push( outer );
            }
        }
        //console.log( (( totalValues - 1 + i - minAudioIdx) * interpolationSteps ) + ' /  ' + (totalSteps-1) + ' ' + ( ( totalValues  -1 + i - minAudioIdx ) * interpolationSteps ) / (totalSteps-1) );
        var pos = shape.getPositionFor( ( ( ( totalValues  - 1  + i - minAudioIdx ) * interpolationSteps ) / (totalSteps-1) ), v );
        inner = pos[ 0 ];
        outer = pos[ 1 ];
        inner[ 0 ] *= radiusFactor;
        inner[ 1 ] *= radiusFactor;
        outer[ 0 ] *= radiusFactor;
        outer[ 1 ] *= radiusFactor;
        inner[ 0 ] += cx;
        inner[ 1 ] += cy;
        outer[ 0 ] += cx;
        outer[ 1 ] += cy;
        //inner[ 0 ] = Math.round( inner[0] );
        //inner[ 1 ] = Math.round( inner[1] );
        //outer[ 0 ] = Math.round( outer[0] );
        //outer[ 1 ] = Math.round( outer[1] );
        innerPoints.push( inner );
        outerPoints.push( outer );
        v2 = v;
    }
    timer.stop( 'calculate shape' );

    // render it all :)	
    const l = outerPoints.length;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    if ( (renderMethod & 1) > 0 ) {
        timer.start( 'lines shape' );
        ctx.beginPath();
        ctx.lineWidth = 1;
        for ( var i = 0; i < Math.floor( l/2 ); i+=1  ) {
            var len = Math.pow( outerPoints[i][0]-innerPoints[i][0], 2 ) +Math.pow( outerPoints[i][1]-innerPoints[i][1], 2 );
            if ( len > frame.config.heightCutoff ) {
                ctx.moveTo( innerPoints[i][0], innerPoints[i][1] );
                ctx.lineTo( outerPoints[i][0], outerPoints[i][1] );
            }
        }
        for ( var i = Math.floor( l/2 ); i < l; i+=1 ) {
            var len = Math.pow( outerPoints[i][0]-innerPoints[i][0], 2 ) +Math.pow( outerPoints[i][1]-innerPoints[i][1], 2 );
            if ( len > frame.config.heightCutoff ) {
                ctx.moveTo( innerPoints[i][0], innerPoints[i][1] );
                ctx.lineTo( outerPoints[i][0], outerPoints[i][1] );
            }
        }
        ctx.stroke();
        timer.stop( 'lines shape' );
    }
	
    if ( (renderMethod & 6) > 0 ) {
        timer.start( 'outline shape' );
        ctx.beginPath();
        ctx.moveTo( (outerPoints[0][0] ), (outerPoints[0][1] ) );
        for ( var i = 1; i < l; i++ ) {	
            if ( i%2 == 1 ) 
                ctx.lineTo( (innerPoints[i][0] ), (innerPoints[i][1] ));
            else 
                ctx.lineTo( (outerPoints[i][0] ), (outerPoints[i][1] ) );
        }
        for ( var i = l-1; i >= 0; i-- ) {
            if ( i%2 == 0 ) 
                ctx.lineTo( (innerPoints[i][0] ), (innerPoints[i][1] ));
            else 
                ctx.lineTo( (outerPoints[i][0] ), (outerPoints[i][1] ) );
        }
        ctx.lineTo( (outerPoints[0][0] ), (outerPoints[0][1] ) );
        ctx.beginPath();
        ctx.moveTo( (outerPoints[0][0] ), (outerPoints[0][1] ) );
        for ( var i = 1; i < l; i++ ) {
            ctx.lineTo( (outerPoints[i][0] ), (outerPoints[i][1] ) );
        }
        for ( var i = l-1; i >= 0; i-- ) {
            ctx.lineTo( (innerPoints[i][0] ), (innerPoints[i][1] ));
        }
        ctx.lineTo( (outerPoints[0][0] ), (outerPoints[0][1] ) );
        if ( (renderMethod & 2) > 0 ) {
            ctx.stroke (); 
        }
        if ( (renderMethod & 4) > 0 ) {
            ctx.fill (); 
        }
        timer.stop( 'outline shape' );
    }
	
    if ( (renderMethod & 8) > 0 ) {
        timer.start( 'outline shape' );
        ctx.beginPath();
        ctx.moveTo( (outerPoints[0][0] ), (outerPoints[0][1] ) );
        for ( var i = 1; i < l; i++ ) {	
            if ( i%2 == 1 ) 
                ctx.lineTo( (innerPoints[i][0] ), (innerPoints[i][1] ));
            else 
                ctx.lineTo( (outerPoints[i][0] ), (outerPoints[i][1] ) );
        }
        for ( var i = l-1; i >= 0; i-- ) {
            if ( i%2 == 0 ) 
                ctx.lineTo( (innerPoints[i][0] ), (innerPoints[i][1] ));
            else 
                ctx.lineTo( (outerPoints[i][0] ), (outerPoints[i][1] ) );
        }
        ctx.lineTo( (outerPoints[0][0] ), (outerPoints[0][1] ) );
        if ( (renderMethod & 8) > 0 ) {
            ctx.stroke (); 
        }
        timer.stop( 'outline shape' );
    }
	
	
    //console.log( outerPoints );
    timer.stop( 'render shape' );
    return;
	
}
