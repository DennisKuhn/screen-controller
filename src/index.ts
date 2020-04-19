import {app} from 'electron';
import WallpapersManager from './infrastructure/WallpapersManager';
import Windows from './infrastructure/Windows';
import DisplaysManager from './infrastructure/DisplaysManager';


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}
debugger;

app.allowRendererProcessReuse = true;

app.whenReady().then(
    () => {
        console.log('index.ts: App ready');
        DisplaysManager.run();
        WallpapersManager.run();

        Windows.start();
    }
);

app.on('window-all-closed', (): void => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
