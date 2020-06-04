import { SetupBase } from '../../Setup/SetupBase';

/** Descends into object according to properties stack.
 * @example 
 * moveToTarget(
 *     {root: {child: { grandchild: {money: 5} }}},
 *     ['AnyName','root', 'child', 'grandchild', 'money' ] )
 * => [{money:5}, 'money']
 * moveToTarget(
 *     {root: {child: { grandchild: {money: 5} }}},
 *     ['AnyName','root' ] )
 * => [{root: {child: { grandchild: {money: 5} }}}, 'root']
 * @param start object
 * @param properties names stack
 * @returns target object with target property name, use like target[name]
 */
export const moveToTarget = (start: SetupBase, properties: string[]): [SetupBase, string] => {
    let target = start;
    properties.shift();

    while (properties.length > 1) {
        target = target[properties.shift() as string];
    }
    return [target, properties[0]];
};
