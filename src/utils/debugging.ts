const stripName = (fullCaller: string): string => fullCaller.trim().substr('at '.length).replace(/\s\(.*/, '');

export const fName = (): string => {
    const stackText = (new Error()).stack;

    if (stackText) {
        const stack = stackText.split('\n');

        if (stack.length > 2)
            return stripName(stack[2]);
    }
    return 'unknown';
};

export const caller = (): string => {
    const stackText = (new Error()).stack;

    if (stackText) {
        const stack = stackText.split('\n');

        if (stack.length > 3)
            return stripName(stack[3]);
    }
    return 'unknown';
};


export const callerAndfName = (): string => {
    const stackText = (new Error()).stack;

    if (stackText) {
        const stack = stackText.split('\n');

        if (stack.length > 3)
            return stripName(stack[3]) + ' -> ' + stripName(stack[2]);
        else if (stack.length > 2)
            return 'unkown' + ' -> ' + stripName(stack[2]);
    }
    return 'unknown';
};

export const checkOrphans = (showFound = false): void => {
    for (const [id, textItem] of Object.entries(localStorage)) {
        const item = JSON.parse(textItem);
        if (item.parentId) {
            const textParent = localStorage.getItem(item.parentId);
            if (textParent == null) {
                console.warn(`${id} is orphaned parentId=${item.parentId}`);
            } else {
                const parent = JSON.parse(textParent);
                if (parent == undefined) {
                    console.error(`${id}'s parent ${item.parentId} can't be parsed: ${textParent}`, {item, textParent});
                } else {
                    let found = false;
                    for (const [propertyName, propertyValue] of Object.entries(parent)) {
                        if (propertyValue == null) {
                            console.error(`${parent.id}.${propertyName} == null`);
                        } else if (typeof propertyValue == 'object') {
                            const value = propertyValue as Record<string, any>;

                            if (('id' in value) && (value['id'] == id)) {
                                showFound && console.debug(`Found ${id} as ${parent.id}.${propertyName}`);
                                found = true;
                                break;
                            } else if (id in value) {
                                showFound && console.debug(`Found ${id} in ${parent.id}.${propertyName}`);
                                found = true;
                            }
                        }
                    }
                    if (!found)
                        console.error(`Can not find ${id} in ${parent.id}`);
                }
            }
        } else if (id.startsWith('PluginSchema-')) {
            showFound && console.debug(`Found ${id}`);
        } else {
            console.log(`${id} has no parentId, nor startsWith('PluginSchema-')`, item);
        }
    }
};
