import {app, BrowserWindow} from 'electron';
import Main from './BrowserManager';

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

app.allowRendererProcessReuse = true;
Main.run(app, BrowserWindow);
