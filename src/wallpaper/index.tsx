import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Wallpaper from './Wallpaper';

import controller from '../Setup/Controller/Factory';
import { Paper } from '../Setup/Controller/Paper';
import { Manager } from '../plugins/Manager';

console.log('Wallpaper/index.tsx');

const paper = controller as Paper;

if (!paper.getBrowser)
    throw new Error(`Wallpaper/index.tsx: Setup controller is not a Paper with getBrowser ${controller.constructor?.name}`);

console.log('Wallpaper/index.tsx: get Browser');

paper.getBrowser()
    .then(browser => new Manager(browser) );



const renderApp = (): void => {
    ReactDOM.render(<Wallpaper />, document.getElementById('root'));
};

renderApp();
if (module.hot) {
    module.hot.accept('./Wallpaper', renderApp);
}
