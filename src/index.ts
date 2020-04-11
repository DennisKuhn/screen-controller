import {app} from 'electron';
import WallpapersManager from './infrastructure/WallpapersManager';
import Windows from './infrastructure/Windows';


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}
debugger;

app.allowRendererProcessReuse = true;

app.whenReady().then(
    () => {
        // Create and listen to "<display>-file" IPC channels to load wallpapers
        WallpapersManager.run();

        // MainWindow feeds "<display>-file" IPC channels
        Windows.start();
    }
);

app.on('window-all-closed', (): void => {
    if (process.platform !== 'darwin') {
        WallpapersManager.application.quit();
    }
});
