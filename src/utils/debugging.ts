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

export const checkOrphans = (showFound = false): void => {
    for (const [id, textItem] of Object.entries(localStorage)) {
        const item = JSON.parse(textItem);
        if (item.parentId) {
            const textParent = localStorage.getItem(item.parentId);
            if (textParent == null) {
                console.error(`Loaded ${item.parentId} as null instead of string`);
            } else {
                const parent = JSON.parse(textParent);
                if (parent == undefined) {
                    console.error(`${id} is orphaned parentId=${item.parentId}`, item);
                } else {
                    let found = false;
                    for (const [propertyName, propertyValue] of Object.entries(parent)) {
                        if (propertyValue == null) {
                            console.error(`${parent.id}.${propertyName} == null`);
                        } else if (typeof propertyValue == 'object') {
                            const value = propertyValue as Record<string, any>;

                            if (('id' in value) && (value['id'] == id)) {
                                showFound && console.log(`Found ${id} as ${parent.id}.${propertyName}`);
                                found = true;
                                break;
                            } else if (id in value) {
                                showFound && console.log(`Found ${id} in ${parent.id}.${propertyName}`);
                                found = true;
                            }
                        }
                    }
                    if (!found)
                        console.error(`Can not find ${id} in ${parent.id}`);
                }
            }
        } else {
            console.log(`${id} has no parentId`, item);
        }
    }
};
