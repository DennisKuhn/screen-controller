'use strict';

import WallWindow from './WallWindow';
import { CreateAppend } from '../utils/utils';

const wmITEM_TITLE_CLASS = 'wmItemTitle'; // Unused
const wmITEM_DESCRIPTION_CLASS = 'wmItemDescription'; // Unused


const wmACTION_ID_PREFIX = 'wmAction-';
const wmICON_CLASS = 'wmIcon';
const wmDISABLED_ICON_CLASS = 'wmIconDisabled';
const wmBUTTON_CLASS = 'wmButton';
const wmICON_WRAPPER_CLASS = 'wmIconWrapper';
const wmSVG_ICON_ID_PREFIX = 'wmSvgIcon-';
const wmSVG_ICON_FILE_PREFIX = 'wm_';
const wmSVG_ICON_FILE_EXTENSION = '.svg';
const wmSVG_ICON_FOLDER = 'wallwindow/icons/';

function addButtonHoldIt(btn, action, start, speedup) {
    let t;
    const originalStart = start;
    var repeat = () => {
        action();
        t = setTimeout(repeat, start);
        start = start / speedup;
        if ( start < 30 ) start = 30;
    };

    btn.addEventListener('mousedown',function(e) {
        // console.log("addButtonHoldIt().mousedown()");
        // e.stopPropagation(); e.preventDefault();
        start = originalStart;
        repeat();
        return false;
    },false);

    btn.addEventListener('mouseup',function(e) {
        // console.log("addButtonHoldIt().mouseup()");
        // e.stopPropagation(); e.preventDefault();
        clearTimeout(t);
        return false;
    },false);

    btn.addEventListener('mouseout',function(e) {
        // console.log("addButtonHoldIt().mouseout()");
        // e.stopPropagation(); e.preventDefault();
        clearTimeout(t);
        return false;
    },false);
}

/**
 * Creates an icon element.
 * @param {string} iconClass use either "clear", "clipboard_prev", "clipboard",
 * "close","delete", 
 * "draw_scribble", "draw_line", "draw_oval", "draw_circle", "draw_rect", "draw_square",
 * "load", "loadsvg","move_down", "move_left", "move_right", "move_up", "next", "play",
 * "rotate_ccw", "rotate_cw", "save", "scale_down", "scale_up"  
 * @param {(e:MouseEvent) => void} cbAction
 * @param {boolean} holdIt call addButtonHoldIt to continuesly click the icon by holding the button down
 */
function createIcon(iconClass, cbAction, parentID, holdIt) {
    const sourceIcon = document.getElementById(wmSVG_ICON_ID_PREFIX + iconClass);

    if (sourceIcon) {
        const newIcon = sourceIcon.cloneNode(true);
        if (newIcon) {
            newIcon.classList.add(wmICON_CLASS);
            newIcon.classList.add(wmICON_CLASS + '-' + iconClass);
            newIcon.id = wmACTION_ID_PREFIX + parentID + '-' + iconClass;
            if (cbAction) {
                if (holdIt) {
                    addButtonHoldIt(newIcon, cbAction, 300, 1.1 );
                } else {
                    newIcon.onclick = cbAction;
                }
            }
            return newIcon;
        } else {
            console.error('wallmenu.createIcon(' + iconClass + '): Problem cloning');
        }
    } else {
        console.error('wallmenu.createIcon(' + iconClass + '): Problem finding');
    }
}


const wmCONTENT_CLASS = 'wmContent';
const wmCONTENT_ID_POSTIFX = '-wmContent';
const wmWRAPPER_CLASS = 'wmWrapper';
const wmWRAPPER_ID_POSTFIX = '-wmWrapper';

const wmLOAD_STATES = {
    NULL: 'NULL',
    LOADING: 'LOADING',
    LOADED: 'LOADED'
};

/**
 * @extends WallWindow
 */
export default class Wallmenu extends WallWindow {
    /**
     * Starts icon loading asynchronous, once loaded LoadedAllIcons calls cbOnLoaded.
     * @param {string} name 
     * @param {HtmlElement} parent
     */
    constructor(name, parent) {
        super(name, parent);

        this.wrapperElement = null;
        this.contentElement = null;        
        this.enabled = true;
        this.hasLoaded = false;
        this.createCallLoaded = false;
        Wallmenu.registerInstance(this);
    }

    /**
     * 
     * @param {Wallmenu} instance 
     */
    static registerInstance(instance) {
        switch (Wallmenu.LoadingState) {
            case wmLOAD_STATES.NULL:
                // console.log("Wallmenu["+name+"].constructor[wmLOAD_STATES._NULL]");
                Wallmenu.LoadingState = wmLOAD_STATES.LOADING;
                Wallmenu.LoadedCallbacks.push( () => {
                    instance.loaded(); 
                } );
                Wallmenu.loadAllIcons();
                break;
            case wmLOAD_STATES.LOADING:
                // console.log("Wallmenu["+name+"].constructor[wmLOAD_STATES.LOADING]");
                Wallmenu.LoadedCallbacks.push(() => {
                    instance.loaded(); 
                });
                break;
            case wmLOAD_STATES.LOADED:
                // console.warn("Wallmenu["+ instance.name+"].constructor[wmLOAD_STATES.LOADED] set timeout(loaded, 1)");
                setTimeout( () => instance.loaded(), 1 );
                break;
            default:
                console.error('Wallmenu.constructor(' + name + ', cbOnLoaded) UNKOWN STATE wmLoadingState=' + Wallmenu.LoadingState);
        }
    }

    Create() {
        this.wrapperElement = document.createElement('div');
        this.wrapperElement.id = this.name + wmWRAPPER_ID_POSTFIX;
        this.wrapperElement.classList.add(wmWRAPPER_CLASS);
        this.parent.appendChild(this.wrapperElement);

        this.contentElement = document.createElement('div');
        this.contentElement.id = this.name + wmCONTENT_ID_POSTIFX;
        this.contentElement.classList.add(wmCONTENT_CLASS);
        this.wrapperElement.appendChild(this.contentElement);
    }

    /**
     * 
     * @param {boolean} enable 
     */
    setEnabled(enable) {
        const enableChanged = enable != this.enabled;

        super.setEnabled(enable);
        // console.log("Wallmenu[" + this.name +"].setEnabled(" + enable + ") enableChanged=" + enableChanged + " enabled=" + this.enabled);
        if (enableChanged) {
            if (this.enabled) {

            } else {
                if (this.shown) {
                    this.Hide();
                }
            }
        }
    }

    /**
     * Calls onLoaded, implemented by deriving class. Do not overwrite loaded()!
     */
    loaded() {
        // console.log("Wallmenu[" + this.constructor.name + ", " + this.name + "].loaded" );
        this.onLoaded();
        this.hasLoaded = true;
    }

    /**
     * Should be overwriten by deriving class to construct the menu.
     */
    onLoaded() {
        console.error('Wallmenu[' + this.constructor.name + ', ' + this.name + '] no onLoaded !!' );
    }

    /**
     * Adds a group to the menu, if the group name exists, the group is replaced.
     * @param {WallMenuGroup} group 
     */
    addGroup(group) {
        const newGroup = group.getNode();
        const oldGroup = document.getElementById(newGroup.id + wmOLD_GROUP_APPENDIX);

        if (oldGroup) {
            // console.log("Wallmenu.addGroup(" + newGroup.id + ") Found Old Group: " + oldGroup.id);
            this.contentElement.replaceChild( newGroup, oldGroup );
        } else {
            this.contentElement.appendChild( newGroup );
        }
    }


    updateItemTitle(groupID, itemID, newText) {
        // console.log("Wallmenu.updateItemDescription(" + groupID + ", " + itemID + ", " + newText + " )" + this.contentElement);

        const updateGroup = this.contentElement.querySelector('[id=' + groupID + ']');

        if (updateGroup) {
            const updateItem = updateGroup.querySelector('[id=' + itemID + ']');
            if (updateItem) {            
                const updateTitle = updateItem.querySelector('[class~=' + wmITEM_TITLE_CLASS + ']');
                if (updateTitle) {
                    updateTitle.innerText = newText;
                    updateTitle.style.display = newText ? 'block' : 'none';
                } else console.error('Wallmenu.updateItemDescription(' + groupID + ', ' + itemID + ', ' + newText + ' ) no title');
            } else console.error('Wallmenu.updateItemDescription(' + groupID + ', ' + itemID + ', ' + newText + ' ) no item');
        } else console.error('Wallmenu.updateItemDescription(' + groupID + ', ' + itemID + ', ' + newText + ' ) no group');
    }

    updateItemActionEnabled(groupID, itemID, action, enabled) {
        // console.log("Wallmenu.updateItemActionEnabled(" + groupID + ", " + itemID + ", " + action + ", " + enabled + " ) " + this.contentElement);

        const updateGroup = this.contentElement.querySelector('[id=' + groupID + ']');

        if (updateGroup) {
            const updateItem = updateGroup.querySelector('[id=' + itemID + ']');
            if (updateItem) {            
                const updateAction = updateItem.querySelector('[id=' + wmACTION_ID_PREFIX + itemID + '-' + action + ']');
                if (updateAction) {
                    if (enabled) {
                        updateAction.classList.remove(wmDISABLED_ICON_CLASS);
                    } else {
                        updateAction.classList.add(wmDISABLED_ICON_CLASS);
                    }
                } else console.error('Wallmenu.updateItemActionEnabled(' + groupID + ', ' + itemID + ', ' + action + ' ) no action');
            } else console.error('Wallmenu.updateItemActionEnabled(' + groupID + ', ' + itemID + ', ' + action + ' ) no item');
        } else console.error('Wallmenu.updateItemActionEnabled(' + groupID + ', ' + itemID + ', ' + action + ' ) no group');
    }

    /**
     * Pre loads all SVG Icons defined in AllIcons.
     */
    static loadAllIcons() {
        Wallmenu.AllIcons.forEach(element => {
            Wallmenu.loadIcon(element);
        });
    }

    /**
     * Loads an SVG icon into the DOM using XMLHttpRequest, to be referenced by menu items.
     * @param {string} iconClass e.g. clear
     */
    static loadIcon(iconClass) {
        const xhr = new XMLHttpRequest();
        xhr.open('get', wmSVG_ICON_FOLDER + wmSVG_ICON_FILE_PREFIX + iconClass + wmSVG_ICON_FILE_EXTENSION, true);
        xhr.onreadystatechange = function(ev) {
            if (xhr.readyState != 4) return;
            if (xhr.responseXML) {
                let svg = xhr.responseXML.documentElement;
                svg = document.importNode(svg,true); // surprisingly optional in these browsers
                svg.id = wmSVG_ICON_ID_PREFIX + iconClass;            
                document.body.appendChild(svg);

                const loadedIcons = document.querySelectorAll('[id^=' + wmSVG_ICON_ID_PREFIX + ']').length;
                if ( loadedIcons == Wallmenu.AllIcons.length) {
                    // console.log("loadIcon(" + iconClass + ") last icon loaded " + loadedIcons + "/" + Wallmenu.AllIcons.length);
                    Wallmenu.LoadedAllIcons();
                } else if ( loadedIcons > Wallmenu.AllIcons.length) {
                    console.error('loadIcon(' + iconClass + ') LOADED TOO MANY ICONS ' + loadedIcons + '/' + Wallmenu.AllIcons.length);
                }
            } else {
                console.error('wallmenu: loadIcon(' + iconClass + ') received empty response');
            }
        };
        xhr.send();
    }

    static LoadedAllIcons() {
        // console.log("Wallmenu.LoadedAllIcons wmOnLoadedCallbacks=" + Wallmenu.LoadedCallbacks.length);
        Wallmenu.LoadingState = wmLOAD_STATES.LOADED;
        Wallmenu.LoadedCallbacks.forEach( cbOnLoaded => {
            cbOnLoaded();
        } );
    }
}

Wallmenu.LoadingState = wmLOAD_STATES.NULL;
Wallmenu.LoadedCallbacks = [];
/**
 * Contains all icons, ADD NEW ICONS HERE !
 * The icon SVG file must be named wm_<IconName>.svg
 */
Wallmenu.AllIcons = [
    'clear', 
    'clipboard_code', 
    'clipboard_prev', 
    'clipboard_url', 
    'clipboard_url_prev', 
    'clipboard',
    'close',
    'connection_facebook',
    'delete',
    'display_lock',
    'draw_scribble',
    'draw_line',
    'draw_oval',
    'draw_circle',
    'draw_rect',
    'draw_square',
    'filter_states',
    'load',
    'loadsvg',
    'move_down',
    'move_left',
    'move_right',
    'move_up',
    'next',
    'play_pause',
    'rotate_ccw',
    'rotate_cw',
    'save',
    'scale_down',
    'scale_up',
    'supply'
];


const wmPOPMENU_NAME_PREFIX = 'PopupMenu-';

/**
 * @extends Wallmenu
 */
export class PopupMenu extends Wallmenu {
    /**
     * 
     * @param {string} name 
     */
    constructor(name) {
        super( wmPOPMENU_NAME_PREFIX + name);

        this.Create();
    }

    Create() {
        super.Create();
    }

    Show() {
        super.Show();
        this.wrapperElement.style.display = 'block'; 
    }

    Hide() {
        this.wrapperElement.style.display = 'none';
        super.Hide();
    }
}

const wmOLD_GROUP_APPENDIX = '-old';

/**
 * 
 */
class WallMenuGroup {
    /**
     * IF a group @groupName exist, this constructor will replace it.
     * @param {string} groupName 
     * @param {string} className 
     */
    constructor(groupName, className) {
        this.name = groupName;
        const oldGroup = document.getElementById(this.name);
        if (oldGroup) {
            // console.log("WallMenuGroup(" + this.name + "): Found Old Group: " + oldGroup.id);
            oldGroup.id = oldGroup.id + wmOLD_GROUP_APPENDIX;
        }
        this.containerElement = document.createElement('div');
        this.containerElement.className = className;
        this.containerElement.id = this.name;
    }

    getNode() {
        return this.containerElement;
    }

    /**
     * 
     * @param {string} id 
     */
    addProgressButton(id) {
        const newButton = new ProgressButton(this.containerElement, id);
        return newButton;
    }
}

/**
 * 
 */
class WallButton {
    constructor() {
        this.root = null;
    }

    Show() {
        this.root.style.visibility = 'visible';
    }
    Hide() {
        this.root.style.visibility = 'hidden';
    }
}

/**
 * @extends WallButton
 */
class WrappedButton extends WallButton {
    /**
     * 
     * @param {HTMLElement} container 
     */
    constructor(container) {
        super();
        this.root = CreateAppend('span', container, /*id=*/ null ); // div ?
        this.root.classList.add( wmBUTTON_CLASS );
        this.root.classList.add( wmICON_WRAPPER_CLASS );
    }

    /**
     * @returns {HTMLElement}
     */
    get rootElement() {
        return this.root; 
    }

}

const wbPROGRESS_WRAPPER_CLASS = 'wbProgressWrapper';
const wbPROGRESS_CLASS = 'wbProgress';

/**
 * @extends WrappedButton
 */
class ProgressButton extends WrappedButton {
    /**
     * 
     * @param {HTMLElement} container 
     * @param {string} id
     */
    constructor(container, id) {
        super(container);

        this.root.classList.add(wbPROGRESS_WRAPPER_CLASS);
        this.progress = CreateAppend('div', this.root, id );		
        this.progress.classList.add(wbPROGRESS_CLASS);
    }

    /**
     * Sets relative progress 0-1.
     * @param {number} percentage percentage 0.1 = 10%
     */
    setProgress(percentage) {
        // console.log("ProgressButton.setProgress(" + percentage + ")");
        this.progress.style.width = Math.round( 100 * percentage ) + '%';
    }

    setColor(progress, remaining) {
        this.root.style.backgroundColor = remaining;
        this.progress.style.backgroundColor = progress;
    }
}

/**
 * @extends WallButton
 */
class IconButton extends WallButton {
    constructor(container, iconClass, cbAction, itemID, holdIt) {
        super();

        this.itemID = itemID;
        this.cbAction = cbAction;

        this.root = createIcon(iconClass, e => this.onClick(e), this.itemID, holdIt);

        container.appendChild(this.root);
    }

    onClick(e) {
        if (this.cbAction) {
            this.cbAction(this.itemID);
        } else {
            console.error('IconButton[' + this.itemID + '] no onClick cbAction !!');
        }
    }
}

/**
 *
 * @extends WallButton
 */
class ImageButton extends WallButton {
    constructor(container, imageUrl, cbAction, itemID, holdIt) {
        super();

        this.itemID = itemID;
        this.cbAction = cbAction;

        this.root = document.createElement('img');
        this.root.src = imageUrl;
        this.root.classList.add(wmICON_CLASS);
        this.root.id = wmACTION_ID_PREFIX + '-' + itemID;

        if (cbAction) {
            if (holdIt) {
                addButtonHoldIt(this.root, cbAction, 300, 1.1 );
            } else {
                this.root.onclick = cbAction;
            }
        }
    
        container.appendChild(this.root);
    }

    onClick(e) {
        if (this.cbAction) {
            this.cbAction(this.itemID);
        } else {
            console.error('ImageButton[' + this.itemID + '] no onClick cbAction !!');
        }
    }
}

const wb_STATE_CLASS_PREFIX = 'wbState';
const wb_LAST_STATE_CLASS = 'wbStateLast';

/**
 * @extends WrappedButton
 */
class StateButton extends WrappedButton {

    /**
     * 
     * @param {*} container 
     * @param {string} iconClass 
     * @param {newstate => void} cbAction 
     * @param {number} statesCount 
     * @param {number} initialState 
     */
    constructor(container, iconClass, cbAction, statesCount, initialState) {
        super(container);

        this.statesCount = statesCount;
        this.state = initialState;

        this.states = [];
        for (let iState=0; iState < statesCount; iState++) {
            this.states[iState] = wb_STATE_CLASS_PREFIX + iState;
        }
        this.states.push(wb_LAST_STATE_CLASS);
        this.onStateChanged = cbAction;

        this.button = createIcon( 
            iconClass, 
            e => this.nextState(),
            /* parentID=*/ null,
            /* holdIt=*/ false
        );

        this.setStateClasses();
        
        this.root.appendChild(this.button);
    }

    setStateClasses() {
        this.button.classList.add(wb_STATE_CLASS_PREFIX + this.state);
        if (this.state == (this.statesCount - 1)) {
            this.button.classList.add(wb_LAST_STATE_CLASS);
        }
    }

    /**
     * Selects the state of the button
     * @param {number} newState number 0-(n-1) as used in the SVG
     */
    setState(newState) {
        this.button.classList.remove( ... this.states);
        this.state = newState;

        this.setStateClasses();

        if (this.onStateChanged) {
            this.onStateChanged(this.state);
        } else {
            console.error( 'StateButton.setState(' + newState + ') no onStateChanged');
        }
    }

    nextState() {
        if (this.state < (this.statesCount - 1)) {
            this.setState(this.state + 1);
        } else {
            this.setState(0);
        }
    }
}

const wmBUTTON_LIST_CLASS = 'wmButtonList';

/**
 * List of single buttons
 * @extends WallMenuGroup
 */
export class WallMenuButtonList extends WallMenuGroup {
    /**
     * 
     * @param {string} name 
     */
    constructor(name) {
        super(name, wmBUTTON_LIST_CLASS);
    }

    /**
     * Adds a button to the list.
     * @param {(e:MouseEvent) => void} cbAction
     * @param {string} iconClass 
     * @param {boolean} holdIt 
     * @param {boolean} fileLoadButton =true if creating a button to choose a local file
     * @returns {HTMLSpanElement}
     */
    addSubItem(cbAction, iconClass, holdIt, fileLoadButton) {       
        const newClickWrap = document.createElement('span');
        let newFileButton = null;

        newClickWrap.className = wmBUTTON_CLASS + ' ' + wmICON_WRAPPER_CLASS;

        if (fileLoadButton) {
            newFileButton = CreateAppend( 'input', newClickWrap, null, iconClass);
            newFileButton.setAttribute('type', 'file');
            newFileButton.setAttribute('accept', '.svg');
            newFileButton.addEventListener('change', cbAction );
        } else if (iconClass) {
            const newIcon = createIcon(iconClass, cbAction, this.containerElement.id, holdIt);

            newClickWrap.appendChild(newIcon);
        }

        this.containerElement.appendChild(newClickWrap);
        return newClickWrap;
    }

    /**
     * 
     * @param {string} id 
     */
    addProgressButton(id) {
        const newButton = new ProgressButton(this.containerElement, id);
        return newButton;
    }

    /**
     * 
     * @param {(newState: number) => void} cbAction 
     * @param {string} iconClass 
     * @param {number} statesCount 
     * @param {number} initialState 
     */
    addStateButton(cbAction, iconClass, statesCount, initialState) {
        const newButton = new StateButton(this.containerElement, iconClass, cbAction, statesCount, initialState);
        return newButton;
    }

    /**
     * 
     * @param {() => void} cbAction 
     * @param {string} imageUrl 
     * @param {string} itemID 
     * @param {boolean} holdIt 
     * @returns {ImageButton}
     */
    addImageButton(cbAction, imageUrl, itemID, holdIt) {
        const newButton = new ImageButton(this.containerElement, imageUrl, cbAction, itemID, holdIt);
        return newButton;
    }
}

const wmTEXT_LIST_CLASS = 'wmTextList';
const wmTEXT_LIST_ITEM_CLASS = 'wmTextListItem';
/**
 * @extends WallMenuGroup
 */
export class WallMenuTextList extends WallMenuGroup {
    /**
     * 
     * @param {string} name 
     */
    constructor(name) {
        super(name, wmTEXT_LIST_CLASS);
    }

    /**
     * 
     * @param { () => void } cbAction 
     * @param {string} text to be displayed
     * @returns {HTMLDivElement} the inner element used to display the text
     */
    addSubItem(cbAction, text) {
        const newText = document.createElement('div');
        newText.className = wmTEXT_LIST_ITEM_CLASS;
        if (cbAction) {
            newText.onclick = cbAction;
        }

        // newText.appendChild(document.createTextNode(text));
        newText.innerHTML = text;

        this.containerElement.appendChild(newText);

        return newText;
    }
}

const wmRADIO_LIST_CLASS = 'wmRadioList';
const wmRADIO_CONTAINER_CLASS = 'wmRadioContainer';
const wmRADIO_CLASS = 'wmRadio';

/**
 * @extends WallMenuGroup
 */
export class WallMenuRadioList extends WallMenuGroup {
    constructor(name) {
        super(name, wmRADIO_LIST_CLASS);
    }

    addSubItem( text, cbAction, isDefault, iconClass, value  ) {
        const radioContainer = document.createElement('label');
        radioContainer.className = wmRADIO_CONTAINER_CLASS;

        const newRadio = document.createElement('input');
        newRadio.setAttribute('type', 'radio');
        newRadio.setAttribute('name', this.name);
        if (cbAction) {
            newRadio.onclick = cbAction;
        }

        if (value) {
            newRadio.setAttribute('value', value);
        }
        if (isDefault) {
            newRadio.setAttribute( 'checked', 'checked');
        }
        newRadio.className = wmRADIO_CLASS;

        radioContainer.appendChild( newRadio);
        if (text) {
            if (iconClass) {
                radioContainer.appendChild( document.createTextNode(text));
            } else {
                const newText = CreateAppend('span', radioContainer, null, wmICON_CLASS);
                newText.appendChild(document.createTextNode(text));
            }
        }
        if (iconClass) {
            radioContainer.appendChild(createIcon(iconClass, null /* cbAction */, this.containerElement.id, false));
        }

        this.containerElement.appendChild(radioContainer);
    }

    /**
     * Get value of selected radio.
     */
    getValue() {
        return this.containerElement.querySelector('input:checked').value;
    }
}

/**
 * List item with buttons on the left and right.
 * A title and description in between.
 */
class WallMenuListItem {
    constructor( container, itemID, text, cbAction, iconClass, holdIt, cbAction2, iconClass2, holdIt2, cbAction3, iconClass3, holdIt3  ) {
        this.root = document.createElement('div');

        this.root.className = wmLIST_ITEM_CLASS;

        if (iconClass) {
            this.mainAction = new IconButton(this.root, iconClass, cbAction, itemID, holdIt);
        }

        this.textContainer = document.createElement('span');
        this.textContainer.className = wmLIST_ITEM_TEXT_CONTAINER_CLASS;

        this.titleDiv = document.createElement('span');
        this.titleDiv.className = wmLIST_ITEM_TITLE_CLASS + ' ' + wmITEM_TITLE_CLASS;

        if (text) {
            this.titleDiv.innerText = text;
        } else {
            this.titleDiv.style.display = 'none';
        }
        this.textContainer.appendChild( this.titleDiv );

        this.descDiv = document.createElement('span');
        this.descDiv.className = wmLIST_ITEM_DESCRIPTION + ' ' + wmITEM_DESCRIPTION_CLASS;
        this.descDiv.style.display = 'none';

        this.textContainer.appendChild( this.descDiv );

        this.root.appendChild( this.textContainer );

        if ( cbAction2 && iconClass2 ) {
            this.secondAction = new IconButton(this.root, iconClass2, cbAction2, itemID, holdIt2);
        }

        if ( cbAction3 && iconClass3 ) {
            this.thirdAction = new IconButton(this.root, iconClass3, cbAction3, itemID, holdIt3);
        }
        container.appendChild( this.root);
    }

    /**
     * 
     * @param {string} text
     */
    updateTitle(text) {
        this.titleDiv.innerText = text;
    }

    /**
     * 
     * @param {string} text
     */
    updateDescription(text) {
        this.descDiv.innerText = text;
        this.descDiv.style.display = text ? 'block' : 'none';
    }

    /**
     * 
     * @param {number} actionIndex
     * @param {boolean} enabled
     */
    enableAction(actionIndex, enabled) {

        const action = actionIndex == 0 ? this.mainAction : actionIndex == 1 ? this.secondAction : this.thirdAction;

        if (enabled) {
            action.root.classList.remove(wmDISABLED_ICON_CLASS);
        } else {
            action.root.classList.add(wmDISABLED_ICON_CLASS);
        }
    }

}

const wmLIST_CLASS = 'wmList';
const wmLIST_ITEM_CLASS = 'wmListItem';
const wmLIST_ITEM_TEXT_CONTAINER_CLASS = 'wmListItemTextContainer';
const wmLIST_ITEM_TITLE_CLASS = 'wmListItemTitle';
const wmLIST_ITEM_DESCRIPTION = 'wmListItemDescription';

/**
 * List of items with two buttons and text in between.
 * @extends WallMenuGroup
 */
export class WallMenuList extends WallMenuGroup {
    /**
     * 
     * @param {string} name 
     */
    constructor(name) {
        super(name, wmLIST_CLASS);
    }

    /**
     * 
     * @param {string} itemID 
     * @param {string} text 
     * @param { () => void} cbAction 
     * @param {string} iconClass 
     * @param {boolean} holdIt 
     * @param {() => void} cbAction2 
     * @param {string} iconClass2 
     * @param {boolean} holdIt2 
     * @param {() => void} cbAction3 
     * @param {string} iconClass3 
     * @param {boolean} holdIt3
     * @returns {WallMenuListItem}
     */
    addSubItem( itemID, text, cbAction, iconClass, holdIt, cbAction2, iconClass2, holdIt2, cbAction3, iconClass3, holdIt3  ) {
        return new WallMenuListItem(this.containerElement, itemID, text, cbAction, iconClass, holdIt, cbAction2, iconClass2, holdIt2, cbAction3, iconClass3, holdIt3  );
    }
}

