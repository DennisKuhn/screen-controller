import { observer } from 'mobx-react-lite';

import React from 'react';

import { Browser } from '../../../infrastructure/Configuration/WallpaperSetup';


const Plugins = observer(({ browser }: { browser: Browser }): JSX.Element => {

    return (
        <Table>
            <TableBody>
                {browser.children.map(browser => browser).filter(browser => browser != undefined).map(browser =>
                    <Row key={(browser as Browser).id} browser={(browser as Browser)} />)}
            </TableBody>
        </Table>
    );
});

export default Plugins;