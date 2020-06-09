import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import 'mobx-react-lite/batchingForReactDom';

// How?
// import { observerBatching } from 'mobx-react-lite';
// observerBatching(customBatchedUpdates);

const renderApp = (): void => {
    ReactDOM.render(<App />, document.getElementById('root'));
};

renderApp();
if (module.hot) {
    module.hot.accept('./App', renderApp);
}

