


/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use strict';

/** log.js : overwrites console.log and console.error to display messages within the wallpaper. **/
import log from './log';

/** timer.js : simple timer class to measure performance **/
import timer from './timer';

/** audioarray.js : has a class that holds data for one channel ( left or right ) of the fft data with some useful functions to access it **/
import './audioarray';

/** audiodata.js : has a class that holds 2 audiodata instances ( left/right channels ) with some useful functions to access it **/
import './audiodata';

/** audiocollection.js : is currently unused, i have used this to bunch up and average multiple
 *  fft data frames that might occur within one render frame when rendering at a low FPS **/
import './audiocollection';

/** audiodata-polyfill.js : fakes wallpaperRegisterAudioListener function for testing in the browser
 * ( also see the guide as thre is another better alternative to this if needed ) **/
import './audiodata-polyfill';

/** utils.js : contains some functions for processing the properties as well as a function to render the data in an audioframe object **/
import locale from './utils/locale';

/** audioframe.js : somewhat misnamed class written to contain all the audio processing demonstrated with configurable options 
    ! audioFrame found in utils.js

    in audioFrame is where I store the audio data and do all processing of the incoming audio listener event
    Most code regarding the wallpaper settings are found in there.
// is an AudioFrame object .. stores the "processes" data and is created in setup()
 * **/
import {frame2 } from './audioframe';

import shapeGeneratorFactory from './generators';

import './utils/delayed';

import './flatten';

import './wallwindow/WallWindow';
import './wallwindow/wallmenu';
import './wallwindow/hovermenu';

import proPro from './infrastructure/propertypropagator';
import accessController from './infrastructure/AccessController';


import { performanceMonitor } from './performancemonitor';

import { supplyMonitor } from './production/supplymonitor';


import { svgSource } from  './svgsource';

import { shapeList } from './shapelist';
import shapePointList from './shapePointList';
import audioShapeRender from './shaperenderaudioframe';
import ShapeStorage from './shapestorage';

import './connectors/connectedpopup';
import './connectors/connectpopup';
import './connectors/disconnectedpopup';
import fbCon from './connectors/facebookconnector';

import './content';
import './production/imagepreloadinfo';
import './production/contentproducer';
import conSup from './production/contentsupplier';

import './production/loaderproducer';
import pexelsProducer from './production/pexelsproducer';
import pixabayProducer from './production/pixabayproducer';
import wallpaperAbyssProducer from './production/wallpaperabyssproducer';
import facebookProducer from './production/facebookproducer';

import './production/wpeondemandproducer';
import localImageProducer from './production/localimageproducer';
import localVideoProducer from './production/localvideoproducer';


import './presentation/toggleelements';
import './presentation/displaymenu';
import './presentation/contentshow';
import './presentation/multidisplay';
import MultiShow from './presentation/multishow';
import './presentation/backgroundgradient';
import './presentation/backgroundtransition';

import './drawprocessor';
import DrawController from './drawcontroller';

import svgImportMenu from './svgimportmenu';
import shapeEditMenu from './shapeeditmenu';
import mainMenu, { SHAPE_STORAGE_SLOT_AUTO_SAVE } from './mainmenu';

import AnalogClock from '../../plugins/analogclock';

import './displays/digidisplay';
import DigiDate from './displays/digidate';
import DigiTime from './displays/digitime';

import Foreground from './displays/foreground';

import { renderer } from './renderer';

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

const foreground = new Foreground();

const frameHistory = [];

let initialized = false;

const multiShow = new MultiShow(document.getElementById('background-wrapper'));

let fnInitSlideshow;

const storage = new ShapeStorage();


const htmlTime = new DigiTime();

const htmlDate = new DigiDate();

const analogClock = new AnalogClock();



/**
 * setup wallpaper stuff
 **/
function setup() {
    canvas = document.getElementById('canvas'); // reference to our canvas element
    context = canvas.getContext('2d');  // reference to our context

    canvasBg = document.getElementById('canvasBg'); // reference to our canvas element
    contextBg = canvasBg.getContext('2d');  // reference to our context

    mainMenu.contentShow = multiShow;
}

let drawController;

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

drawController = new DrawController(pointsSource => {
    onNewPoints(pointsSource);
});


let h = 0;
let prevTimestamp;
let timeDiff;
let frameCount = 0;
/**
 * render wallpaper
 **/
function render(timestamp) {// requestAnimationFrame supplies its own timestamp. no need for performance.now();

    frameCount++;
    const t0 = performance.now();
    timestamp = timestamp || performance.now();
    if (timestamp > 2000) initialized = true;

    // frame skipping to maintain user selected framerate
    if (renderer.paused || !frame2.hadAudioFrame || performanceMonitor.shouldSkipFrame(timestamp)) {
        setTimeout(render, renderer.paused ? 1000 : 8.33);
        return;
    }

    frame2.hadAudioFrame = false;

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
        const col1 =
            'hsla( ' + (renderer.hslcolor1[0] * 360 + v) + ', ' + Math.round(renderer.hslcolor1[1] * 100) + '%, ' + Math.round(renderer.hslcolor1[2] * 100) + '%, ' + 1 + ' )';
        const col2 =
            'hsla( ' + (renderer.hslcolor2[0] * 360 + v) + ', ' + Math.round(renderer.hslcolor2[1] * 100) + '%, ' + Math.round(renderer.hslcolor2[2] * 100) + '%, ' + 1 + ' )';
        const col3 =
            'hsla( ' + (renderer.hslcolor3[0] * 360 + v) + ', ' + Math.round(renderer.hslcolor3[1] * 100) + '%, ' + Math.round(renderer.hslcolor3[2] * 100) + '%, ' + 1 + ' )';

        htmlDate.setHue(renderer.hslcolor1[0] * 360 + v);
        htmlTime.setHue(renderer.hslcolor1[0] * 360 + v);

        let gradient;
        switch (renderer.colorGradient) {
            case 0:
                gradient = col1;
                break;
            case 1:
                gradient = context.createRadialGradient(
                    renderer.width / 2, renderer.height / 2, 0, renderer.width / 2, renderer.height / 2, (renderer.width + renderer.height) / 4);
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

        // analogClock.render(context, gradient);

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
        let callerLine = ex.stack.split('\n');
        callerLine = callerLine[1];
        const index = callerLine.indexOf('at ');
        const clean = callerLine.slice(index + 2, callerLine.length);


        console.error(clean.replace(/^\s+/g, '').replace(/(http|file).+\//g, '') + ' ' + ex.message);
    }
    const t1 = performance.now();
    performanceMonitor.fpsRenderTime += t1 - t0;
    setTimeout(render, renderer.paused ? 1000 : 8.33);
}





function setupAccessController() {
    accessController.registerConsumer('WallMenu', mainMenu);
    accessController.registerConsumer('MouseDraw', drawController);
    accessController.registerConsumer('ShapeEditMenu', shapeEditMenu);
    accessController.registerConsumer('SvgImportMenu', svgImportMenu);
}

function onInit() {
    storage.loadShapeList(SHAPE_STORAGE_SLOT_AUTO_SAVE, shapeList);
    if (svgSource) {
        svgSource.toShapeList(shapeList);
    }
}


function setupPropertyPropagator() {
    //     addReceiver( propertyPrefix, receiver, generalPrefix, windowPrefix, pausedPrefix, loaded, user, general, filesAndDirectories, paused, windowProperties )
    proPro.addReceiver('analogClock_', analogClock, null, null, null, null, true, false, false, false, true);
    proPro.addReceiver('audioFrame_', frame2.config, null, null, null, null, true, false, false, false, false);
    proPro.addReceiver('audioShapeRender_', audioShapeRender, null, null, null, null, true, false, false, false, false);
    proPro.addReceiver('backgroundGradient_', multiShow.gradient, null, null, null, null, true, false, false, false, false);
    proPro.addReceiver('background_', multiShow, null, null, null, 'init', true, false, false, true, true);

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
