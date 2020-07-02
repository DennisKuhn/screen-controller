import { makeStyles, Grid } from '@material-ui/core';
import { observer } from 'mobx-react-lite';
import React, { useState, useEffect } from 'react';
import dashboardStyle from '../../assets/jss/material-dashboard-react/views/dashboardStyle';
import { ObservableSetupBaseMap } from '../../../Setup/Container';
import { Browser } from '../../../Setup/Application/Browser';
import { Plugin } from '../../../Setup/Application/Plugin';
import controller from '../../../Setup/Controller/Factory';
import PluginLine from './PluginLine';

interface Props {
    browser: Browser;
}


const BrowserPlugins = observer(({ plugins }: {plugins: ObservableSetupBaseMap<Plugin>}): JSX.Element => {
    return (<Grid container>
        {plugins.mapEntries(([id, plugin]) =>
            <PluginLine key={id} plugin={plugin} />
        )}
    </Grid>);
});



const PluginsGetter = ({ browser }: Props): JSX.Element => {
    const [plugins, setPlugins] = useState(undefined as ObservableSetupBaseMap<Plugin> | undefined);

    const getPlugins = (): void => {
        // get browser.Plugins->
        (controller.getSetup(browser.id, 1) as Promise<Browser>)
            .then(browser => setPlugins( (browser as Browser).plugins));
    };

    useEffect(getPlugins, []);

    return plugins ? <BrowserPlugins plugins={plugins} /> : (<></>);
};


export default PluginsGetter;
