/**
 * Contains commonly helpers like createAndAppend
 * @module
 */

/**
 * Creates an element with tag name, optional attaches it to parent, sets className, sets textContent, sets innerHTML
 * @param {keyof HTMLElementTagNameMap} name of tag
 * @param {{parent?: Node, className?: string, text?: string, html?: string}} [options]
 * @returns {HTMLElement}
 */
const createAndAppend = (name, options) => {
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

module.exports = createAndAppend;
