import { LocalChangeArgsType, LocalItemChangeArgsType, LocalMapChangeArgsType, LocalArrayChangeArgsType } from './Controller/Controller';
import { SetupBase } from './SetupBase';


export const getLocalChangeArgsLog = (update: LocalChangeArgsType): string => {
    const { item, type } = update;
    const itemUpdate = (update as LocalItemChangeArgsType).name ? (update as LocalItemChangeArgsType) : undefined;
    const mapUpdate = (update as LocalMapChangeArgsType).map ? (update as LocalMapChangeArgsType) : undefined;
    const arrayUpdate = (update as LocalArrayChangeArgsType).array ? (update as LocalArrayChangeArgsType) : undefined;
    const name = itemUpdate?.name;
    const map = mapUpdate?.map;
    const array = arrayUpdate?.array;
    const newValue = update['newValue'];

    return (
        `(${item.id}.${map ?? array ?? ''}${mapUpdate ? '.' + mapUpdate.name : arrayUpdate ? '[' + arrayUpdate.index + ']' : name} ,${type})` +
        `${newValue !== undefined ? '=' + (newValue instanceof SetupBase ? '[' + newValue.id + '/' + newValue.className + ']' : newValue) : ''}`
    );
};
