import { screen as electronScreen, Display as ElectronDisplay } from 'electron';
import controller from './Configuration/Controller';
import { Screen, Display, ScreenID } from './Configuration/WallpaperSetup';



export default class DisplaysManager {
    public static run(): void {
        const screenId: ScreenID = 'Screen';

        controller.getSetup(screenId, 2)
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
            if (!screen.children.has(displayId)) {
                console.log(`DisplaysManager.checkDisplays: add ${displayId}`);
                screen.children.set(
                    displayId,
                    Display.createNew(displayId)
                );
            }
        }
        for (const displayId of screen.children.keys()) {
            if (!DisplaysManager.actualDisplays.has(displayId)) {
                console.log(`DisplaysManager.checkDisplays: delete ${displayId}`);
                screen.children.delete(displayId);
            }
        }
    }
}
