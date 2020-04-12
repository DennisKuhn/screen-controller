import {
    remote
} from 'electron';

import Url, {fs2Url, href2Url} from '../utils/Url';

import ConfigEditor from './configeditor';
import createAndAppend from '../utils/tools';
import ipc, {CHANNEL, Display2StorageKey} from '../infrastructure/WallpapersManager.ipc';


/** */
class DisplayView {

    display: Electron.Display;

    container: HTMLDivElement;

    fileDisplay: HTMLElement;

    fileStorageKey: string;

    file: Url;

    configStorageKey: string;

    configEditor: ConfigEditor;

    /**
     *
     * @param {Electron.Display} display to view information about and user settings editor
     * @param {Element} parent element to attach view to
     */
    constructor(display: Electron.Display, parent: Element) {
        console.log(`${this.constructor.name}(${display.id})`);

        this.display = display;
        this.fileStorageKey = Display2StorageKey( this.display.id );
        const fileRecord = window.localStorage.getItem(this.fileStorageKey);

        if (fileRecord) {
            this.file = href2Url(fileRecord);
        }

        /** @type {HTMLDivElement} */
        this.container = createAndAppend('div', {
            parent: parent,
            className: 'display'
        });

        const topRow = createAndAppend('div', {
            parent: this.container,
            className: 'row'
        });

        createAndAppend('h2', {
            parent: topRow,
            className: 'title',
            text: this.display.id.toString()
        });

        createAndAppend('span', {
            parent: topRow,
            className: 'size',
            text: `${this.display.workAreaSize.width} * ${this.display.workAreaSize.height} @ ${this.display.workArea.x}, ${this.display.workArea.y}`
        });

        const fileRow = createAndAppend('div', {
            parent: this.container,
            className: 'row'
        });

        createAndAppend('button', {
            parent: fileRow,
            className: 'button',
            text: 'Choose file'
        }).onclick = this.openFile;        

        this.fileDisplay = createAndAppend('span', {
            parent: fileRow,
            className: 'displayfile',
            text: this.file ? this.file.pathname : ''
        });

        if (this.file) {
            this.fileDisplay.title = this.file.pathname;
            this.configEditor = new ConfigEditor(this.container, this.display.id, this.file);
        }
    }


    /**
     * If showDialog wasn't canceled, call setFile
     */
    openFile = (): void => {
        this.showDialog()
            .then((result) => {
                console.log(`${this.constructor.name}(${this.display.id}) Dialog: canceled=${result.canceled}`);
                if (result.canceled) {
                    console.log(`${this.constructor.name}(${this.display.id}) Dialog: canceled=${result.canceled}`);
                } else {
                    console.log(`${this.constructor.name}(${this.display.id}) Dialog: file=${result.filePaths[0]}`);

                    this.setFile(fs2Url(result.filePaths[0]));
                }
            }).catch((err) => {
                console.error(`Error showing Open File Dialog: ${err}`, err);
            });
    }

    /**
     * to open a file, e.g. web pages, images, movies or any file. Defaults to this.file or "My Documents"
     * @returns {Promise<Electron.OpenDialogReturnValue>}
     */
    showDialog = (): Promise<Electron.OpenDialogReturnValue> => {
        return remote.dialog.showOpenDialog({
            properties: ['openFile'],
            defaultPath: this.file ? this.file.pathname : remote.app.getPath('documents'),
            filters: [
                {
                    name: 'Web pages',
                    extensions: ['html', 'htm']
                },
                {
                    name: 'Images',
                    extensions: ['jpg', 'png', 'gif']
                },
                {
                    name: 'Movies',
                    extensions: ['mkv', 'avi', 'mp4']
                },
                {
                    name: 'All Files',
                    extensions: ['*']
                }
            ]
        });
    }

    /**
     * sets fileDisplay, stores the file URL and does IPC to the main thread to load the file
     * @param {Url} file URL
     */
    setFile(file: Url): void {
        this.file = file;
        this.fileDisplay.textContent = this.file.pathname;
        window.localStorage.setItem(this.fileStorageKey, this.file.href);
        ipc.send(CHANNEL, this.display.id, 'load', this.file.href);
        this.configEditor = new ConfigEditor(this.container, this.display.id, this.file);
    }
}

export default DisplayView;
