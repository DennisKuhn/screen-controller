const {
  remote
} = require('electron');

const DisplayView = require('./displayview');

/**
 * Creates a DisplayView for each display in screen.getAllDisplays
 */
class ScreenManager {

  /**
   * @type {Electron.Display[]}
   */
  displays = [];

  /**
   * @type {DisplayView[]}
   */
  views = [];

  /**
   * @type {Element}
   */
  screensWrapper = document.querySelector('[id = displayswrapper]');

  /** */
  constructor() {
    console.log(`${this.constructor.name}`);
    this.displays = remote.screen.getAllDisplays();

    this.displays.forEach(
      (display) => {
        this.views.push(new DisplayView(display, this.screensWrapper));
      }
    );
  }
}

window.screenManager = new ScreenManager();
