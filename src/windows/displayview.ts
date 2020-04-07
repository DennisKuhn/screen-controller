const {
  ipcRenderer, remote
} = require('electron');

const url = require('url');

const crypto = require('crypto');

const ConfigEditor = require('./configeditor');
const createAndAppend = require('../utils/tools');

/** */
class DisplayView {

  /** @type {Electron.Display} */
  display;

  ipc = ipcRenderer;

  /** @type {HTMLDivElement} */
  container;

  /** @type {HTMLElement} */
  fileDisplay;

  /** @type {string} */
  fileStorageKey;

  /** @type {string} */
  file;

  /** @type {string} */
  configStorageKey;

  /** @type {ConfigEditor} */
  configEditor;

  /**
   *
   * @param {Electron.Display} display to view information about and user settings editor
   * @param {Element} parent element to attach view to
   */
  constructor(display, parent) {
    console.log(`${this.constructor.name}(${display.id})`);

    this.display = display;
    this.fileStorageKey = `${this.display.id}-file`;
    this.file = window.localStorage.getItem(this.fileStorageKey);

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
      text: this.display.id
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
    }).onclick = () => {
      this.openFile();
    };

    this.fileDisplay = createAndAppend('span', {
      parent: fileRow,
      className: 'displayfile',
      text: this.file
    });
    this.fileDisplay.title = this.file;

    if (this.file) {
      this.configStorageKey = `${this.display.id}-${crypto.createHash('md5').update(url.pathToFileURL(this.file).href).digest('hex')}-config`;
      this.ipc.send(this.fileStorageKey, this.file);
      this.configEditor = new ConfigEditor(this.container, this.file, this.configStorageKey);
    }
  }


  /**
   * Calls setFile if showDialog wasn't canceled
   */
  openFile() {
    this.showDialog()
      .then((result) => {
        console.log(`${this.constructor.name}(${this.display.id}) Dialog: canceled=${result.canceled}`);
        if (result.canceled) {
          console.log(`${this.constructor.name}(${this.display.id}) Dialog: canceled=${result.canceled}`);
        } else {
          console.log(`${this.constructor.name}(${this.display.id}) Dialog: file=${result.filePaths[0]}`);
          this.setFile(result.filePaths[0]);
        }
      }).catch((err) => {
        console.error(`Error showing Open File Dialog: ${err}`, err);
      });
  }

  /**
   * to open a file, e.g. web pages, images, movies or any file. Defaults to this.file or "My Documents"
   * @returns {Promise<Electron.OpenDialogReturnValue>}
   */
  showDialog() {
    return remote.dialog.showOpenDialog({
      properties: ['openFile'],
      defaultPath: this.file ? this.file : remote.app.getPath('documents'),
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
   * @param {string} file URL
   */
  setFile(file) {
    this.file = file;
    this.configStorageKey = `${this.display.id}-${crypto.createHash('md5').update(url.pathToFileURL(this.file).href).digest('hex')}-config`;
    this.fileDisplay.textContent = this.file;
    window.localStorage.setItem(this.fileStorageKey, this.file);
    this.ipc.send(this.fileStorageKey, this.file);
    this.configEditor = new ConfigEditor(this.container, this.file, this.configStorageKey);
  }
}

module.exports = DisplayView;
