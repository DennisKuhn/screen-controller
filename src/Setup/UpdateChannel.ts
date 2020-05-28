import { IpcWindow, IpcChangeArgs, IpcMapChangeArgs, IpcChangeArgsType } from './IpcInterface';
import { isEqual } from 'lodash';
import { SetupBase } from './SetupBase';
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

    constructor(private ipc: IpcWindow) {
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



    static updateKey = (itemID: string, name: string, map?: string): string => `${itemID}.${map ? map + '.' : ''}${name}`;

    addReceived = (update: IpcChangeArgs): void => {
        const updateKey = UpdateChannel.updateKey(update.item, update.name, (update as IpcMapChangeArgs).map);
        console.log(`${this.constructor.name}.addReceived() [${this.ipc.id}][${updateKey}] = ${update['newValue'] ? (update['newValue']['id'] ?? update['newValue']) : update['newValue']}` );
        this.received[updateKey] = update['newValue'];
    }

    send = (channel: string, change: IpcChangeArgsType, persist?: boolean): void => {
        if (!this.sendSubscriber)
            throw new Error(`${this.constructor.name}.send(${channel},${change.item},${change.name},${change.type}): no sendSubscriber`);

        console.log(
            `${this.constructor.name}.send(${this.ipc.id}, ` +
            ` @ ${change.item}.${change['map'] ? change['map'] + '.' : ''}.${change.name}, ${change.type}, ${persist}) = ${change['newValue'] ? (change['newValue']['id'] ?? change['newValue']) : change['newValue']}`);

        this.sendSubscriber.next({ channel, change, persist });
    }

    private sendNow = (channel: string, change: IpcChangeArgsType, persist?: boolean): void => {
        const { item } = change;
        const map = (change as IpcMapChangeArgs).map;
        const updateKey = UpdateChannel.updateKey(item, change.name, map);
        const hasUpdate = updateKey in this.received;
        const update = this.received[updateKey];
        let skipChange = false;

        // console.log(
        //     `${this.constructor.name}.onChangeItemChanged([${listener.senderId}, ${listener.itemId}, ${listener.depth}]` +
        //     ` @ ${item.id}.${map}.${change.name}, ${change.type}, ${persist}) = ${change['newValue']}`);

        if (hasUpdate) {
            skipChange = isEqual(update, change['newValue']);

            if (skipChange)
                console.log(
                    `${this.constructor.name}.sendNow([${this.ipc.id}]` +
                    ` @ ${item}.${map}.${change.name}, ${change.type}, ${persist}) skip received [${updateKey}]`, /* change['newValue'] */
                );
            else
                console.log(
                    `${this.constructor.name}.sendNow([${this.ipc.id}]` +
                    ` @ ${item}.${map}.${change.name}, ${change.type}, ${persist}) send newer [${updateKey}]`/*, update, change['newValue'] */
                );

            delete this.received[updateKey];
        } else
            console.log(
                `${this.constructor.name}.sendNow([${this.ipc.id}]` +
                ` @ ${item}.${map}.${change.name}, ${change.type}, ${persist}) send `, /* change['newValue'] */
            );

        if (!skipChange)
            this.ipc.send('change', change, persist === true);
    }
}

