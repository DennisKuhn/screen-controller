import controller, {Paper} from  '../Setup/Controller';
import { Manager } from '../plugins/Manager';

console.log('preload included');

process.once('loaded', async () => {
    const paper = controller as Paper;

    if (!paper.getBrowser)
        throw new Error(`preload.ts: Setup controller is not a Paper with getBrowser ${controller.constructor?.name}`);

    console.log('preload.ts: get Browser');
    const browser = await paper.getBrowser();

    console.log(`preload.ts: create Manager for Browser ${browser.id}@${browser.parentId}`);

    const manager = new Manager(browser);
});
