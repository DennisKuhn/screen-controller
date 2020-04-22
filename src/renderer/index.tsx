import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MainWindow from './MainWindow';

const renderApp = (): void => {
    ReactDOM.render(<MainWindow />, document.getElementById('root'));
};

renderApp();
if (module.hot) {
    module.hot.accept('./MainWindow', renderApp);
}
