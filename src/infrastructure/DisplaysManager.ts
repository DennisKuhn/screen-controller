import { screen as electronScreen, Display as ElectronDisplay } from 'electron';
import controller from '../Setup/Controller/Factory';
import { Screen } from '../Setup/Application/Screen';
import { Display } from '../Setup/Application/Display';
import { SetupBase } from 'src/Setup/SetupBase';



export default class DisplaysManager {
    public static run(): void {
        controller.getSetup(Screen.name, 2)
            .then(setup => DisplaysManager.checkDisplays(setup as Screen));
    }

    private static _actualDisplays: Map<string, ElectronDisplay> | undefined;

    /**
     * Gets setup on first call from Electron.screen,
     * returns the cached/updated otherwise
     */
    protected static get actualDisplays(): Map<string, ElectronDisplay> {
        if (!DisplaysManager._actualDisplays) {
            DisplaysManager._actualDisplays = new Map<string, ElectronDisplay>();

            for (const display of electronScreen.getAllDisplays()) {
                DisplaysManager._actualDisplays.set(
                    display.id.toFixed(0),
                    display
                );
            }
        }
        return DisplaysManager._actualDisplays;
    }

    /**
     * If setup differs from actual Setup.displays, Configuration/controller.updateSetup is called
     * @param setup to check with actual setup
     */
    private static checkDisplays(screen: Screen): void {
        // console.log('DisplaysManager.checkDisplays:', setup);

        for (const displayId of DisplaysManager.actualDisplays.keys()) {
            if (!screen.displays.has(displayId)) {
                // console.log(`DisplaysManager.checkDisplays: add ${displayId}`);
                screen.displays.set(
                    displayId,
                    SetupBase.createNew(Display.name, screen.id, 'displays', displayId) as Display
                    // Display.createNew(displayId, screen.id, 'displays' )
                );
            }
        }
        for (const displayId of screen.displays.keys()) {
            if (!DisplaysManager.actualDisplays.has(displayId)) {
                // console.log(`DisplaysManager.checkDisplays: delete ${displayId}`);
                screen.displays.delete(displayId);
            }
        }
    }
}
