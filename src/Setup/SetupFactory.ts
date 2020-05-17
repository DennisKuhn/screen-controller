import { SetupConstructor, SetupBase } from './SetupBase';
import { SetupBaseInterface, SetupItemId } from './SetupInterface';

const factories = new Map<SetupItemId, SetupConstructor<SetupBase>>();

/**
 * 
 * @param factory Class to be constructed
 * @param className if not defined factory.name is used. className should be used for wrapper classes instanciated with different configuration
 */
export function register<S extends SetupBase>(factory: SetupConstructor<S>, className?: string): void {
    if (className && className == factory.name)
        throw new Error(`SetupFactory.register: className=${className} == factory.name. Only specify className for a wrapper classes instanciated under different names`);

    className = className ?? factory.name;

    if (factories.has( className )) {
        // console.warn(`SetupFactory.register: already registered ${className}`, factories.get(className), factory);
    } else {
        console.log(`SetupFactory.register: ${factory.name} as ${className}`);

        factories.set(className, factory);
    }
}

export function create(plain: SetupBaseInterface): SetupBase {
    const creator = factories.get(plain.className);

    if (!creator) throw new Error(`SetupFactory.create: no creator for className=${plain.className}`);

    return new creator(plain);
//    return creator.factory(plain);
}
