class DataGrid extends HTMLElement {
    constructor() {
        super(...arguments);
        this._sourceData = null;
    }
    // Getter and setter for sourceData with proper typing
    set sourceData(data) {
        this._sourceData = data;
        if (this.isConnected) {
            this.render();
        }
    }
    get sourceData() {
        return this._sourceData || {};
    }
    // Getter and setter for entity
    get entity() {
        return this.getAttribute('entity') || 'positions';
    }
    set entity(value) {
        this.setAttribute('entity', value);
        if (this.isConnected && this._sourceData) {
            this.render();
        }
    }
    // Getter and setter for cssClass
    get cssClass() {
        return this.getAttribute('cssClass') || '';
    }
    set cssClass(value) {
        this.setAttribute('cssClass', value);
    }
    // Getter for addRow function name
    get addRow() {
        return this.getAttribute('addRow') || undefined;
    }
    set addRow(value) {
        if (value) {
            this.setAttribute('addRow', value);
        }
        else {
            this.removeAttribute('addRow');
        }
    }
    connectedCallback() {
        // If sourceData was set before connection, render now
        if (this._sourceData) {
            this.render();
        }
    }
    // Watch for attribute changes
    static get observedAttributes() {
        return ['entity', 'cssClass', 'style', 'addRow'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (this.isConnected && this._sourceData) {
            this.render();
        }
    }
    render() {
        const cssClass = this.cssClass;
        const style = this.getAttribute('style') || '';
        const externalFunctionAddRow = this.addRow;
        const entityName = this.entity;
        if (!this._sourceData) {
            console.error('DataGrid: No source data provided');
            this.innerHTML = '<div class="error">No source data provided</div>';
            return;
        }
        // Get the entity data (e.g., positions)
        const sourceArray = this._sourceData[entityName];
        if (!sourceArray) {
            console.error(`DataGrid: entity '${entityName}' not found in source data`);
            this.innerHTML = `<div class="error">Entity '${entityName}' not found</div>`;
            return;
        }
        console.log('DataGrid loaded with data:', sourceArray);
        // Get searchable columns from schema
        const keys = this.getMemberNames(sourceArray.schema)
            .filter((k) => sourceArray.schema[k].searchable === true);
        const titles = `<div class="header">${keys.map((t) => this.addColumn(t, sourceArray.schema[t])).join('')}</div>`;
        // Process data rows
        let dataRows = '';
        if (sourceArray.data && Array.isArray(sourceArray.data)) {
            dataRows = sourceArray.data.map((row) => {
                if (externalFunctionAddRow && typeof window[externalFunctionAddRow] === 'function') {
                    // Call external function if provided
                    window[externalFunctionAddRow](row);
                }
                return this.renderDataRow(row, keys);
            }).join('');
        }
        // Render the grid
        this.innerHTML = `
            <div class="data-grid-container ${cssClass}" style="${style}">
                ${titles}
                <div class="data-rows">${dataRows}</div>
            </div>`;
    }
    getMemberNames(obj) {
        return Object.keys(obj);
    }
    addColumn(value, schemaField) {
        const displayName = schemaField.displayName || value;
        return `<div class="column header-column">${displayName}</div>`;
    }
    renderDataRow(row, keys) {
        const cells = keys.map(key => `<div class="column data-column">${row[key] || ''}</div>`).join('');
        return `<div class="row">${cells}</div>`;
    }
}
// Register the custom element
customElements.define("data-grid", DataGrid);
// Export types for use in other files
export { DataGrid };
