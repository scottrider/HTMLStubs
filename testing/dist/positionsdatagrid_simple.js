// Simple PositionsDataGrid that extends DataGrid
import { DataGrid } from './datagrid.js';
class PositionsDataGrid extends DataGrid {
    constructor() {
        super();
        this.entity = 'positions';
    }
    connectedCallback() {
        super.connectedCallback();
        this.render();
    }
    render() {
        if (!this.sourceData || !this.sourceData.positions) {
            console.log('No positions data available');
            return;
        }
        const schema = this.sourceData.positions.schema;
        const data = this.sourceData.positions.data;
        if (!schema || !data) {
            console.log('Invalid data structure');
            return;
        }
        // Get visible field names
        const visibleFields = Object.keys(schema).filter(fieldName => {
            const field = schema[fieldName];
            return field.visible !== false;
        });
        // Create header row with field names
        const headerRow = visibleFields.map(field => `<th>${schema[field].displayName}</th>`).join('');
        // Create data rows for first 20 records
        const dataRows = data.slice(0, 100).map(record => {
            const cells = visibleFields.map(field => `<td>${record[field] || ''}</td>`).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
        // Render the table
        this.innerHTML = `
            <table>
                <thead>
                    <tr>${headerRow}</tr>
                </thead>
                <tbody>
                    ${dataRows}
                </tbody>
            </table>
        `;
        console.log('PositionsDataGrid rendered with', visibleFields.length, 'fields and', Math.min(data.length, 20), 'records');
    }
}
// Register the custom element
customElements.define('positions-data-grid', PositionsDataGrid);
export { PositionsDataGrid };
