import { observer } from 'mobx-react-lite';
import React, { useState, useEffect } from 'react';
import { ObservableSetupBaseMap } from '../../../Setup/Container';
import { Browser } from '../../../Setup/Application/Browser';
import { Plugin } from '../../../Setup/Application/Plugin';
import controller from '../../../Setup/Controller/Factory';
import PluginLine from './PluginLine';
import { TableContainer, TableHead, Table, TableRow, TableCell, TableBody } from '@material-ui/core';

interface Props {
    browser: Browser;
}


const BrowserPlugins = observer(({ plugins }: { plugins: ObservableSetupBaseMap<Plugin> }): JSX.Element => {

    return (
        <TableContainer>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>CPU</TableCell>
                        <TableCell>fps</TableCell>
                        <TableCell>Skipped</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>x</TableCell>
                        <TableCell>y</TableCell>
                        <TableCell>Width</TableCell>
                        <TableCell>Height</TableCell>
                    </TableRow>                    
                    <TableRow>
                        <TableCell>[%]</TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell>[%]</TableCell>
                        <TableCell>[%]</TableCell>
                        <TableCell>[%]</TableCell>
                        <TableCell>[%]</TableCell>
                    </TableRow>                    
                </TableHead>
                <TableBody>
                    {plugins.mapEntries(([id, plugin]) =>
                        <PluginLine key={id} plugin={plugin} />
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
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
