import { easeInOutQuad } from './utils/utils';
import { shapeList, shapePointList} from './shapelist';
import { hasInit } from './svgsource';

/**
 * Base class for all ShapeGenerators like generatorBiohazard and ShapeCreator, wich is the base for shapeHeart, ...
 */
class ShapeGenerator {
    constructor() {

    }

    // - - - - - - I n t e r f a c e
    generate( shapeList ) {		
    }

    // - - - - - - T o o l s
    static rotate( x, y, rad ) {
        const x2 = x * Math.cos(rad) - y * Math.sin( rad );
        const y2 = y * Math.cos(rad) + x * Math.sin( rad );
        return [x2,y2];
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorBiohazard extends ShapeGenerator {
    generate(shapeList) {
        shapeList.empty();
        let dt = [];
        for (var i = 0; i <= 720; i++) {
            var rad = (i * Math.PI * 1.75 / 720) - Math.PI * 157 / 180;
            var x = Math.sin(rad);
            var y = Math.cos(rad);
            dt.push([x * 100, y * 100 - 120]);
        }
        var pl = new shapePointList();
        pl.setData(dt);
        shapeList.add(pl);
        for (var i = 1; i < 3; i++) {
            const angle = i * Math.PI * 120 / 180;
            const dt2 = [];
            for (let j = 0; j < dt.length; j++) {
                dt2.push(ShapeGenerator.rotate(dt[j][0], dt[j][1], angle));
            }
            var pl = new shapePointList();
            pl.setData(dt2);
            shapeList.add(pl);
        }
        dt = [];
        for (var i = 0; i <= 100; i++) {
            var rad = ((i + 10) * Math.PI / 180);
            var x = Math.sin(rad);
            var y = Math.cos(rad);
            dt.push([x * 100, y * 100]);
        }
        var pl = new shapePointList();
        pl.setData(dt);
        shapeList.add(pl);
        dt = [];
        for (var i = 0; i <= 100; i++) {
            var rad = ((i + 10 + 120) * Math.PI / 180);
            var x = Math.sin(rad);
            var y = Math.cos(rad);
            dt.push([x * 100, y * 100]);
        }
        var pl = new shapePointList();
        pl.setData(dt);
        shapeList.add(pl);
        dt = [];
        for (var i = 0; i <= 100; i++) {
            var rad = ((i + 10 + 240) * Math.PI / 180);
            var x = Math.sin(rad);
            var y = Math.cos(rad);
            dt.push([x * 100, y * 100]);
        }
        var pl = new shapePointList();
        pl.setData(dt);
        shapeList.add(pl);
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorPokeball extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( let i = 0; i <= 1000; i++ ) {
            const rad = ( i * Math.PI / 500.01 ) + Math.PI;
			
            const x = Math.sin(rad);
            const y = Math.cos(rad);
            dt.push([ x*200, y*200 ]);
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        var dt2 = [];
        for ( var j = 0; j < dt.length; j++ ) {
            dt2.push( [ dt[j][0]*0.30, dt[j][1]*0.30 ] );
        }
		
        var pl = new shapePointList();
        pl.setData( dt2 );
        shapeList.add( pl );
		 dt2 = [];
        for ( var j = 0; j < dt.length; j++ ) {
            dt2.push( [ dt[j][0]*0.15, dt[j][1]*-0.15 ] );
        }
		
        var pl = new shapePointList();
        pl.setData( dt2 );
        shapeList.add( pl );
	
        const dt1 = [[190,0],[70,0]];
        var dt2 = [[-190,0],[-70,0]];
		
        var pl;
        pl = new shapePointList(); pl.setData( dt1 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt2 ); shapeList.add( pl );
		
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorYinYang extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        let dt = [];
        for ( var i = 0; i <= 720; i++ ) {
            var rad = -( i * Math.PI / 360.01 );
            if ( i > 360 )  rad = -Math.PI-rad;
			
            var x = Math.sin(rad);
            var y = Math.cos(rad);
            if ( x > 0 ) y -= 1;
            if ( x <= 0 ) y += 1;
            dt.push([ x*100, y*100 ]);
        }
		
        let pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        dt = [];
        for ( var i = 0; i <= 360; i++ ) {
            var rad = ( i * Math.PI / 360.00 );
			
            var x = Math.sin(rad);
            var y = Math.cos(rad);
            dt.push([ x*200, y*200 ]);
        }
		
        pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        dt = [];
        for ( var i = 360; i <= 720; i++ ) {
            var rad = ( i * Math.PI / 360.00 );
			
            var x = Math.sin(rad);
            var y = Math.cos(rad);
            dt.push([ x*200, y*200 ]);
        }
		
        pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        dt = [];
        for ( var i = 0; i <= 720; i++ ) {
            var rad = ( i * Math.PI / 360.00 ) + Math.PI/2;
			
            var x = Math.sin(rad);
            var y = Math.cos(rad);
            dt.push([ x*35, y*35-100 ]);
        }
		
        pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );

        dt = [];
        for ( var i = 0; i <= 720; i++ ) {
            var rad = ( i * Math.PI / 360.00 ) - Math.PI/2;
			
            var x = Math.sin(rad);
            var y = Math.cos(rad);
            dt.push([ x*35, y*35+100 ]);
        }
		
        pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorAtom extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        let pl, dt1, dt2;
		
        dt1 = [];
        for ( var i = 0; i <= 360; i++ ) {
            var rad = ( i * Math.PI / 360.00 );			
            var x = Math.sin(rad);
            var y = Math.cos(rad);
            dt1.push([ x*200, y*50 ]);
        }
		
        pl = new shapePointList();
        pl.setData( dt1 );
        shapeList.add( pl );
		
        dt2 = [];
        for ( var i = 360; i <= 720; i++ ) {
            var rad = ( i * Math.PI / 360.00 );			
            var x = Math.sin(rad);
            var y = Math.cos(rad);
            dt2.push([ x*200, y*50 ]);
        }
		
        pl = new shapePointList();
        pl.setData( dt2 );
        shapeList.add( pl );
		
        for ( var i = 1; i < 4; i++ ) {
            const angle = i * Math.PI * 1 / 4 ;
            let dt3 = [];
            for ( var j = 0; j < dt1.length; j++ ) {
                dt3.push( ShapeGenerator.rotate( dt1[j][0], dt1[j][1], angle ) );
            }
		
            pl = new shapePointList();
            pl.setData( dt3 );
            shapeList.add( pl );
			
            dt3 = [];
            for ( var j = 0; j < dt2.length; j++ ) {
                dt3.push( ShapeGenerator.rotate( dt2[j][0], dt2[j][1], angle ) );
            }
		
            pl = new shapePointList();
            pl.setData( dt3 );
            shapeList.add( pl );
        }
		
        dt1 = [];
        for ( var i = 0; i <= 360; i++ ) {
            var rad = ( i * Math.PI / 360.00 );			
            var x = Math.sin(rad);
            var y = Math.cos(rad);
            dt1.push([ x*35, y*35 ]);
        }
		
        pl = new shapePointList();
        pl.setData( dt1 );
        shapeList.add( pl );
		
        dt2 = [];
        for ( var i = 360; i <= 720; i++ ) {
            var rad = ( i * Math.PI / 360.00 );			
            var x = Math.sin(rad);
            var y = Math.cos(rad);
            dt2.push([ x*35, y*35 ]);
        }
		
        pl = new shapePointList();
        pl.setData( dt2 );
        shapeList.add( pl );
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorSwirl extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            let rad = ( i * Math.PI / 500.01 ) - Math.PI/2;
            if ( i > 500 )  rad = Math.PI*2-rad;
			
            let x = Math.sin(rad);
            const y = Math.cos(rad);
            if ( y > 0 ) x -= 1;
            if ( y <= 0 ) x += 1;
            dt.push([ x*100, y*100 ]);
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 4; i++ ) {
            const angle = i * Math.PI * 1 / 4 ;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( dt[j][0], dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
		
		
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorSwirl2 extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            let rad = ( i * Math.PI / 500.01 ) - Math.PI/2;
            if ( i > 500 )  rad = Math.PI*2-rad;
			
            let x = Math.sin(rad);
            const y = Math.cos(rad);
            if ( y > 0 ) x -= 1;
            if ( y <= 0 ) x += 1;
            dt.push([ x*50, y*100 ]);
        }
        const l = dt.length;
        for ( var i = 0; i < l; i++ ) {
            const pt = [dt[i][0],dt[i][1]];
            dt[i][0]-= 100;
            pt[0] += 100;
            dt.push( pt );
			
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 4; i++ ) {
            const angle = i * Math.PI * 1 / 4 ;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( dt[j][0], dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
	
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorSwirlReversed extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            let rad = ( i * Math.PI / 500.01 ) - Math.PI/2;
            if ( i > 500 )  rad = Math.PI*2-rad;
			
            let x = Math.sin(rad);
            const y = Math.cos(rad);
            if ( y > 0 ) x -= 1;
            if ( y <= 0 ) x += 1;
            dt.push([ x*100, y*-100 ]);
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 4; i++ ) {
            const angle = i * Math.PI * 1 / 4 ;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( dt[j][0], dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
		
		
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorSwirl2Reversed extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            let rad = ( i * Math.PI / 500.01 ) - Math.PI/2;
            if ( i > 500 )  rad = Math.PI*2-rad;
			
            let x = Math.sin(rad);
            const y = Math.cos(rad);
            if ( y > 0 ) x -= 1;
            if ( y <= 0 ) x += 1;
            dt.push([ x*50, y*-100 ]);
        }
        const l = dt.length;
        for ( var i = 0; i < l; i++ ) {
            const pt = [dt[i][0],dt[i][1]];
            dt[i][0]-= 100;
            pt[0] += 100;
            dt.push( pt );
			
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 4; i++ ) {
            const angle = i * Math.PI * 1 / 4 ;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( dt[j][0], dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
	
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorSwirl3Reversed extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            const rad = ( i * Math.PI / 500.01 ) - Math.PI/2;
            const f = i / 5;
			
            const x = Math.sin(rad);
            const y = Math.cos(rad);
            dt.push([ x*f, y*f ]);
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 6; i++ ) {
            const angle = i * Math.PI * 2 / 6 ;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( dt[j][0], dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
		
		
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorSwirl3 extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            const rad = ( i * Math.PI / 500.01 ) - Math.PI/2;
            const f = i / 5;
			
            const x = Math.sin(rad);
            const y = Math.cos(rad);
            dt.push([ x*f, y*-f ]);
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 6; i++ ) {
            const angle = i * Math.PI * 2 / 6;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( dt[j][0], dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
		
		
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorSwirl4Reversed extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            const rad = ( i * Math.PI / 166.7 ) - Math.PI/2;
            const f = i / 5;
			
            const x = Math.sin(rad);
            const y = Math.cos(rad);
            dt.push([ x*f, y*f ]);
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 6; i++ ) {
            const angle = i * Math.PI * 2 / 6 ;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( dt[j][0], dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
		
		
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorSwirl3BiDirectional extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            //var p = easeInOutQuad( i / 1000.01 ) * 2;
            const rad = ( i * Math.PI / 500.01 ) ;// - Math.PI*2/3 + Math.PI/7;
            const f = easeInOutQuad( i / 1000 ) * 200;
			
            const x = Math.sin(rad);
            const y = Math.cos(rad);
            dt.push([ x*f, y*-f ]);
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 8; i++ ) {
            const angle = Math.floor(i/2) * Math.PI * 4 / 8 ;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( (i%2==1?-1:1)*dt[j][0], dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
		
		
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorSwirl4BiDirectional extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            //var p = easeInOutQuad( i / 1000.01 ) * 2;
            const rad = ( i * Math.PI / 500.01 ) ;// - Math.PI*2/3 + Math.PI/7;
            const f = easeInOutQuad( i / 1000 ) * 200;
			
            const x = Math.sin(rad);
            const y = Math.cos(rad);
            dt.push([ x*f, y*-f ]);
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 14; i++ ) {
            const angle = Math.floor(i/2) * Math.PI * 4 / 14 ;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( (i%2==1?-1:1)*dt[j][0], dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
		
		
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorSwirl4 extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            const rad = ( i * Math.PI / 166.7 ) - Math.PI/2;
            const f = i / 5;
			
            const x = Math.sin(rad);
            const y = Math.cos(rad);
            dt.push([ x*f, y*-f ]);
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 6; i++ ) {
            const angle = i * Math.PI * 2 / 6 ;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( dt[j][0], dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
		
		
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorLeaf6 extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            let rad = ( i * Math.PI / 500.01 ) - Math.PI/2;
            if ( i > 500 )  rad = Math.PI*2-rad;
			
            let x = Math.sin(rad);
            const y = Math.cos(rad);
            if ( y > 0 ) x -= 1;
            if ( y <= 0 ) x += 1;
            dt.push([ x*100, y*100 ]);
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 6; i++ ) {
            const angle = Math.floor(i/2) * Math.PI * 2 / 6 ;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( dt[j][0], (i%2==1?-1:1)*dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
		
		
    }
	
}
	
/**
 * @extends ShapeGenerator
 */
class generatorLeaf8 extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            let rad = ( i * Math.PI / 500.01 ) - Math.PI/2;
            if ( i > 500 )  rad = Math.PI*2-rad;
			
            let x = Math.sin(rad);
            const y = Math.cos(rad);
            if ( y > 0 ) x -= 1;
            if ( y <= 0 ) x += 1;
            dt.push([ x*100, y*100 ]);
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 8; i++ ) {
            const angle = Math.floor(i/2) * Math.PI * 2 / 8 ;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( dt[j][0], (i%2==1?-1:1)*dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
		
		
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorLeaf26 extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            let rad = ( i * Math.PI / 500.01 ) - Math.PI/2;
            if ( i > 500 )  rad = Math.PI*2-rad;
			
            let x = Math.sin(rad);
            const y = Math.cos(rad);
            if ( y > 0 ) x -= 1;
            if ( y <= 0 ) x += 1;
            dt.push([ x*50, y*50 ]);
        }
        const l = dt.length;
        for ( var i = 0; i < l; i++ ) {
            const pt = [dt[i][0],dt[i][1]];
            dt[i][0]-= 100;
            pt[0] += 100;
            dt.push( pt );
			
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 6; i++ ) {
            const angle = Math.floor(i/2) * Math.PI * 2 / 6 ;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( dt[j][0], (i%2==1?-1:1)*dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
		
	
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorLeaf36 extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            let rad = ( i * Math.PI / 500.01 ) - Math.PI/2;
            if ( i > 500 )  rad = Math.PI*2-rad;
			
            let x = Math.sin(rad);
            const y = Math.cos(rad);
            if ( y > 0 ) x -= 1;
            if ( y <= 0 ) x += 1;
            dt.push([ x*50, y*100 ]);
        }
        const l = dt.length;
        for ( var i = 0; i < l; i++ ) {
            const pt = [dt[i][0],dt[i][1]];
            dt[i][0]-= 100;
            pt[0] += 100;
            dt.push( pt );
			
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 6; i++ ) {
            const angle = Math.floor(i/2) * Math.PI * 2 / 6 ;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( dt[j][0], (i%2==1?-1:1)*dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
		
	
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorLeaf28 extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( var i = 0; i <= 1000; i++ ) {
            let rad = ( i * Math.PI / 500.01 ) - Math.PI/2;
            if ( i > 500 )  rad = Math.PI*2-rad;
			
            let x = Math.sin(rad);
            const y = Math.cos(rad);
            if ( y > 0 ) x -= 1;
            if ( y <= 0 ) x += 1;
            dt.push([ x*50, y*50 ]);
        }
        const l = dt.length;
        for ( var i = 0; i < l; i++ ) {
            const pt = [dt[i][0],dt[i][1]];
            dt[i][0]-= 100;
            pt[0] += 100;
            dt.push( pt );
			
        }
		
        var pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        for ( var i = 1; i < 8; i++ ) {
            const angle = Math.floor(i/2) * Math.PI * 2 / 8 ;
            const dt2 = [];
            for ( let j = 0; j < dt.length; j++ ) {
                dt2.push( ShapeGenerator.rotate( dt[j][0], (i%2==1?-1:1)*dt[j][1], angle ) );
            }
		
            var pl = new shapePointList();
            pl.setData( dt2 );
            shapeList.add( pl );
        }
		
	
    }
	
}

/**
 * @extends ShapeGenerator
 */
class generatorPeace extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( let i = 0; i <= 800; i++ ) {
            const rad = Math.PI + ( i * Math.PI / 400.00 );
            const x = Math.sin(rad);
            const y = Math.cos(rad);
            dt.push([ x*200, y*200 ]);
        }
		
        let pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        const dt1 = [[0,-200],[0,0]];
        const dt2 = [[0,200],[0,0]];
        const dt3 = [[-141,141],[0,0]];
        const dt4 = [[141,141],[0,0]];
		
        pl = new shapePointList(); pl.setData( dt1 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt2 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt3 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt4 ); shapeList.add( pl );
		
		
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorPentagram extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt = [];
        for ( let i = 0; i <= 800; i++ ) {
            const rad = Math.PI + ( i * Math.PI / 400.00 );
            const x = Math.sin(rad);
            const y = Math.cos(rad);
            dt.push([ x*200, y*200 ]);
        }
		
        let pl = new shapePointList();
        pl.setData( dt );
        shapeList.add( pl );
		
        const pt1 = [ Math.sin( 0*Math.PI/180 ) * 200, Math.cos( 0*Math.PI/180 ) * 200 ];
        const pt2 = [ Math.sin( 72*Math.PI/180 ) * 200, Math.cos( 72*Math.PI/180 ) * 200 ];
        const pt3 = [ Math.sin( 144*Math.PI/180 ) * 200, Math.cos( 144*Math.PI/180 ) * 200 ];
        const pt4 = [ Math.sin( 216*Math.PI/180 ) * 200, Math.cos( 216*Math.PI/180 ) * 200 ];
        const pt5 = [ Math.sin( 288*Math.PI/180 ) * 200, Math.cos( 288*Math.PI/180 ) * 200 ];
        // 0/360
        // 72
        // 144
        // 72
        // 216
        // 288
		
        const dt1 = [pt1,pt3];
        const dt2 = [pt3,pt5];
        const dt3 = [pt5,pt2];
        const dt4 = [pt2,pt4];
        const dt5 = [pt4,pt1];
		
        pl = new shapePointList(); pl.setData( dt1 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt2 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt3 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt4 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt5 ); shapeList.add( pl );
		
		
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorDiamond extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt1 = [[0,-200],[100,0]];
        const dt2 = [[100,0],[0,200]];
        const dt3 = [[0,200],[-100,0]];
        const dt4 = [[-100,0],[0,-200]];
		
        let pl;
        pl = new shapePointList(); pl.setData( dt1 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt2 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt3 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt4 ); shapeList.add( pl );
		
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorSquare extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt1 = [[0,-200],[200,-200],[200,0]];
        const dt2 = [[200,0],[200,200],[0,200]];
        const dt3 = [[0,200],[-200,200],[-200,0]];
        const dt4 = [[-200,0],[-200,-200],[0,-200]];
		
        let pl;
        pl = new shapePointList(); pl.setData( dt1 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt2 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt3 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt4 ); shapeList.add( pl );
		
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorCross extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt1 = [[-200,-200],[200,200]];
        const dt2 = [[-200,200],[200,-200]];
		
        let pl;
        pl = new shapePointList(); pl.setData( dt1 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt2 ); shapeList.add( pl );
		
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorCross2 extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt1 = [[-180,-200],[0,-20],[180,-200]];
        const dt2 = [[-180, 200],[0, 20],[180,200]];
		
        const dt3 = [[ 200,-180],[ 20, 0],[ 200, 180]];
        const dt4 = [[-200,-180],[-20, 0],[-200, 180]];
		
        let pl;
        pl = new shapePointList([],true); pl.setData( dt1 ); shapeList.add( pl );
        pl = new shapePointList([],true); pl.setData( dt2 ); shapeList.add( pl );
        pl = new shapePointList([],true); pl.setData( dt3 ); shapeList.add( pl );
        pl = new shapePointList([],true); pl.setData( dt4 ); shapeList.add( pl );
		
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorPlus extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt1 = [[0,-200],[0,200]];
        const dt2 = [[-200,0],[200,0]];
		
        let pl;
        pl = new shapePointList(); pl.setData( dt1 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt2 ); shapeList.add( pl );
		
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorHLine extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt2 = [[-200,0],[200,0]];
		
        let pl;
        pl = new shapePointList(); pl.setData( dt2 ); shapeList.add( pl );
		
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorVLine extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt1 = [[0,-200],[0,200]];
		
        let pl;
        pl = new shapePointList(); pl.setData( dt1 ); shapeList.add( pl );
		
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorH2Line extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt1 = [[-200,-100],[200,-100]];
        const dt2 = [[-200,100],[200,100]];
		
        let pl;
        pl = new shapePointList(); pl.setData( dt1 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt2 ); shapeList.add( pl );
		
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorV3Line extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt1 = [[-200,-200],[-200,200]];
        const dt2 = [[0,-200],[0,200]];
        const dt3 = [[200,-200],[200,200]];
		
        let pl;
        pl = new shapePointList(); pl.setData( dt1 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt2 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt3 ); shapeList.add( pl );
		
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorH3Line extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt1 = [[-200,-200],[200,-200]];
        const dt2 = [[-200,0],[200,0]];
        const dt3 = [[-200,200],[200,200]];
		
        let pl;
        pl = new shapePointList(); pl.setData( dt1 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt2 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt3 ); shapeList.add( pl );
		
    }
}

/**
 * @extends ShapeGenerator
 */
class generatorV2Line extends ShapeGenerator {
    generate( shapeList ) {
        shapeList.empty();
		
        const dt1 = [[-100,-200],[-100,200]];
        const dt2 = [[100,-200],[100,200]];
		
        let pl;
        pl = new shapePointList(); pl.setData( dt1 ); shapeList.add( pl );
        pl = new shapePointList(); pl.setData( dt2 ); shapeList.add( pl );
		
    }
}

/**
 * Wrapper for Default Shapes created using ShapeList.createShape()
 * @extends ShapeGenerator
 */
class ShapeCreator extends ShapeGenerator {
    generate(shapeList) {
        const pointList = new shapePointList([],false);
        pointList.setDataFromShape(this);
        shapeList.add( pointList ); 
        return pointList; 
    }
}
	

/**
 * @extends ShapeCreator
 */
export class shapeCircle extends ShapeCreator {
    constructor() {
        super();
        this.centerDeg = 0;
        this.radius = 200;
        this.height = 100;
    }

    getPositionFor( perc, val ) {
        if ( val > 1 ) val = 1;
        if ( val < 0 ) val = 0;
        const deg = ( this.centerDeg - 180 ) + 360 * perc;
        var max = Math.min( this.height, this.radius );
		
        const s = Math.sin( deg / 180 * Math.PI );
        const c = Math.cos( deg / 180 * Math.PI );
		
        const min = [ s * this.radius - s * val * max ,  c * this.radius - c * val * max ];
        var max = [ s * this.radius + s * val * max ,  c * this.radius + c * val * max ];
		
        return [ min, max ];
    }
}

/**
 * @extends ShapeCreator
 */
export class shapeHeart extends ShapeCreator {
    constructor() {
        super();
        this.centerDeg = 0;
        this.radius = 200;
        this.height = 100;
    }

    getPositionFor( perc, val ) {
        /*perc = perc * 2;
		perc += 0.5;
		var perc2 = easeInOutQuad( perc % 1 ) + Math.floor(perc);
		perc2 -= 0.5;
		perc2 /= 2;
		perc = perc2;
		/*
		if( perc < 0.25 ) {
			perc = ( easeInOutQuart(perc/0.5+0.5) /* output range = 0.5 - 1 * / - 0.5 )  / 0.5;
		}
		else if( perc > 0.75 ) {
			perc = easeInOutQuart((perc-0.75)/0.5) /* output range = 0 - 0.5  * / * 0.5 + 0.75;
		}
		else {
			perc = easeInOutQuart((perc-0.25)/0.5) /* output range = 0 - 1  * /  * 0.5 + 0.25;
		}*/
        if ( val > 1 ) val = 1;
        if ( val < 0 ) val = 0;
        const deg = ( this.centerDeg - 180 ) + 360 * perc;
        const rad = deg * Math.PI / 180;
        var max = Math.min( this.height, this.radius );
		
        const s = Math.sin( rad );
        const c = Math.cos( rad );
        const c2 = Math.cos( 2*rad );
        const c3 = Math.cos( 3*rad );
        const c4 = Math.cos( 4*rad );
		
        const f1 = this.radius - max;
        const f2 = this.radius + max;
		
        let x = 3.9 * Math.pow(s,3);
        let y = 3 * c - 1.2 * c2 - 0.6 * c3 - 0.2 * c4;
        x /= 3.9;
        y /= 3.9;
        const min = [ x * this.radius - ( val * max * x  ) , -y * this.radius - ( val * max * -y ) ];
        var max = [ x * this.radius + ( val * max * x  ) , -y * this.radius + ( val * max * -y  ) ];
		
        return [ min, max ];
    }
}

/**
 * @extends ShapeCreator
 */
export class shapeLeaf extends ShapeCreator {
    constructor() {
        super();
        this.centerDeg = 90;
        this.radius = 200;
        this.height = 100;
    }

    getPositionFor( perc, val ) {
        if ( val > 1 ) val = 1;
        if ( val < 0 ) val = 0;
        const deg = ( this.centerDeg - 180 ) + 360 * perc;
        const rad = deg * Math.PI / 180;
        var max = Math.min( this.height, this.radius );
		
        const r =(1+0.9*Math.cos(8*rad))*(1+0.1*Math.cos(24*rad))/**(0.9+0.1*Math.cos(200*rad));*/*(1+Math.sin(rad));
		
        ////var f1 = this.radius - max;
        const f2 = this.radius + max;
		
        const x =  (r*this.radius*0.3) * Math.sin( rad + Math.PI/2 );
        const y =  (r*this.radius*0.3) * Math.cos( rad + Math.PI/2 );
        var x1 = (r*this.radius*0.3-r*max*0.3) * Math.sin( rad + Math.PI/2 );
        var y1 = (r*this.radius*0.3-r*max*0.3) * Math.cos( rad + Math.PI/2 );
        var x2 = (r*this.radius*0.3+r*max*0.3) * Math.sin( rad + Math.PI/2 );
        var y2 = (r*this.radius*0.3+r*max*0.3) * Math.cos( rad + Math.PI/2 );
		
        var x1 = x + ( x1 - x ) * val;
        var x2 = x + ( x2 - x ) * val;
        var y1 = y + ( y1 - y ) * val;
        var y2 = y + ( y2 - y ) * val;
		
		
        const min = [ x1, y1 + this.radius * 0.5 ];
        var max = [ x2, y2 + this.radius * 0.5 ];
		
        return [ min, max ];
    }
}
	
/**
 * @extends ShapeCreator
 */
export class shapeButterfly extends ShapeCreator {
    constructor() {
        super();
        this.centerDeg = 270;
        this.radius = 150;
        this.height = 100;
    }

    getPositionFor( perc, val ) {
        if ( val > 1 ) val = 1;
        if ( val < 0 ) val = 0;
        const deg = ( this.centerDeg - 180 ) + 360 * perc;
        const rad = deg * Math.PI / 180;
        var max = Math.min( this.height, this.radius );
		
        let r =  9 - 0.5*Math.sin(rad) + 2.5*Math.sin(3*rad) + 2*Math.sin(5*rad) - 1.7*Math.sin(7*rad) + 3*Math.cos(2*rad) - 2*Math.cos(4*rad) - 0.4*Math.cos(16*rad);
        r /= 10;
        //var r =(1+0.9*Math.cos(8*rad))*(1+0.1*Math.cos(24*rad))/**(0.9+0.1*Math.cos(200*rad));*/*(1+Math.sin(rad));
		
        ////var f1 = this.radius - max;
        const f2 = this.radius + max;
		
        const x =  (r*this.radius) * Math.sin( rad + Math.PI/2 );
        const y =  (r*this.radius) * Math.cos( rad + Math.PI/2 );
        var x1 = (r*this.radius-r*max) * Math.sin( rad + Math.PI/2 );
        var y1 = (r*this.radius-r*max) * Math.cos( rad + Math.PI/2 );
        var x2 = (r*this.radius+r*max) * Math.sin( rad + Math.PI/2 );
        var y2 = (r*this.radius+r*max) * Math.cos( rad + Math.PI/2 );
		
        var x1 = x + ( x1 - x ) * val;
        var x2 = x + ( x2 - x ) * val;
        var y1 = y + ( y1 - y ) * val;
        var y2 = y + ( y2 - y ) * val;
		
		
        const min = [ x1, y1  ];
        var max = [ x2, y2 ];
		
        return [ min, max ];
    }
}

export const SHAPE_GENERATORS = {
    circle: () => {
        return new shapeCircle(); 
    },
    heart: () => {
        return new shapeHeart(); 
    },
    cannabis: () => {
        return new shapeLeaf(); 
    },
    butterfly: () => {
        return new shapeButterfly(); 
    },
    // pointlist: () => { return new shapePointList(); },
    hazard: () => {
        return new generatorBiohazard(); 
    },
    pokeball: () => {
        return new generatorPokeball(); 
    },
    swirl: () => {
        return new generatorSwirl(); 
    },
    swirl2: () => {
        return new generatorSwirlReversed(); 
    },
    swirl3: () => {
        return new generatorSwirl2(); 
    },
    swirl4: () => {
        return new generatorSwirl2Reversed(); 
    },
    swirl5: () => {
        return new generatorSwirl3(); 
    },
    swirl6: () => {
        return new generatorSwirl3Reversed(); 
    },
    swirl7: () => {
        return new generatorSwirl4(); 
    },
    swirl8: () => {
        return new generatorSwirl4Reversed(); 
    },
    circlePattern1: () => {
        return new generatorLeaf6(); 
    },
    circlePattern2: () => {
        return new generatorLeaf8(); 
    },
    circlePattern3: () => {
        return new generatorLeaf26(); 
    },
    circlePattern4: () => {
        return new generatorLeaf36(); 
    },
    circlePattern5: () => {
        return new generatorLeaf28(); 
    },
    circlePattern6: () => {
        return new generatorSwirl3BiDirectional(); 
    },
    circlePattern7: () => {
        return new generatorSwirl4BiDirectional(); 
    },
    cross: () => {
        return new generatorCross(); 
    },
    cross2: () => {
        return new generatorCross2(); 
    },
    plus: () => {
        return new generatorPlus(); 
    },
    hline: () => {
        return new generatorHLine(); 
    },
    vline: () => {
        return new generatorVLine(); 
    },
    hline2: () => {
        return new generatorH2Line(); 
    },
    vline2: () => {
        return new generatorV2Line(); 
    },
    hline3: () => {
        return new generatorH3Line(); 
    },
    vline3: () => {
        return new generatorV3Line(); 
    },
    diamond: () => {
        return new generatorDiamond(); 
    },
    square: () => {
        return new generatorSquare(); 
    },
    peace: () => {
        return new generatorPeace(); 
    },
    pentagram: () => {
        return new generatorPentagram(); 
    },
    yinyang: () => {
        return new generatorYinYang(); 
    },
    atom: () => {
        return new generatorAtom(); 
    },
};

/**
 * 
 */
class ShapeGeneratorFactory {

    constructor() {
        this.generatorsNames = Object.getOwnPropertyNames(SHAPE_GENERATORS);
        this.generators = [];
        this.defaultGenerator = null;
        this.generatorsNames.forEach( 
            (value, index, array) => {
                this.generators[value] = SHAPE_GENERATORS[value]();
                // console.log("Factory.constructor generators[" + value + "]= " + this.generators[value].constructor.name );
            }
        );
    }

    /**
     * @returns {ShapeGenerator} e.g. an instance of generatorSwirl
     */
    get(generatorName) {
        // console.log("ShapeGeneratorFactory.get: " + generatorName);
        return SHAPE_GENERATORS[generatorName]();
    }

    getGeneratorsNames() {
        return this.generatorsNames;
    }
	
    get defaultGeneratorName() {
        return this.defaultGenerator ? this.defaultGenerator.constructor.name : null;
    }

    set defaultGeneratorName(generatorName) {
        this.defaultGenerator = SHAPE_GENERATORS[generatorName]();
        this.defaultGenerator.generate(shapeList);
        if ( hasInit ) shapeList.updateAutosave();
    }
}

/**
 * The Singleton ShapeGeneratorFactory
 */
const shapeGeneratorFactory = new ShapeGeneratorFactory();
export default shapeGeneratorFactory;
