import { screen } from 'electron';
import controller from './Configuration/Controller';
import { Setup, Display } from './Configuration/WallpaperSetup';



export default class DisplaysManager {
    public static async run(): Promise<void> {
        controller.once('init', DisplaysManager.checkDisplays);
    }

    private static _actualSetup: Setup | undefined;

    /**
     * Gets setup on first call from Electron.screen,
     * returns the cached/updated otherwise
     */
    protected static get actualSetup(): Setup {
        if (!DisplaysManager._actualSetup) {
            DisplaysManager._actualSetup = new Setup();

            for (const display of screen.getAllDisplays()) {
                DisplaysManager._actualSetup.displays.set(display.id.toFixed(0), new Display( display.id.toFixed(0) ) );
            }
        }
        return DisplaysManager._actualSetup;
    }

    /**
     * If setup differs from actual Setup.displays, Configuration/controller.updateSetup is called
     * @param setup to check with actual setup
     */
    private static checkDisplays(setup: Setup): void {
        // console.log('DisplaysManager.checkDisplays:', setup);

        for (const display of DisplaysManager.actualSetup.displays.values()) {
            if (!setup.displays.has(display.id)) {
                console.log(`DisplaysManager.checkDisplays: add ${display.id}`);
                setup.displays.set(display.id, display);
            }
        }
        for (const displayId of setup.displays.keys()) {
            if (! DisplaysManager.actualSetup.displays.has(displayId)) {
                console.log(`DisplaysManager.checkDisplays: delete ${displayId}`);
                setup.displays.delete(displayId);
            }
        }
    }
}
