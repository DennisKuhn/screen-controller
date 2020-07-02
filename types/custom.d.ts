declare module 'worker-loader!*' {
    class WebpackWorker extends Worker {
        constructor();
    }

    export default WebpackWorker;
}

// Type definitions for FPSmeter v0.3.0
// Project: http://darsa.in/fpsmeter/
// Definitions by: Aaron Lampros <https://github.com/alampros>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare module 'fpsmeter' {

    export interface FPSMeterOptions {
        interval?: number;         // Update interval in milliseconds.
        smoothing?: number;        // Spike smoothing strength. 1 means no smoothing.
        monitorInterval: number; // Interval to update monitorFps and monitorUsage: 1000
        show?: string;            // Whether to show 'fps', or 'ms' = frame duration in milliseconds.
        toggleOn?: string;        // Toggle between show 'fps' and 'ms' on this event.
        decimals?: number;        // Number of decimals in FPS number. 1 = 59.9, 2 = 59.94, ...
        maxFps?: number;        // Max expected FPS value.
        threshold?: number;        // Minimal tick reporting interval in milliseconds.
        label?: string;         // Label to distinguish several fps meter
        position?: string;        // Meter position.
        zIndex?: number;        // Meter Z index.
        left?: string;            // Meter left offset.
        top?: string;            // Meter top offset.
        right?: string;            // Meter right offset.
        bottom?: string;        // Meter bottom offset.
        margin?: string;        // Meter margin. Helps with centering the counter when left: 50%;

        theme?: string;            // Meter theme. Build in: 'dark', 'light', 'transparent', 'colorful'.
        heat?: number;            // Allow themes to use coloring by FPS heat. 0 FPS = red, maxFps = green.

        graph?: number;            // Whether to show history graph.
        history?: number;        // How many history states to show in a graph.
    }

    class FPSMeter {
        constructor(anchor?: HTMLElement, options?: FPSMeterOptions);
        public options: FPSMeterOptions;
        public tick(): void;
        public skip(): void;
        public tickStart(): void;
        public render(): void;
        public pause(): FPSMeter;
        public resume(): FPSMeter;
        public isPaused: number;
        public usage: number;
        public duration: number;
        public fps: number;
        public monitorUsage: number;
        public monitorFps: number;
        public monitorSkipped: number;
        public set(name: string, value: any): FPSMeter;
        public showDuration(): FPSMeter;
        public showFps(): FPSMeter;
        public toggle(): FPSMeter;
        public hide(): FPSMeter;
        public show(): FPSMeter;
        public destroy(): void;
    }

    export default FPSMeter;
}