import ConfigController from './ConfigController';
import controller from './Configuration/Controller';

console.log('preload included');

process.once('loaded', () => {
    ConfigController.start();

    controller.log();
});
