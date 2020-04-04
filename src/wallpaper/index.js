'use strict';

/** log.js : overwrites console.log and console.error to display messages within the wallpaper. **/
require('./log.js');

/** timer.js : simple timer class to measure performance **/
require('./timer.js');

/** audioarray.js : has a class that holds data for one channel ( left or right ) of the fft data with some useful functions to access it **/
require('./audioarray.js');

/** audiodata.js : has a class that holds 2 audiodata instances ( left/right channels ) with some useful functions to access it **/
require('./audiodata.js');

/** audiocollection.js : is currently unused, i have used this to bunch up and average multiple fft data frames that might occur within one render frame when rendering at a low FPS **/
require('./audiocollection.js');

/** audiodata-polyfill.js : fakes wallpaperRegisterAudioListener function for testing in the browser ( also see the guide as thre is another better alternative to this if needed ) **/
require('./audiodata-polyfill.js');

/** utils.js : contains some functions for processing the properties as well as a function to render the data in an audioframe object **/
require('./utils/utils.js');
require('./utils/locale.js');

/** audioframe.js : somewhat misnamed class written to contain all the audio processing demonstrated with configurable options **/
require('./audioframe.js');

require('./generators.js');

require('./utils/delayed.js');

require('./flatten.js');

require('./wallwindow/WallWindow.js');
require('./wallwindow/wallmenu.js');
require('./wallwindow/hovermenu.js');

require('./infrastructure/propertypropagator.js');
require('./infrastructure/AccessController.js');


require('./performancemonitor.js');

require('./production/supplymonitor.js');


require('./svgsource.js');

require('./shapelist.js');
require('./shaperenderaudioframe.js');
require('./shapestorage.js');

require('./connectors/connectedpopup.js');
require('./connectors/connectpopup.js');
require('./connectors/disconnectedpopup.js');
require('./connectors/facebookconnector.js');

require('./content.js');
require('./production/imagepreloadinfo.js');
require('./production/contentproducer.js');
require('./production/contentsupplier.js');

require('./production/loaderproducer.js');
require('./production/pexelsproducer.js');
require('./production/pixabayproducer.js');
require('./production/wallpaperabyssproducer.js');
require('./production/facebookproducer.js');

require('./production/wpeondemandproducer.js');
require('./production/localimageproducer.js');
require('./production/localvideoproducer.js');


require('./presentation/toggleelements.js');
require('./presentation/displaymenu.js');
require('./presentation/contentshow.js');
require('./presentation/singleshow.js');
require('./presentation/multidisplay.js');
require('./presentation/multishow.js');
require('./presentation/backgroundgradient.js');
require('./presentation/backgroundtransition.js');

require('./drawprocessor.js');
require('./drawcontroller.js');

require('./svgimportmenu.js');
require('./shapeeditmenu.js');
require('./mainmenu.js');

require('./displays/analogclock.js');

require('./displays/digidisplay.js');
require('./displays/digidate.js');
require('./displays/digitime.js');

require('./displays/foreground.js');


// hide log & timer
if (log) {
    if (log.hide) {
        log.hide();
    }
}
timer.hide();

// define global variables
let canvas = null;
let context = null;
let canvasBg = null;
let contextBg = null;

// render function to use
const renderFunction = 'default';

const heightDir = 3;

const foreground = new Foreground();

/*
    ! audioFrame found in utils.js

    in audioFrame is where I store the audio data and do all processing of the incoming audio listener event
    Most code regarding the wallpaper settings are found in there.
*/
let frame2; // is an AudioFrame object .. stores the "processes" data and is created in setup()
const frameHistory = [];

let initialized = false;

const shapeList = new ShapeList();

let hadAudioFrame = false;

let contentShow = null;
const singleShow = null; // new SingleShow( document.getElementById('background-wrapper' ) );
const multiShow = new MultiShow(document.getElementById('background-wrapper'));

let fnInitSlideshow;

const storage = new ShapeStorage();

const supplyMonitor = new SupplyMonitor();
const performanceMonitor = new PerformanceMonitor();

const htmlTime = new DigiTime();

const htmlDate = new DigiDate();

const analogClock = new AnalogClock();

const accessController = new AccessController();

const mainMenu = new MainMenu();

const shapeEditMenu = new ShapeEditMenu();

const svgImportMenu = new SvgImportMenu();



/**
 * setup wallpaper stuff
 **/
function setup() {
    contentShow = multiShow;

    canvas = document.getElementById('canvas'); // reference to our canvas element
    context = canvas.getContext('2d');  // reference to our context

    canvasBg = document.getElementById('canvasBg'); // reference to our canvas element
    contextBg = canvasBg.getContext('2d');  // reference to our context

    // create container to store processed data
    frame2 = new AudioFrame({
        normalize: true,
        normalizeFactor: 0,
        motionBlur: true,
        motionBlurFactor: 1,
        smooth: true,
        smoothFactor: 0.75,
        powerOf: 4,
        mono: true
    });
}

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
            canvasBg.style.display = 'none';
        } else {
            canvasBg.style.display = 'block';
        }
        if (this._colorGlow >= 1) this._colorGlow += 1;
        canvasBg.style.filter = 'blur(' + this._colorGlow + (this._colorGlow ? 'px' : '') + ')';
    }
}

const renderer = new Renderer();

let h = 0;
let prevTimestamp;
let timeDiff;
let frameCount = 0;
/**
 * render wallpaper
 **/
function render(timestamp) // requestAnimationFrame supplies its own timestamp. no need for performance.now();
{
    frameCount++;
    const t0 = performance.now();
    timestamp = timestamp || performance.now();
    if (timestamp > 2000) initialized = true;

    // frame skipping to maintain user selected framerate
    if (renderer.paused || !hadAudioFrame || performanceMonitor.shouldSkipFrame(timestamp)) {
        setTimeout(render, renderer.paused ? 1000 : 8.33);
        return;
    }

    hadAudioFrame = false;

    timeDiff = timestamp - prevTimestamp;
    prevTimestamp = timestamp;

    performanceMonitor.updateFps(timestamp);

    // now on to actual render some stuff
    //
    try {
        timer.start('render');

        context.globalCompositeOperation = 'destination-out';
        context.fillStyle = 'rgba(0,0,0,0.6)';
        context.fillRect(0, 0, renderer.width, renderer.height);
        context.globalCompositeOperation = 'source-over';

        if (renderer.colorGlow > 0) {
            contextBg.globalCompositeOperation = 'destination-out';
            contextBg.fillStyle = 'rgba(0,0,0,1)';
            contextBg.fillRect(0, 0, renderer.width, renderer.height);
            contextBg.globalCompositeOperation = 'source-over';
        }

        context.save();
        context.translate(renderer.offsetX, renderer.offsetY);
        context.translate(renderer.width / 2, renderer.height / 2);
        context.rotate(renderer.rotation * Math.PI / 180);
        context.translate(-renderer.width / 2, -renderer.height / 2);

        const v = renderer.colorRotation
            ? (360 * 1 / 6) + (++h / 1 % 360)
            : 0;
        const col1 = 'hsla(  ' + (renderer.hslcolor1[0] * 360 + v) + ', ' + Math.round(renderer.hslcolor1[1] * 100) + '%, ' + Math.round(renderer.hslcolor1[2] * 100) + '%, ' + 1 + ' )';
        const col2 = 'hsla(  ' + (renderer.hslcolor2[0] * 360 + v) + ', ' + Math.round(renderer.hslcolor2[1] * 100) + '%, ' + Math.round(renderer.hslcolor2[2] * 100) + '%, ' + 1 + ' )';
        const col3 = 'hsla(  ' + (renderer.hslcolor3[0] * 360 + v) + ', ' + Math.round(renderer.hslcolor3[1] * 100) + '%, ' + Math.round(renderer.hslcolor3[2] * 100) + '%, ' + 1 + ' )';

        htmlDate.setHue(renderer.hslcolor1[0] * 360 + v);
        htmlTime.setHue(renderer.hslcolor1[0] * 360 + v);

        let gradient;
        switch (renderer.colorGradient) {
            case 0:
                gradient = col1;
                break;
            case 1:
                gradient = context.createRadialGradient(renderer.width / 2, renderer.height / 2, 0, renderer.width / 2, renderer.height / 2, (renderer.width + renderer.height) / 4);
                gradient.addColorStop(0, col1);
                gradient.addColorStop(0.5, col2);
                gradient.addColorStop(1, col3);
                break;
            case 2:
                gradient = context.createLinearGradient(0, renderer.height / 2, renderer.width, renderer.height / 2);
                gradient.addColorStop(0, col1);
                gradient.addColorStop(0.5, col2);
                gradient.addColorStop(1, col3);
                break;
            case 3:
                gradient = context.createLinearGradient(renderer.width / 2, 0, renderer.width / 2, renderer.height);
                gradient.addColorStop(0, col1);
                gradient.addColorStop(0.5, col2);
                gradient.addColorStop(1, col3);
                break;
        }

        analogClock.render(context, gradient);

        shapeList.render(context, gradient, renderer.interpolationSteps, renderer.interpolationBalanced, renderer.renderMethod);

        context.restore();

        const mousePath = drawController.points;
        if (mousePath.length > 1) {

            context.beginPath();
            context.strokeStyle = gradient;
            context.lineWidth = 1;
            //context.strokeStyle = 'rgba( 255, 255, 255, 0.5 )';
            context.moveTo(mousePath[0].x, mousePath[0].y);
            for (let i = 1; i < mousePath.length; i++) {
                const x = mousePath[i].x;
                const y = mousePath[i].y;
                context.lineTo(x, y);
            }
            context.stroke();
        }


        if (renderer.colorGlow > 0) {

            contextBg.globalCompositeOperation = 'source-over';
            if (renderer.colorGlowStrength == 3) contextBg.drawImage(canvas, -1, -1);
            if (renderer.colorGlowStrength == 3) contextBg.drawImage(canvas, 0, -1);
            if (renderer.colorGlowStrength == 3) contextBg.drawImage(canvas, 1, -1);
            if (renderer.colorGlowStrength == 2) contextBg.drawImage(canvas, -1, 0);
            if (renderer.colorGlowStrength == 1) contextBg.drawImage(canvas, 0, 0);
            if (renderer.colorGlowStrength == 2) contextBg.drawImage(canvas, 1, 0);
            if (renderer.colorGlowStrength == 3) contextBg.drawImage(canvas, -1, 1);
            if (renderer.colorGlowStrength == 3) contextBg.drawImage(canvas, 0, 1);
            if (renderer.colorGlowStrength == 3) contextBg.drawImage(canvas, 1, 1);
        }

        if (renderer._loaded && (frame2.config.lastEqChange + 5000 > timestamp)) {
            // console.log( "lastEqChange= " + frame2.config.lastEqChange + " timestamp= " + timestamp );
            frame2.renderEQ(context);
        }
        timer.stop('render');
    } catch (ex) {
        let caller_line = ex.stack.split('\n');
        caller_line = caller_line[1];
        const index = caller_line.indexOf('at ');
        const clean = caller_line.slice(index + 2, caller_line.length);


        console.error(clean.replace(/^\s+/g, '').replace(/(http|file).+\//g, '') + ' ' + ex.message);
    }
    const t1 = performance.now();
    performanceMonitor.fpsRenderTime += t1 - t0;
    setTimeout(render, renderer.paused ? 1000 : 8.33);
}




var drawController = new DrawController(pointsSource => {
    onNewPoints(pointsSource); 
});

function onNewPoints(pointsSource) {
    const points = [];
    for (let i = 0; i < pointsSource.length; i++) {
        points.push([(-renderer.offsetX + pointsSource[i].x - proPro.width / 2) / shapeList._radiusFactor,
            (-renderer.offsetY + pointsSource[i].y - proPro.height / 2) / shapeList._radiusFactor]);
    }
    if (points.length > 1) {
        const s = new shapePointList([], drawController.smooth);
        s.setRemoveDetailAmount(drawController.smooth ? 100 : 0);
        s.setData(points);
        shapeList.add(s);
        shapeList.updateAutosave();
    }
}

let svgSource;

function setupAccessController() {
    accessController.registerConsumer('WallMenu', mainMenu);
    accessController.registerConsumer('MouseDraw', drawController);
    accessController.registerConsumer('ShapeEditMenu', shapeEditMenu);
    accessController.registerConsumer('SvgImportMenu', svgImportMenu);
}

let hasInit = false;
function onInit() {
    storage.loadShapeList(SHAPE_STORAGE_SLOT_AUTO_SAVE, shapeList);
    if (svgSource) {
        svgSource.toShapeList(shapeList);
    }
    hasInit = true;
}

var proPro = new PropertyPropagator('TiTahi');

function setupPropertyPropagator() {
    //     addReceiver( propertyPrefix, 			receiver, 				generalPrefix, 	windowPrefix, 	pausedPrefix,	loaded,	user,	general,	filesAndDirectories, 	paused,	windowProperties )
    proPro.addReceiver('analogClock_', analogClock, null, null, null, null, true, false, false, false, true);
    proPro.addReceiver('audioFrame_', frame2.config, null, null, null, null, true, false, false, false, false);
    proPro.addReceiver('audioShapeRender_', audioShapeRender, null, null, null, null, true, false, false, false, false);
    proPro.addReceiver('backgroundGradient_', contentShow.gradient, null, null, null, null, true, false, false, false, false);

    // most properties are handled by contentShow, only specialised userProperties required like columns/rows, ..
    proPro.addReceiver('background_', contentShow, null, null, null, 'init', true, false, false, true, false);
    proPro.addReceiver('multiShow_', multiShow, null, null, null, null, true, false, false, false, true);

    proPro.addReceiver('Locale_', locale, null, null, null, null, true, false, false, false, false);

    proPro.addReceiver('LocalImageProducer_', localImageProducer, null, null, null, 'init', true, false, false, false, false);
    proPro.addReceiver('LocalVideoProducer_', localVideoProducer, null, null, null, 'init', true, false, false, false, false);
    proPro.addReceiver('FacebookProducer_', facebookProducer, null, null, null, 'init', true, false, false, false, false);
    proPro.addReceiver('WallpaperAbyssProducer_', wallpaperAbyssProducer, null, null, null, 'init', true, false, false, false, false);
    proPro.addReceiver('PexelsProducer_', pexelsProducer, null, null, null, 'init', true, false, false, false, false);
    proPro.addReceiver('PixabayProducer_', pixabayProducer, null, null, null, 'init', true, false, false, false, false);

    proPro.addReceiver('ContentSupplier_', conSup, null, null, null, 'init', false, false, false, false, false);

    proPro.addReceiver('digiDate_', htmlDate, null, null, null, null, true, false, false, false, false);
    proPro.addReceiver('digiTime_', htmlTime, null, null, null, null, true, false, false, false, false);
    proPro.addReceiver('drawController_', drawController, null, null, null, null, true, false, false, false, false);
    proPro.addReceiver('foreground_', foreground, null, 'system', null, null, true, false, false, false, true);
    proPro.addReceiver('mainMenu_', mainMenu, null, null, null, 'init', true, false, false, false, false);
    proPro.addReceiver('performanceMonitor_', performanceMonitor, 'system', null, null, null, true, true, false, false, false);
    proPro.addReceiver('renderer_', renderer, null, null, null, 'init', true, false, false, true, true);
    proPro.addReceiver('shapeGeneratorFactory_', shapeGeneratorFactory, null, null, null, null, true, false, false, false, false);
    proPro.addReceiver('shapeList_', shapeList, null, null, null, null, true, false, false, false, false);
    proPro.addReceiver(null, canvas, null, null, null, null, false, false, false, false, true);
    proPro.addReceiver(null, canvasBg, null, null, null, null, false, false, false, false, true);
    proPro.addReceiver('FacebookConnector_', fbCon, null, null, null, 'init', false, false, false, false, false);

    proPro.addAppliedStartupListener(() => {
        onInit(); 
    });

    proPro.initialize();
}


/**
 * when document has been loaded, do all this stuff...
 *   	- setup
 * 		- register window resize event
 * 		- register audio listener
 * 		- set property listeners
 * 		- queue first frame fro rendering
 **/
const startWp = function() {
    setup(); // setup anything not already setup

    try {
        setupAccessController();
    } catch (ex) {
        console.error('startWp(): setupAccessController():' + ex.message); 
    }

    try {
        setupPropertyPropagator();
    } catch (ex) {
        console.error('startWp(): setupPropertyPropagator():' + ex.message); 
    }


    // register our own audio event
    if (window.wallpaperRegisterAudioListener) {
        window.wallpaperRegisterAudioListener(data => {
            frame2.onAudioData(data); 
        });
    } else {
        console.error('can\'t register audio listener');
    }

    // start render loop by requesting first frame
    window.requestAnimationFrame(render);
};

startWp();
