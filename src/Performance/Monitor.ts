import { autorun, Lambda } from 'mobx';
import Performance from '../Setup/Application/Performance';
import { PerformanceSettings } from '../Setup/Application/PerformanceSettings';
import controller from '../Setup/Controller/Factory';
import { callerAndfName } from '../utils/debugging';


class Entry {
    start?: number;
    duration?: number;
    end?: number;
    tickNotFail?: boolean;
}

export default class Monitor {
    private bufferSize = 60;
    private updateInterval = 2000;
    private maxFails = 1;

    private interval?: NodeJS.Timeout;

    private next = 0;
    private buffer: Array<Entry> | undefined;

    private continuesFailed: number | undefined;
    private lastFails: number | undefined;
    private lastTicks: number | undefined;
    private lastTime: number | undefined;

    private disposers: Lambda[] = [];
    constructor(private setup: Performance) {
        controller.getSetup(PerformanceSettings.name, 0)
            .then(settings => {
                this.disposers.push(
                    autorun(() =>
                        this.initBuffer(settings as PerformanceSettings)));
                this.disposers.push(
                    autorun(() =>
                        this.resetInterval(settings as PerformanceSettings)));
            }
            );
        if (setup.failing == true) {
            setup.failing = false;
        }
    }

    private resetInterval = (settings: PerformanceSettings): void => {
        this.stopInterval();

        this.interval = setInterval(this.update, settings.updateInterval);
    }

    private stopInterval = (): void => {
        if (this.interval !== undefined) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    }

    private initBuffer = (settings: PerformanceSettings): Array<Entry> => {
        this.buffer = new Array<Entry>(settings.bufferSize);
        for (let i = 0; i < settings.bufferSize; i++) {
            this.buffer[i] = {};
        }
        return this.buffer;
    }

    dispose = (): void => {
        this.disposers.forEach(disposer => disposer());
        this.disposers.length = 0;
        this.stopInterval();
    }

    startTick = (): void => {
        if (this.buffer === undefined) {
            console.warn(`${callerAndfName()} no buffer`);
        } else {
            this.buffer[this.next].start = performance.now();
        }
    }

    private click = (tickNotFail: boolean): void => {
        if (this.buffer === undefined) {
            console.warn(`${callerAndfName()} no buffer`);
        } else {
            const entry = this.buffer[this.next];
            const end = performance.now();

            entry.tickNotFail = tickNotFail;
            entry.end = end;
            if (entry.start !== undefined) {
                entry.duration = end - entry.start;
            }
            this.next = (this.next + 1) % this.bufferSize;
        }
    }

    tick = (): void => {
        this.click(true);

        if (this.continuesFailed) {
            if (this.continuesFailed > this.maxFails) {
                this.setup.failing = false;
            }
            this.continuesFailed = 0;
        }
    }

    fail = (): void => {
        this.click(false);
        this.continuesFailed = (this.continuesFailed ?? 0) + 1;
        if (this.continuesFailed === (this.maxFails + 1)) {
            this.setup.failing = true;
        }
    }

    update = (): void => {
        if (this.buffer === undefined) {
            console.warn(`${callerAndfName()} no buffer`);
        } else {
            let count = 0;
            let fails = 0;
            let ticks = 0;
            let time = 0;
            let minTime = Number.MAX_SAFE_INTEGER;
            let maxTime = Number.MIN_SAFE_INTEGER;

            for (const entry of this.buffer) {
                if (entry.end !== undefined) {
                    count += 1;
                    if (entry.tickNotFail === true) {
                        ticks += 1;
                    } else {
                        fails += 1;
                    }
                    minTime = entry.end < minTime ? entry.end : minTime;
                    maxTime = entry.end > maxTime ? entry.end : maxTime;
                    time += (entry.duration !== undefined) ? entry.duration : 0;
                }
            }
            if (count >= 2) {
                const timeSpan = (maxTime - minTime) / 1000;
                const ticksPs = ticks / timeSpan;
                const failsPs = fails / timeSpan;
                const timePs = (time / 1000) / timeSpan;

                if (this.lastFails !== failsPs) {
                    this.setup.failsPerSecond = this.lastFails = failsPs;
                }
                if (this.lastTicks !== ticksPs) {
                    this.setup.ticksPerSecond = this.lastTicks = ticksPs;
                }
                if (this.lastTime !== timePs) {
                    this.setup.timePerSecond = this.lastTime = timePs;
                }
            }
        }
    }
}