import { SetupBase, SetupConstructor } from './SetupBase';
import { SetupBaseInterface, SetupItemId } from './SetupBaseInterface';

const factories = new Map<SetupItemId, SetupConstructor<SetupBase>>();

export function register<S extends SetupBase>(factory: SetupConstructor<S>): void {

    const className = factory.name;

    if (factories.has( className )) {
        // console.warn(`SetupFactory.register: already registered ${className}`, factories.get(className), factory);
    } else {
        console.log(`SetupFactory.register: ${className}`);

        factories.set(className, factory);
    }
}

export function create(plain: SetupBaseInterface): SetupBase {
    const creator = factories.get(plain.className);

    if (!creator) throw new Error(`SetupFactory.create: no creator for className=${plain.className}`);

    return new creator(plain);
//    return creator.factory(plain);
}
