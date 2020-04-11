/**
 * Contains commonly helpers like createAndAppend
 * @module
 */

interface CreateAndAppendOptions {
    className?: string;
    parent?: Element;
    text?: string;
    html?: string;
}
/**
 * Creates an element with tag name, optional attaches it to parent, sets className, sets textContent, sets innerHTML
*/
export default function <K extends keyof HTMLElementTagNameMap>(name: K, options: CreateAndAppendOptions): HTMLElementTagNameMap[K] {
    const element = document.createElement(name);

    if (options) {
        if (options.className) {
            element.classList.add(options.className);
        }
        if (options.parent) {
            options.parent.appendChild(element);
        }
        if (options.text) {
            element.textContent = options.text;
        }
        if (options.html) {
            element.innerHTML = options.html;
        }
    }
    return element;
}

