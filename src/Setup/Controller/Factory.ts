import { Controller } from './Controller';
import { Main } from './Main';
import { Paper } from './Paper';
import { MainWindow } from './MainWindow';
import { Renderer } from './Renderer';
import { checkOrphans } from '../../utils/debugging';

interface Win extends Window {
    checkOrphans: () => void;
}

declare global {
    interface Window {
        checkOrphans: () => void;
    }
}


/**
 * Instance for this context
 */
let controller: Controller;

/**
 * Config controller factory
 */
switch (process.type) {
    case 'browser':
        // console.log(`Config.Controller[${process.type}]: create Main`);
        controller = new Main();
        break;
    case 'renderer':
        if (process.argv.some((arg) => /^--browserid=/.test(arg))) {
            // console.log(`Config.Controller[${process.type}]: create Paper`);
            controller = new Paper();
        } else if (process.argv.some((arg) => /^--mainwindow/.test(arg))) {
            // console.log(`Config.Controller[${process.type}]: create Renderer`);
            controller = new MainWindow();
        } else {
            // console.log(`Config.Controller[${process.type}]: create Renderer`);
            controller = new Renderer();
        }
        window.checkOrphans = checkOrphans;
        break;
    case 'worker':
    default:
        console.error(`Config.Controller[${process.type}]: is not supported`);
        throw new Error(
            `Config.Controller: process.type=${process.type} is not supported`
        );
}

export default controller;
