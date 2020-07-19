import { setInterval, clearInterval } from 'timers';
import { callerAndfName } from '../utils/debugging';
import { Root } from '../Setup/Application/Root';
import { IReactionDisposer, autorun } from 'mobx';
import controller from '../Setup/Controller/Factory';

let interval: NodeJS.Timeout | undefined;
let autoRunDisposer: IReactionDisposer | undefined;
let root: Root | undefined;

const update = (): void => {
    if (!root) throw new Error(`${callerAndfName()} no root`);

    root.mainPerformance.timePerSecond = process.getCPUUsage().percentCPUUsage / 100;
};

const updateInterval = (): void => {
    if (!root) throw new Error(`${callerAndfName()} no root`);

    console.debug(`${callerAndfName()} setInterval=${root.performanceSettings.updateInterval} ${interval !== undefined ? 'clearInterval(' + interval + ')' : ''}`);
    if (interval !== undefined) {
        clearInterval(interval);
    }
    interval = setInterval(
        update,
        root.performanceSettings.updateInterval
    );
};


const start = async (): Promise<void> => {
    root = (await controller.getSetup(Root.name, 0)) as Root;
    root.mainPid = process.pid;

    console.debug(`${callerAndfName()} mainPid=${root.mainPid}`);

    autoRunDisposer = autorun(updateInterval);
};

export const stop = (): void => {
    autoRunDisposer && autoRunDisposer();
    autoRunDisposer = undefined;

    interval && clearInterval(interval);
    interval = undefined;
};

export default start;
