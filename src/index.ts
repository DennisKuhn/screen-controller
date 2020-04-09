import {app, BrowserWindow} from 'electron';
import Main from './infrastructure/BrowserManager';
import CrawlersCenter from './infrastructure/crawlerscenter';

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

app.allowRendererProcessReuse = true;
Main.run(app, BrowserWindow);


const crawlers = new CrawlersCenter(6, 6, 32);
crawlers.start('D:/Dennis/Projects');

setInterval(
    () => {
        // console.log(`main.Interval ....`);
        // crawlers.getFile()
        //     .then(f => console.log(`main.Interval: crawlers...gotFile() => ${f}`));
    },
    0
)
