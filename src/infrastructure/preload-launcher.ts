// preload-launcher.js
import { remote } from 'electron';
import test from 'electron-com';

require('electron-compile/lib/initialize-renderer').initializeRendererProcess(remote.getGlobal('globalCompilerHost').readOnlyMode);

console.log('preload launcher included');

require('./preload');