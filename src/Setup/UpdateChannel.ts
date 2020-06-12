import { IpcWindow, IpcChangeArgs, IpcMapChangeArgs, IpcChangeArgsType } from './IpcInterface';
import { isEqual } from 'lodash';
import { Observable, Subscriber } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

interface IpcSend {
    channel: string;
    change: IpcChangeArgsType;
    persist?: boolean;
}

export class UpdateChannel {
    private received: {} = {};
    private observableSend: Observable<IpcSend>;
    private sendSubscriber: Subscriber<IpcSend> | undefined;

    constructor(public ipc: IpcWindow) {
        this.observableSend = new Observable(
            (subscriber) => this.sendSubscriber = subscriber
        );
        this.observableSend
            .pipe(
                distinctUntilChanged(isEqual)
            )
            .subscribe(
                (args: IpcSend) => this.sendNow(args.channel, args.change, args.persist)
            );
    }

    public onError: ((source: UpdateChannel) => void) | undefined;


    static updateKey = (itemID: string, name: string, map?: string): string => `${itemID}.${map ? map + '.' : ''}${name}`;

    addReceived = (update: IpcChangeArgs): void => {
        const updateKey = UpdateChannel.updateKey(update.item, update.name, (update as IpcMapChangeArgs).map);
        // console.log(
        //     `${this.constructor.name}.addReceived() [${this.ipc.id}][${updateKey}] =` +
        //     ` ${update['newValue'] ? (update['newValue']['id'] ?? update['newValue']) : update['newValue']}`);
        this.received[updateKey] = update['newValue'];
    }

    send = (channel: string, change: IpcChangeArgsType, persist?: boolean): void => {
        if (!this.sendSubscriber)
            throw new Error(`${this.constructor.name}.send(${channel},${change.item},${change.name},${change.type}): no sendSubscriber`);

        // console.log(
        //     `${this.constructor.name}.send(${this.ipc.id}, ` +
        //     ` @ ${change.item}.${change['map'] ? change['map'] + '.' : ''}.${change.name}, ${change.type}, ${persist}) = ` +
        //     `${change['newValue'] ? (change['newValue']['id'] ?? change['newValue']) : change['newValue']}`);

        this.sendSubscriber.next({ channel, change, persist });
    }

    private sendNow = (channel: string, change: IpcChangeArgsType, persist?: boolean): void => {
        const { item } = change;
        const map = (change as IpcMapChangeArgs).map;
        const updateKey = UpdateChannel.updateKey(item, change.name, map);
        const hasUpdate = updateKey in this.received;
        const update = this.received[updateKey];
        let skipChange = false;

        if (hasUpdate) {
            skipChange = isEqual(update, change['newValue']);

            console.log(
                `${this.constructor.name}.sendNow([${this.ipc.id}]` +
                ` @ ${item}.${map}.${change.name}, ${change.type}, ${persist}) ${skipChange ? 'skip receivd' : 'send newer'} [${updateKey}]`, /* change['newValue'] */
            );
            delete this.received[updateKey];
        }
        if (!skipChange) {
            if (this.ipc.isDestroyed()) {
                console.error(
                    `${this.constructor.name}[${this.ipc.id}].sendNow( ${channel}, ${item}.${map}.${change.name}, ${change.type}, persist=${persist}): isDestroyed`);

                this.onError && this.onError(this);
            } else {
                try {
                    console.log(
                        `${this.constructor.name}[${this.ipc.id}].sendNow( ${channel}, ${item}.${map}.${change.name}, ${change.type}, persist=${persist})= ${change['newValue']}`
                    );
                    
                    this.ipc.send('change', change, persist === true);
                } catch (error) {
                    console.warn(
                        `${this.constructor.name}[${this.ipc.id}].sendNow( ${channel}, ${item}.${map}.${change.name}, ${change.type}, persist=${persist}): ${error}`);

                    this.onError && this.onError(this);
                }
            }
        }
    }
}

