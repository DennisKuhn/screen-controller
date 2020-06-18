import Color from 'color';
import { Screen } from '../Setup/Application/Screen';
import controller from '../Setup/Controller/Factory';
import { isObservableArray } from 'mobx';
import { callerAndfName } from 'src/utils/debugging';

let colorPosition = 0;

const update = (screen: Screen): void => {
    if (screen.rotateColors) {
        colorPosition = (colorPosition + 1) % 360;

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
    }
};

let interval: NodeJS.Timeout | undefined;

const start = async (): Promise<void> => {
    const screen = (await controller.getSetup(Screen.name, 0)) as Screen;

    if (screen.activeGradient == undefined) {
        screen.createActiveGradient();
    }

    interval = setInterval(
        update,
        1000 / screen.fps,
        screen
    );
};

export const stop = (): void => interval && clearInterval(interval);

export default start;