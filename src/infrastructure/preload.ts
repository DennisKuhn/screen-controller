import ConfigController from './ConfigController';

console.log('preload included');

process.once('loaded', () => {
    ConfigController.start();
});
