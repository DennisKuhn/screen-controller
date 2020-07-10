import { isEqual } from 'lodash';
import { Subscriber } from 'rxjs';
// import { distinctUntilChanged, tap } from 'rxjs/operators';
import { callerAndfName } from '../../utils/debugging';
import { IpcChangeArgsType, IpcWindow, getIpcArgsLog } from './IpcInterface';
import { performance } from 'perf_hooks';

interface IpcSend {
    channel: string;
    change: IpcChangeArgsType;
    persist?: boolean;
}

export class UpdateChannel {
    private received: {} = {};
    // private observableSend: Observable<IpcSend>;
    private sendSubscriber: Subscriber<IpcSend> | undefined;
    private in = 0;
    private out = 0;
    private start = performance.now();

    constructor(public ipc: IpcWindow) {
        // this.observableSend = new Observable(
        //     (subscriber) => this.sendSubscriber = subscriber
        // );
        // this.observableSend
        //     .pipe(
        //         tap(() => this.in += 1),
        //         // distinctUntilChanged(isEqual),
        //         tap(() => this.out += 1),
        //         tap(() => {
        //             (this.out % 100 == 0) &&
        //                 console.debug(
        //                     `UpdateChannel[${this.ipc.id}] ${((this.out / this.in) * 100).toFixed(0)}%` +
        //                     ` ${(this.out / ((performance.now() - this.start) / 1000)).toFixed(0)}/s ${(this.in / ((performance.now() - this.start) / 1000)).toFixed(0)}/s` +
        //                     ` ${this.out}/${this.in}`
        //                 );
        //         })
        //     )
        //     .subscribe(this.sendNow);
    }

    public onError: ((source: UpdateChannel) => void) | undefined;


    static updateKey = (itemID: string, nameOrIndex: string | number, container?: string): string => `${itemID}.${container ? container + '.' : ''}${nameOrIndex}`;

    addReceived = (update: IpcChangeArgsType): void => {
        const updateKey = UpdateChannel.updateKey(update.item, update['name'] ?? update['index'], update['map'] ?? update['array']);
        // console.log(
        //     `${callerAndfName()}() [${this.ipc.id}][${updateKey}] =` +
        //     ` ${update['newValue'] ? (update['newValue']['id'] ?? update['newValue']) : update['newValue']}`);
        this.received[updateKey] = update['newValue'];
    }

    send = (channel: string, change: IpcChangeArgsType, persist?: boolean): void => {
        this.sendNow({ channel, change, persist });

        // if (!this.sendSubscriber)
        //     throw new Error(`${callerAndfName()}${getIpcArgsLog(change)}: no sendSubscriber`);

        // // console.log(
        // //     `${callerAndfName()}(${this.ipc.id}, ` +
        // //     ` @ ${change.item}.${change['map'] ? change['map'] + '.' : ''}.${change.name}, ${change.type}, ${persist}) = ` +
        // //     `${change['newValue'] ? (change['newValue']['id'] ?? change['newValue']) : change['newValue']}`);

        // this.sendSubscriber.next({ channel, change, persist });
    }

    private sendNow = ({/*channel,*/ change, persist }: IpcSend): void => {
        const updateKey = UpdateChannel.updateKey(change.item, change['name'] ?? change['index'], change['map'] ?? change['array']);
        const hasUpdate = updateKey in this.received;
        const update = this.received[updateKey];
        let skipChange = false;

        if (hasUpdate) {
            skipChange = isEqual(update, change['newValue']);

            // console.log(
            //     `${callerAndfName()}[${this.ipc.id}]${getIpcArgsLog(change)}, ${persist}) ${skipChange ? 'skip receivd' : 'send newer'} [${updateKey}]`,
            //     /* change['newValue'] */
            // );
            delete this.received[updateKey];
        }
        if (!skipChange) {
            // if (this.ipc.isDestroyed()) {
            //     console.error(
            //         `${ callerAndfName() }[${ this.ipc.id }]${ getIpcArgsLog(change) }, ${ persist }): isDestroyed`
            //     );

            //     this.onError && this.onError(this);
            // } else {
            try {
                // console.debug(`${callerAndfName()}[${this.ipc.id}]${getIpcArgsLog(change)}, ${persist})`);

                this.ipc.send(/*channel*/ 'change', change, persist === true);
            } catch (error) {
                console.warn(
                    `${callerAndfName()}[${this.ipc.id}]${getIpcArgsLog(change)}, ${persist}): ${error}`, error);

                this.onError && this.onError(this);
            }
            // }
        }
    }
}

