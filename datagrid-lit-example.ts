import { LitElement, html, css, customElement, property } from 'lit';

// Define the data types
interface DataGridSchema {
    [key: string]: {
        searchable: boolean;
        displayName?: string;
        type?: string;
    };
}

interface DataGridData {
    schema: DataGridSchema;
    data: any[];
}

interface DataGridSource {
    [entityName: string]: DataGridData;
}

@customElement('data-grid-lit')
export class DataGridLit extends LitElement {
    // Properties with automatic change detection and type safety
    @property({ type: Object }) 
    source!: DataGridSource;
    
    @property() 
    entity: string = 'positions';
    
    @property() 
    cssClass: string = '';
    
    @property() 
    addRowFunction?: string;

    static styles = css`
        :host {
            display: block;
        }
        .grid-container {
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        .column {
            padding: 8px;
            border-right: 1px solid #eee;
            font-weight: bold;
        }
        .header {
            display: flex;
            background-color: #f5f5f5;
        }
    `;

    render() {
        if (!this.source || !this.source[this.entity]) {
            return html`<div>No data available for entity: ${this.entity}</div>`;
        }

        const entityData = this.source[this.entity];
        const searchableKeys = Object.keys(entityData.schema)
            .filter(key => entityData.schema[key].searchable);

        return html`
            <div class="grid-container ${this.cssClass}">
                <div class="header">
                    ${searchableKeys.map(key => 
                        html`<div class="column">${entityData.schema[key].displayName || key}</div>`
                    )}
                </div>
                <div class="data-rows">
                    ${entityData.data.map(row => this.renderRow(row, searchableKeys))}
                </div>
            </div>
        `;
    }

    private renderRow(row: any, keys: string[]) {
        // Call external function if provided
        if (this.addRowFunction && window[this.addRowFunction as any]) {
            window[this.addRowFunction as any](row);
        }

        return html`
            <div class="row" style="display: flex;">
                ${keys.map(key => html`<div class="column">${row[key] || ''}</div>`)}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'data-grid-lit': DataGridLit;
    }
}