import { screen } from 'electron';
import controller from './Configuration/Controller';
import { Setup, Display, SetupDiff } from './Configuration/WallpaperSetup';



export default class DisplaysManager {
    public static async run(): Promise<void> {
        console.log('DisplaysManager.run');
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
                DisplaysManager._actualSetup.displays[display.id] = new Display(display.id);
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

        const changedSetup: SetupDiff = new SetupDiff();

        for (const display of DisplaysManager.actualSetup.displays) {
            if (!(display.id in setup.displays)) {
                changedSetup.displays[display.id] = display;
            }
        }
        for (const displayId in setup.displays) {
            if (!(displayId in DisplaysManager.actualSetup.displays)) {
                changedSetup.displays[displayId] = null;
            }
        }

        console.log('DisplaysManager.checkDisplays:', setup, changedSetup);

        if (Object.keys(changedSetup.displays).length) {
            controller.updateSetup(changedSetup);
        }
    }


}
