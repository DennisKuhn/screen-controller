import { screen, Display as ElectronDisplay } from 'electron';
import controller from './Configuration/Controller';
import { Setup, Display, SetupID } from './Configuration/WallpaperSetup';



export default class DisplaysManager {
    public static run(): void {
        const setupId: SetupID = 'Setup';

        controller.getSetup(setupId, 2)
            .then(setup => DisplaysManager.checkDisplays(setup as Setup));
    }

    private static _actualDisplays: Map<string, ElectronDisplay> | undefined;

    /**
     * Gets setup on first call from Electron.screen,
     * returns the cached/updated otherwise
     */
    protected static get actualDisplays(): Map<string, ElectronDisplay> {
        if (!DisplaysManager._actualDisplays) {
            DisplaysManager._actualDisplays = new Map<string, ElectronDisplay>();

            for (const display of screen.getAllDisplays()) {
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
    private static checkDisplays(setup: Setup): void {
        // console.log('DisplaysManager.checkDisplays:', setup);

        for (const displayId of DisplaysManager.actualDisplays.keys()) {
            if (!setup.children.has(displayId)) {
                console.log(`DisplaysManager.checkDisplays: add ${displayId}`);
                setup.children.set(
                    displayId,
                    new Display({ id: displayId, parentId: setup.id, className: 'Display', children: {} })
                );
            }
        }
        for (const displayId of setup.children.keys()) {
            if (!DisplaysManager.actualDisplays.has(displayId)) {
                console.log(`DisplaysManager.checkDisplays: delete ${displayId}`);
                setup.children.delete(displayId);
            }
        }
    }
}
