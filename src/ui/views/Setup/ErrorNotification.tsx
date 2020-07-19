import Snackbar from '../../components/Snackbar/Snackbar';
import { useCallback, useState, useEffect, EffectCallback } from 'react';
import React from 'react';
import { AddAlert } from '@material-ui/icons';
import { ErrorObject } from 'ajv';
import { SetupBase } from '../../../Setup/SetupBase';
import { callerAndfName } from '../../../utils/debugging';


const ErrorNotification = ({ item }: { item: SetupBase }): JSX.Element => {
    const [errors, setErrors] = useState(undefined as undefined | ErrorObject[]);

    const close = useCallback((): void => setErrors(undefined), []);

    const closeSoon: EffectCallback = () => {
        console.log(`${callerAndfName()}(${item.id}) closeSoon ${errors === undefined}`);
        if (errors === undefined)
            return undefined;
        
        const timeout = setTimeout(close, 10000);

        return ((): void => clearTimeout(timeout));
    };

    const handleErrors = (item, errors: ErrorObject[]): void => {
        console.log(`${callerAndfName()}(${item.id}) error`, { item, errors });        
        setErrors(errors);
    };

    const connectEvent: EffectCallback = () => {
        console.log(`${callerAndfName()} connect`);
        item.on('error', handleErrors);

        return ((): void => {
            console.log(`${callerAndfName()} disconnect`);
            item.removeListener('error', handleErrors);
        });
    };

    useEffect( connectEvent, [] );
    useEffect( closeSoon, [errors]);        
    
    return (
        <Snackbar
            place="br"
            color="danger"
            icon={AddAlert}
            message={
                errors && errors.map(info => `${info.dataPath} ${info.message}`)
            }
            open={errors !== undefined}
            closeNotification={close}
            close={true}
        />
    );
};

export default ErrorNotification;