import Color from 'color';
import { Screen } from '../Setup/Application/Screen';
import controller from '../Setup/Controller/Factory';
import { isObservableArray, autorun, IReactionDisposer } from 'mobx';
import { callerAndfName } from '../utils/debugging';
import { performance } from 'perf_hooks';

let colorPosition = 0;
let frames = 0;
let framesStart;

const update = (screen: Screen): void => {
    const dbgFrames = 2 * screen.fps;
    frames += 1;
    if (screen.rotateColors) {
        colorPosition = (colorPosition + screen.rotateSteps) % 360;

        // (frames % dbgFrames ==  0) && console.time('ScreenManager.update');

        if (!screen.activeGradient) throw new Error(`${callerAndfName()} no screen.activeGradient`);
        if (!isObservableArray(screen.activeGradient.colors)) throw new Error(`${callerAndfName()} screen.activeGradient.color is not ObservableArray`);

        screen.activeGradient.colors
            .replace(
                screen.startGradient.colors.map(
                    color =>
                        (new Color(color))
                            .rotate(colorPosition).string()
                )
            );

        // (frames % dbgFrames ==  0) && console.timeEnd('ScreenManager.update');
    }
    if ((frames % dbgFrames == 1) && ((frames / ((performance.now() - framesStart) / 1000)) < (screen.fps * 0.9))) {
        console.debug(`ScreenManager.update fps: ${(frames / ((performance.now() - framesStart) / 1000)).toFixed(1)}`);
    }
};

let interval: NodeJS.Timeout | undefined;
let autoRunDisposer: IReactionDisposer | undefined;
let screen: Screen | undefined;

const resetGradient = (): void => {
    if (!screen) throw new Error(`${callerAndfName()} no screen`);
    if (!screen.activeGradient) throw new Error(`${callerAndfName()} no screen.activeGradient`);
    const { activeGradient, startGradient } = screen;

    activeGradient.colors.replace(startGradient.colors);
};

const updateInterval = (): void => {
    if (!screen) throw new Error(`${callerAndfName()} no screen`);
    const { rotateColors, fps } = screen;

    if (rotateColors) {
        const timeout = 1000 / fps;
        console.debug(`${callerAndfName()} fps=${screen?.fps} setInterval=${timeout.toFixed(1)} ${interval !== undefined ? 'clearInterval(' + interval + ')' : ''}`);
        if (interval !== undefined) {
            clearInterval(interval);
        }
        framesStart = performance.now();
        frames = 0;
        interval = setInterval(
            update,
            timeout,
            screen
        );
    } else if (interval !== undefined) {
        console.debug(`${callerAndfName()} clearInterval(${interval})`);
        clearInterval(interval);
        interval = undefined;
        resetGradient();
    } else {
        resetGradient();
    }
};

const start = async (): Promise<void> => {
    screen = (await controller.getSetup(Screen.name, 0)) as Screen;

    if (screen.activeGradient == undefined) {
        screen.createActiveGradient();
    }


    autoRunDisposer = autorun(updateInterval);
};

export const stop = (): void => {
    interval && clearInterval(interval);
    interval = undefined;
    autoRunDisposer && autoRunDisposer();
    autoRunDisposer = undefined;
};

export default start;