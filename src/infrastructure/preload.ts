import controller from './Configuration/Controller';

console.log('preload included');

process.once('loaded', () => {
    controller.log();
});
