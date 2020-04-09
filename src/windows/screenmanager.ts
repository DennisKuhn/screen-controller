import { Display, remote } from 'electron';
import DisplayView from './displayview';

/**
 * Creates a DisplayView for each display in screen.getAllDisplays
 */
class ScreenManager {

    displays: Display[] = [];

    views: DisplayView[] = [];

    screensWrapper: HTMLDivElement = document.querySelector<HTMLDivElement>('[id = displayswrapper]');

    /** */
    constructor() {
        console.log(`${this.constructor.name}`);
        this.displays = remote.screen.getAllDisplays();

        this.displays.forEach(
            (display) => {
                this.views.push(new DisplayView(display, this.screensWrapper));
            }
        );
    }
}

(window as any).screenManager = new ScreenManager();
