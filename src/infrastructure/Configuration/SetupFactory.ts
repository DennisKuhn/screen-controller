import { SetupBase } from './SetupBase';
import { SetupBaseInterface, SetupItemId } from './SetupBaseInterface';
import { JSONSchema7 } from 'json-schema';

export interface SetupRegistration<SType extends SetupBase> {
    factory: (config: SetupBaseInterface) => SType;
    schema?: JSONSchema7;
}

const creators = new Map<SetupItemId, SetupRegistration<SetupBase>>();

export function register<S extends SetupBase>(className: string, registration: SetupRegistration<S>): void {
    console.log(`SetupFactory.register: ${className} schema=${registration.schema}`);
    
    creators.set(className, registration);
}

export function create(plain: SetupBaseInterface): SetupBase {
    const creator = creators.get(plain.className);

    if (!creator) throw new Error(`SetupFactory.create: no creator for className=${plain.className}`);

    return creator.factory(plain);
}
