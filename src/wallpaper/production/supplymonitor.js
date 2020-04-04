'use strict';

import WallWindow from '../wallwindow/WallWindow';

require('./supplymonitor.css');

const SUPPLY_MONITOR_ID = 'SupplyMonitor';

/**
 * @extends WallWindow
 */
export default class SupplyMonitor extends WallWindow {
    constructor() {
        super('SupplyMonitor');

        this.Create();
    }

    Show() {
        if ( this.enabled ) {
            super.Show();
            this.root.style.display = 'block'; 
        }
    }

    Hide() {
        this.root.style.display = 'none';
        super.Hide();
    }

    Create() {
        this.root = CreateAppend('div', document.body, SUPPLY_MONITOR_ID);
        this.root.style.display = 'none';
        this.root.onclick = e => this.Hide();
        this.table = CreateAppend('table', this.root, SUPPLY_MONITOR_ID + '-Table');
    }

    /**
     * 
     * @param {string} name 
     * @param {number} bufferEntries 
     * @returns {HTMLTableDataCellElement[]}
     */
    createMonitorRow(name, bufferEntries) {
        const statusCells = [];
        const row = CreateAppend('tr', this.table, SUPPLY_MONITOR_ID + '-' + name );
        const nameCell = CreateAppend('td', row, SUPPLY_MONITOR_ID + '-' + name + '-name' );
        nameCell.innerText = name;
        for (let iBuffer=0; iBuffer < bufferEntries; iBuffer++) {
            statusCells.push( CreateAppend('td', row, SUPPLY_MONITOR_ID + '-' + name + '-' + iBuffer, SUPPLY_MONITOR_ID + 'Cell' ) );
        }
        return statusCells;
    }
}