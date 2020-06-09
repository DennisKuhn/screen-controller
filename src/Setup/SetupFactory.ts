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
        console.log(`SetupFactory.register: ${factory.name}${factory.name != className ? ' as ' + className : ''}`);

        factories.set(className, factory);
    }
}

export function create(plain: SetupBaseInterface): SetupBase {
    const factory = factories.get(plain.className);

    if (!factory) throw new Error(`SetupFactory.create: no creator for className=${plain.className}`);

    // console.log(`SetupFactory:create( ${plain.className} - ${plain.id} @ ${plain.parentId} ) creator=${factory.name}`);

    try {
        const setup = new factory( plain );
        return setup;
    } catch (error) {
        console.error(`SetupFactory:create( ${plain.className} - ${plain.id} @ ${plain.parentId} ) caught: ${error}`, error, plain);
        throw error;
    }
}
