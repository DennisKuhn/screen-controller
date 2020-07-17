import Snackbar from '../../components/Snackbar/Snackbar';
import { useCallback, useState } from 'react';
import React from 'react';
import { AddAlert } from '@material-ui/icons';
import { ErrorObject } from 'ajv';
import { SetupBase } from '../../../Setup/SetupBase';
import { callerAndfName } from '../../../utils/debugging';


const ErrorNotification = ({ item }: { item: SetupBase }): JSX.Element => {
    const [errors, setErrors] = useState(undefined as undefined | ErrorObject[]);

    const close = useCallback((): void => setErrors(undefined), []);

    const handleErrors = (item, errors: ErrorObject[]): void => {
        console.log(`${callerAndfName()}(${item.id}) error`, {item, errors});
        setErrors(errors);
        setTimeout(close, 10000);
    };
    item.on('error', handleErrors);
    return (
        <Snackbar
            place="tr"
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