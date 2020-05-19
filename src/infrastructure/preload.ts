import controller, {Paper} from  '../Setup/Controller';
import { Manager } from '../plugins/Manager';

process.once('loaded', async () => {
    const paper = controller as Paper;

    if (!paper.getBrowser)
        throw new Error(`preload.ts: Setup controller is not a Paper with getBrowser ${controller.constructor?.name}`);

    const browser = await paper.getBrowser();

    new Manager(browser);
});
