import { ObservableMap } from 'mobx';
import { Dictionary } from 'lodash';
import { SetupBase } from './SetupBase';
import { SetupBaseInterface, SetupItemId } from './SetupInterface';

class ObservableArrayMap<K, V> extends ObservableMap<K, V> {

    map<O>(mapper: (value: V) => O): O[] {
        const result: O[] = new Array<O>(this.size);
        let i = 0;

        for (const value of this.values()) {
            result[i] = mapper(value);
            i += 1;
        }
        return result;
    }
}

export class ObservableSetupBaseMap<V extends SetupBase> extends ObservableArrayMap<SetupItemId, V | null> {
}

export type SetupBaseInterfaceDictionary<V extends SetupBaseInterface> = Dictionary<V | null>;

