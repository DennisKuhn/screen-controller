import { ObservableMap, IObservableArray } from 'mobx';
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
    mapEntries<O>(mapper: ([K, V]) => O): O[] {
        const result: O[] = new Array<O>(this.size);
        let i = 0;

        for (const entry of this.entries()) {
            result[i] = mapper(entry);
            i += 1;
        }
        return result;
    }
    mapKeys<O>(mapper: (value: K) => O): O[] {
        const result: O[] = new Array<O>(this.size);
        let i = 0;

        for (const key of this.keys()) {
            result[i] = mapper(key);
            i += 1;
        }
        return result;
    }
}

export class ObservableSetupBaseMap<V extends SetupBase> extends ObservableArrayMap<SetupItemId, V | null> {
}

export type SetupBaseInterfaceDictionary<V extends SetupBaseInterface> = Dictionary<V | null>;

export type ObservableArray<T> = IObservableArray<T>;