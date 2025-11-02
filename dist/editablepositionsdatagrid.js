// EditablePositionsDataGrid - A control that supports editing based on schema values
import { DataGrid } from './datagrid.js';
class EditablePositionsDataGrid extends DataGrid {
    constructor() {
        super();
        this._editMode = 'readonly';
        this._editingRowIndex = -1;
        this._originalData = null;
        this.entity = 'positions';
    }
    connectedCallback() {
        super.connectedCallback();
        this.render();
    }
    get editMode() {
        return this._editMode;
    }
    set editMode(value) {
        this._editMode = value;
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
        // Create header row with field names and edit controls
        const headerRow = this.createHeaderRow(visibleFields, schema);
        // Create data rows with edit capabilities
        const dataRows = this.createDataRows(data.slice(0, 100), visibleFields, schema);
        // Render the table
        this.innerHTML = `
            <style>
                ${this.getTableStyles()}
            </style>
            <div class="editable-grid-container">
                ${this.createToolbar()}
                <table class="editable-grid">
                    <thead>
                        <tr>${headerRow}</tr>
                    </thead>
                    <tbody>
                        ${dataRows}
                    </tbody>
                </table>
            </div>
        `;
        this.attachEventListeners();
        console.log('EditablePositionsDataGrid rendered with', visibleFields.length, 'fields and', Math.min(data.length, 100), 'records');
    }
    createHeaderRow(visibleFields, schema) {
        return visibleFields.map(field => {
            const fieldSchema = schema[field];
            const displayName = fieldSchema.displayName || field;
            return `<th data-field="${field}">${displayName}</th>`;
        }).join('');
    }
    createDataRows(data, visibleFields, schema) {
        return data.map((record, rowIndex) => {
            const isEditing = this._editingRowIndex === rowIndex;
            const cells = visibleFields.map(field => {
                return this.createCell(record, field, schema[field], isEditing, rowIndex);
            }).join('');
            const rowClass = isEditing ? 'editing-row' : '';
            const actionCell = this.createActionCell(rowIndex, isEditing);
            return `<tr class="${rowClass}" data-row-index="${rowIndex}">${cells}${actionCell}</tr>`;
        }).join('');
    }
    createCell(record, field, fieldSchema, isEditing, rowIndex) {
        const value = record[field] || '';
        const editableAttr = this.getEditableAttribute(fieldSchema);
        if (isEditing && editableAttr === 'edit') {
            return this.createEditableCell(field, value, fieldSchema, rowIndex);
        }
        else {
            const cellClass = this.getCellClass(editableAttr);
            return `<td class="${cellClass}" data-field="${field}">${value}</td>`;
        }
    }
    createEditableCell(field, value, fieldSchema, rowIndex) {
        const inputType = this.getInputType(fieldSchema);
        const required = fieldSchema.required ? 'required' : '';
        const placeholder = fieldSchema.css?.placeholder || '';
        const maxlength = fieldSchema.css?.maxlength || '';
        switch (inputType) {
            case 'email':
                return `<td class="editing-cell">
                    <input type="email" value="${value}" data-field="${field}" data-row="${rowIndex}" 
                           placeholder="${placeholder}" ${required} ${maxlength ? `maxlength="${maxlength}"` : ''} />
                </td>`;
            case 'tel':
                return `<td class="editing-cell">
                    <input type="tel" value="${value}" data-field="${field}" data-row="${rowIndex}" 
                           placeholder="${placeholder}" ${required} />
                </td>`;
            case 'date':
                return `<td class="editing-cell">
                    <input type="date" value="${value}" data-field="${field}" data-row="${rowIndex}" ${required} />
                </td>`;
            case 'checkbox':
                const isChecked = Boolean(value) && (value !== 'false' && value !== '0');
                const checked = isChecked ? 'checked' : '';
                return `<td class="editing-cell">
                    <input type="checkbox" ${checked} data-field="${field}" data-row="${rowIndex}" />
                </td>`;
            default:
                return `<td class="editing-cell">
                    <input type="text" value="${value}" data-field="${field}" data-row="${rowIndex}" 
                           placeholder="${placeholder}" ${required} ${maxlength ? `maxlength="${maxlength}"` : ''} />
                </td>`;
        }
    }
    createActionCell(rowIndex, isEditing) {
        if (this._editMode === 'readonly' || this._editMode === 'locked') {
            return '<td class="action-cell"></td>';
        }
        if (isEditing) {
            return `<td class="action-cell">
                <button class="save-btn" data-row="${rowIndex}">Save</button>
                <button class="cancel-btn" data-row="${rowIndex}">Cancel</button>
            </td>`;
        }
        else {
            return `<td class="action-cell">
                <button class="edit-btn" data-row="${rowIndex}">Edit</button>
            </td>`;
        }
    }
    createToolbar() {
        return `
            <div class="toolbar">
                <label>
                    Edit Mode: 
                    <select class="edit-mode-select">
                        <option value="readonly" ${this._editMode === 'readonly' ? 'selected' : ''}>Read Only</option>
                        <option value="edit" ${this._editMode === 'edit' ? 'selected' : ''}>Editable</option>
                        <option value="locked" ${this._editMode === 'locked' ? 'selected' : ''}>Locked</option>
                    </select>
                </label>
                <button class="add-row-btn">Add New Row</button>
                <button class="save-all-btn">Save All Changes</button>
            </div>
        `;
    }
    getEditableAttribute(fieldSchema) {
        // Check schema for edit permissions
        if (fieldSchema.locked === true)
            return 'locked';
        if (fieldSchema.editable === false)
            return 'readonly';
        if (fieldSchema.edit === true || this._editMode === 'edit')
            return 'edit';
        return 'readonly';
    }
    getCellClass(editableAttr) {
        switch (editableAttr) {
            case 'edit': return 'editable-cell';
            case 'locked': return 'locked-cell';
            default: return 'readonly-cell';
        }
    }
    getInputType(fieldSchema) {
        return fieldSchema.htmlType || fieldSchema.type || 'text';
    }
    attachEventListeners() {
        // Edit mode selector
        const editModeSelect = this.querySelector('.edit-mode-select');
        if (editModeSelect) {
            editModeSelect.addEventListener('change', (e) => {
                this.editMode = e.target.value;
            });
        }
        // Edit buttons
        this.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rowIndex = parseInt(e.target.dataset.row || '0');
                this.startEditing(rowIndex);
            });
        });
        // Save buttons
        this.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rowIndex = parseInt(e.target.dataset.row || '0');
                this.saveRow(rowIndex);
            });
        });
        // Cancel buttons
        this.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.cancelEditing();
            });
        });
        // Add row button
        const addRowBtn = this.querySelector('.add-row-btn');
        if (addRowBtn) {
            addRowBtn.addEventListener('click', () => {
                this.addNewRow();
            });
        }
        // Save all button
        const saveAllBtn = this.querySelector('.save-all-btn');
        if (saveAllBtn) {
            saveAllBtn.addEventListener('click', () => {
                this.saveAllChanges();
            });
        }
    }
    startEditing(rowIndex) {
        if (this._editMode !== 'edit')
            return;
        // Save original data for potential rollback
        this._originalData = JSON.parse(JSON.stringify(this.sourceData.positions.data[rowIndex]));
        this._editingRowIndex = rowIndex;
        this.render();
    }
    saveRow(rowIndex) {
        const row = this.querySelector(`tr[data-row-index="${rowIndex}"]`);
        if (!row)
            return;
        const inputs = row.querySelectorAll('input');
        const updatedData = {};
        inputs.forEach(input => {
            const field = input.dataset.field;
            if (field) {
                if (input.type === 'checkbox') {
                    updatedData[field] = input.checked;
                }
                else {
                    updatedData[field] = input.value;
                }
            }
        });
        // Validate data
        if (this.validateRowData(updatedData)) {
            // Update the source data
            Object.assign(this.sourceData.positions.data[rowIndex], updatedData);
            this._editingRowIndex = -1;
            this._originalData = null;
            this.render();
            // Dispatch change event
            this.dispatchEvent(new CustomEvent('row-updated', {
                detail: { rowIndex, data: updatedData },
                bubbles: true
            }));
        }
    }
    cancelEditing() {
        if (this._originalData && this._editingRowIndex >= 0) {
            // Restore original data
            this.sourceData.positions.data[this._editingRowIndex] = this._originalData;
        }
        this._editingRowIndex = -1;
        this._originalData = null;
        this.render();
    }
    validateRowData(data) {
        // Basic validation - can be enhanced based on schema
        const schema = this.sourceData.positions.schema;
        for (const [field, value] of Object.entries(data)) {
            const fieldSchema = schema[field];
            if (fieldSchema?.required && (!value || value === '')) {
                alert(`${fieldSchema.displayName || field} is required`);
                return false;
            }
        }
        return true;
    }
    addNewRow() {
        if (this._editMode !== 'edit')
            return;
        // Create new empty row based on schema
        const schema = this.sourceData.positions.schema;
        const newRow = {};
        Object.keys(schema).forEach(field => {
            const fieldSchema = schema[field];
            newRow[field] = fieldSchema.type === 'boolean' ? false : '';
        });
        this.sourceData.positions.data.push(newRow);
        this._editingRowIndex = this.sourceData.positions.data.length - 1;
        this.render();
    }
    saveAllChanges() {
        // Dispatch event with all data for external saving
        this.dispatchEvent(new CustomEvent('save-all-changes', {
            detail: { data: this.sourceData.positions.data },
            bubbles: true
        }));
    }
    getTableStyles() {
        return `
            .editable-grid-container {
                font-family: Arial, sans-serif;
            }
            .toolbar {
                padding: 10px;
                background-color: #f5f5f5;
                border: 1px solid #ddd;
                margin-bottom: 10px;
                display: flex;
                gap: 10px;
                align-items: center;
            }
            .toolbar button {
                padding: 5px 10px;
                border: 1px solid #ccc;
                background-color: #fff;
                cursor: pointer;
            }
            .toolbar button:hover {
                background-color: #e9e9e9;
            }
            .editable-grid {
                border-collapse: collapse;
                width: 100%;
                border: 1px solid #ddd;
            }
            th {
                text-align: left;
                padding: 8px;
                border-bottom: 2px solid #ddd;
                font-weight: bold;
                background-color: #f9f9f9;
            }
            td {
                padding: 8px;
                border-bottom: 1px solid #ddd;
            }
            .editing-row {
                background-color: #fff9c4;
            }
            .editing-cell input {
                width: 100%;
                border: 1px solid #4CAF50;
                padding: 4px;
                box-sizing: border-box;
            }
            .editable-cell {
                background-color: #f0f8f0;
                cursor: pointer;
            }
            .locked-cell {
                background-color: #f0f0f0;
                color: #666;
            }
            .readonly-cell {
                background-color: #fff;
            }
            .action-cell {
                width: 120px;
                text-align: center;
            }
            .action-cell button {
                margin: 0 2px;
                padding: 3px 8px;
                border: 1px solid #ccc;
                background-color: #fff;
                cursor: pointer;
                font-size: 12px;
            }
            .edit-btn:hover {
                background-color: #e6f3ff;
            }
            .save-btn {
                background-color: #4CAF50;
                color: white;
            }
            .save-btn:hover {
                background-color: #45a049;
            }
            .cancel-btn {
                background-color: #f44336;
                color: white;
            }
            .cancel-btn:hover {
                background-color: #da190b;
            }
        `;
    }
}
// Register the custom element
customElements.define('editable-positions-data-grid', EditablePositionsDataGrid);
export { EditablePositionsDataGrid };
