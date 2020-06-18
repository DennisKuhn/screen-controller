debugger;

import { app } from 'electron';
import WallpapersManager from './infrastructure/WallpapersManager';
import Windows from './infrastructure/Windows';
import DisplaysManager from './infrastructure/DisplaysManager';
import ScreenManagerStart from './infrastructure/ScreenManager';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

// require('react-devtools-electron');

app.allowRendererProcessReuse = true;

app.whenReady().then(
    () => {
        ScreenManagerStart();
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
