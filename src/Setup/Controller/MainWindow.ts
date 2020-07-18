import { Renderer } from './Renderer';
import { SetupBase } from '../SetupBase';
import { Root } from '../Application/Root';
import { toJS } from 'mobx';


export class MainWindow extends Renderer {

    constructor() {
        super();

        // console.log(`${this.constructor.name}()`, process.argv);

        this.getSetup(Root.name, -1)
            .then(root => {
                console.debug(`${this.constructor.name}() gotSetup(${Root.name}) send ...`, {schema: SetupBase.activeSchema, root});
                this.ipc.send(
                    'init',
                    {
                        schema: toJS(SetupBase.activeSchema),
                        root: root.getDeep()
                    }
                );
            })
            .catch(error => {
                console.error(`${this.constructor.name}() getSetup(${Root.name}) caught: ${error}`);
            });
    }

}

