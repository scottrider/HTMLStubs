// Type definitions for DataGrid
interface DataGridSchemaField {
    type?: string;
    displayName?: string;
    htmlElement?: string;
    htmlType?: string;
    css?: Record<string, string>;
    required?: boolean;
    searchable?: boolean;
}

interface DataGridSchema {
    [fieldName: string]: DataGridSchemaField;
}

interface DataGridEntity {
    schema: DataGridSchema;
    data: Record<string, any>[];
}

interface DataGridSource {
    [entityName: string]: DataGridEntity;
}

// Extend HTMLElement to include our custom properties
interface DataGridElement extends HTMLElement {
    sourceData: DataGridSource;
    entity: string;
    cssClass: string;
    addRow?: string;
}

class DataGrid extends HTMLElement implements DataGridElement {
    private _sourceData: DataGridSource | null = null;

    // Getter and setter for sourceData with proper typing
    set sourceData(data: DataGridSource) {
        this._sourceData = data;
        if (this.isConnected) {
            this.render();
        }
    }
    
    get sourceData(): DataGridSource {
        return this._sourceData || {};
    }

    // Getter and setter for entity
    get entity(): string {
        return this.getAttribute('entity') || 'positions';
    }

    set entity(value: string) {
        this.setAttribute('entity', value);
        if (this.isConnected && this._sourceData) {
            this.render();
        }
    }

    // Getter and setter for cssClass
    get cssClass(): string {
        return this.getAttribute('cssClass') || '';
    }

    set cssClass(value: string) {
        this.setAttribute('cssClass', value);
    }

    // Getter for addRow function name
    get addRow(): string | undefined {
        return this.getAttribute('addRow') || undefined;
    }

    set addRow(value: string | undefined) {
        if (value) {
            this.setAttribute('addRow', value);
        } else {
            this.removeAttribute('addRow');
        }
    }
    
    connectedCallback(): void {
        // If sourceData was set before connection, render now
        if (this._sourceData) {
            this.render();
        }
    }

    // Watch for attribute changes
    static get observedAttributes(): string[] {
        return ['entity', 'cssClass', 'style', 'addRow'];
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        if (this.isConnected && this._sourceData) {
            this.render();
        }
    }
    
    protected render(): void {
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
        const sourceArray: DataGridEntity = this._sourceData[entityName];
        if (!sourceArray) {
            console.error(`DataGrid: entity '${entityName}' not found in source data`);
            this.innerHTML = `<div class="error">Entity '${entityName}' not found</div>`;
            return;
        }

        console.log('DataGrid loaded with data:', sourceArray);
        
        // Get searchable columns from schema
        const keys: string[] = this.getMemberNames(sourceArray.schema)
            .filter((k: string) => sourceArray.schema[k].searchable === true); 
        
        const titles: string = `<div class="header">${keys.map((t: string) => this.addColumn(t, sourceArray.schema[t])).join('')}</div>`;
        
        // Process data rows
        let dataRows = '';
        if (sourceArray.data && Array.isArray(sourceArray.data)) {
            dataRows = sourceArray.data.map((row: Record<string, any>) => {
                if (externalFunctionAddRow && typeof window[externalFunctionAddRow as any] === 'function') {
                    // Call external function if provided
                    (window as any)[externalFunctionAddRow](row);
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

    private getMemberNames(obj: DataGridSchema): string[] {
        return Object.keys(obj);
    }

    private addColumn(value: string, schemaField: DataGridSchemaField): string {
        const displayName = schemaField.displayName || value;
        return `<div class="column header-column">${displayName}</div>`;
    }

    private renderDataRow(row: Record<string, any>, keys: string[]): string {
        const cells = keys.map(key => 
            `<div class="column data-column">${row[key] || ''}</div>`
        ).join('');
        return `<div class="row">${cells}</div>`;
    }
}

// Register the custom element
customElements.define("data-grid", DataGrid);

// Export types for use in other files
export { DataGrid, DataGridSource, DataGridEntity, DataGridSchema, DataGridSchemaField };

// Augment the global HTMLElementTagNameMap for TypeScript
declare global {
    interface HTMLElementTagNameMap {
        'data-grid': DataGrid;
    }
}