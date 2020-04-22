import React from 'react';
import { createBrowserHistory } from 'history';
import { Router, Route, Switch, Redirect } from 'react-router-dom';

// core components
import Admin from './layouts/Admin';
import RTL from './layouts/RTL';

import './assets/css/material-dashboard-react.css';

const hist = createBrowserHistory();

export default function App(): JSX.Element {
    return <Router history={hist}>
        <Switch>
            <Route path="/admin" component={Admin} />
            <Route path="/rtl" component={RTL} />
            <Redirect from="/" to="/admin/dashboard" />
        </Switch>
    </Router>;
}