
export const fName = (): string => {
    const stackText = (new Error()).stack;
    
    if (stackText) {
        const stack = stackText.split('\n');

        if (stack.length > 2)
            return stack[2].trim().substr('at '.length);
    }
    return 'unknown';
};

export const callerAndfName = (): string => {
    const stackText = (new Error()).stack;

    if (stackText) {
        const stack = stackText.split('\n');

        if (stack.length > 3)
            return stack[3].trim().substr('at '.length) + '->' + stack[2].trim().substr('at '.length);
    }
    return 'unknown';
};

