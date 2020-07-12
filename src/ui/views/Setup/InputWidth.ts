let inputWidth: undefined | number;

/** Get the width of a standard browser input control */
export const getInputWidth = (): number => {
    if (inputWidth === undefined) {
        const input = document.createElement('input');
        window.document.body.append(input);
        inputWidth = input.getBoundingClientRect().width;
        window.document.body.removeChild(input);
    }
    return inputWidth;
};
