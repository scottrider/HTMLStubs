// EditMechanism - A loosely coupled editing system that can be applied to any DataGrid
// Master Agent Edict: Loosely coupled design - separate concerns, pluggable components
export class EditMechanism {
    constructor(config) {
        this.currentEditMode = 'readonly';
        this.editingRowIndex = -1;
        this.originalRowData = null;
        this.config = config;
        this.currentEditMode = config.defaultMode;
        this.attachToGrid();
    }
    // Public API - Apply editing capabilities to a grid
    enableEditing() {
        this.currentEditMode = 'edit';
        this.refreshGridEditingState();
    }
    disableEditing() {
        this.currentEditMode = 'readonly';
        this.refreshGridEditingState();
    }
    lockEditing() {
        this.currentEditMode = 'locked';
        this.refreshGridEditingState();
    }
    setEditMode(mode) {
        this.currentEditMode = mode;
        this.refreshGridEditingState();
    }
    startRowEdit(rowIndex) {
        if (this.currentEditMode !== 'edit')
            return false;
        this.editingRowIndex = rowIndex;
        this.backupRowData(rowIndex);
        this.convertRowToEditable(rowIndex);
        return true;
    }
    saveRowEdit(rowIndex) {
        if (this.editingRowIndex !== rowIndex)
            return false;
        const newData = this.extractRowData(rowIndex);
        if (this.validateRowData(newData)) {
            this.applyRowData(rowIndex, newData);
            this.exitRowEdit();
            if (this.config.onRowSave) {
                this.config.onRowSave(rowIndex, newData);
            }
            return true;
        }
        return false;
    }
    cancelRowEdit() {
        if (this.editingRowIndex >= 0) {
            this.restoreRowData();
            this.exitRowEdit();
        }
    }
    // Core mechanism methods
    attachToGrid() {
        // Add edit controls and event listeners to the target grid
        this.injectEditControls();
        this.attachEventListeners();
    }
    injectEditControls() {
        const grid = this.config.targetGrid;
        // Add edit mode selector
        const toolbar = this.createEditToolbar();
        grid.insertBefore(toolbar, grid.firstChild);
        // Add edit buttons to each row
        this.addEditButtonsToRows();
    }
    createEditToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'edit-mechanism-toolbar';
        toolbar.innerHTML = `
            <style>
                .edit-mechanism-toolbar {
                    padding: 8px;
                    background: #f5f5f5;
                    border: 1px solid #ddd;
                    margin-bottom: 5px;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                .edit-mode-control {
                    display: flex;
                    gap: 5px;
                    align-items: center;
                }
                .edit-mechanism-btn {
                    padding: 4px 8px;
                    border: 1px solid #ccc;
                    background: white;
                    cursor: pointer;
                    font-size: 12px;
                }
                .edit-mechanism-btn:hover {
                    background: #e9e9e9;
                }
                .edit-mechanism-btn.active {
                    background: #007cba;
                    color: white;
                }
            </style>
            <div class="edit-mode-control">
                <label>Edit Mode:</label>
                <button class="edit-mechanism-btn mode-readonly ${this.currentEditMode === 'readonly' ? 'active' : ''}" data-mode="readonly">Read Only</button>
                <button class="edit-mechanism-btn mode-edit ${this.currentEditMode === 'edit' ? 'active' : ''}" data-mode="edit">Editable</button>
                <button class="edit-mechanism-btn mode-locked ${this.currentEditMode === 'locked' ? 'active' : ''}" data-mode="locked">Locked</button>
            </div>
        `;
        return toolbar;
    }
    addEditButtonsToRows() {
        const table = this.config.targetGrid.querySelector('table');
        if (!table)
            return;
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, index) => {
            if (!row.querySelector('.edit-mechanism-actions')) {
                this.addEditButtonToRow(row, index);
            }
        });
    }
    addEditButtonToRow(row, rowIndex) {
        const actionCell = document.createElement('td');
        actionCell.className = 'edit-mechanism-actions';
        actionCell.innerHTML = this.getRowActionButtons(rowIndex, false);
        row.appendChild(actionCell);
    }
    getRowActionButtons(rowIndex, isEditing) {
        if (this.currentEditMode !== 'edit') {
            return '<span class="edit-disabled">—</span>';
        }
        if (isEditing) {
            return `
                <button class="edit-mechanism-btn save-row" data-row="${rowIndex}">Save</button>
                <button class="edit-mechanism-btn cancel-row" data-row="${rowIndex}">Cancel</button>
            `;
        }
        else {
            return `<button class="edit-mechanism-btn edit-row" data-row="${rowIndex}">Edit</button>`;
        }
    }
    attachEventListeners() {
        const grid = this.config.targetGrid;
        // Mode change buttons
        grid.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('mode-readonly')) {
                this.setEditMode('readonly');
            }
            else if (target.classList.contains('mode-edit')) {
                this.setEditMode('edit');
            }
            else if (target.classList.contains('mode-locked')) {
                this.setEditMode('locked');
            }
            else if (target.classList.contains('edit-row')) {
                const rowIndex = parseInt(target.dataset.row || '0');
                this.startRowEdit(rowIndex);
            }
            else if (target.classList.contains('save-row')) {
                const rowIndex = parseInt(target.dataset.row || '0');
                this.saveRowEdit(rowIndex);
            }
            else if (target.classList.contains('cancel-row')) {
                this.cancelRowEdit();
            }
        });
    }
    refreshGridEditingState() {
        // Update toolbar buttons
        const toolbar = this.config.targetGrid.querySelector('.edit-mechanism-toolbar');
        if (toolbar) {
            toolbar.querySelectorAll('.edit-mechanism-btn[data-mode]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === this.currentEditMode);
            });
        }
        // Update row buttons
        this.updateAllRowButtons();
    }
    updateAllRowButtons() {
        const rows = this.config.targetGrid.querySelectorAll('tbody tr');
        rows.forEach((row, index) => {
            const actionCell = row.querySelector('.edit-mechanism-actions');
            if (actionCell) {
                const isEditing = this.editingRowIndex === index;
                actionCell.innerHTML = this.getRowActionButtons(index, isEditing);
            }
        });
    }
    convertRowToEditable(rowIndex) {
        const row = this.getRowByIndex(rowIndex);
        if (!row)
            return;
        const cells = row.querySelectorAll('td:not(.edit-mechanism-actions)');
        cells.forEach((cell, cellIndex) => {
            const currentValue = cell.textContent || '';
            const fieldName = this.getFieldNameForCell(cellIndex);
            const schema = this.getSchemaForField(fieldName);
            const input = this.createInputForField(fieldName, currentValue, schema);
            cell.innerHTML = '';
            cell.appendChild(input);
            cell.classList.add('editing-cell');
        });
        row.classList.add('editing-row');
        this.updateAllRowButtons();
    }
    createInputForField(fieldName, value, schema) {
        const input = document.createElement('input');
        input.value = value;
        input.dataset.field = fieldName;
        // Apply schema-based properties
        if (schema) {
            input.type = this.getInputTypeFromSchema(schema);
            if (schema.required)
                input.required = true;
            if (schema.css?.placeholder)
                input.placeholder = schema.css.placeholder;
            if (schema.css?.maxlength)
                input.maxLength = parseInt(schema.css.maxlength);
        }
        input.style.width = '100%';
        input.style.border = '1px solid #4CAF50';
        input.style.padding = '2px 4px';
        return input;
    }
    getInputTypeFromSchema(schema) {
        if (schema.htmlType)
            return schema.htmlType;
        if (schema.type === 'email')
            return 'email';
        if (schema.type === 'phone')
            return 'tel';
        if (schema.type === 'date')
            return 'date';
        return 'text';
    }
    backupRowData(rowIndex) {
        const row = this.getRowByIndex(rowIndex);
        if (row) {
            const cells = row.querySelectorAll('td:not(.edit-mechanism-actions)');
            this.originalRowData = Array.from(cells).map(cell => cell.textContent || '');
        }
    }
    extractRowData(rowIndex) {
        const row = this.getRowByIndex(rowIndex);
        if (!row)
            return {};
        const data = {};
        const inputs = row.querySelectorAll('input[data-field]');
        inputs.forEach(input => {
            const field = input.dataset.field;
            if (field) {
                data[field] = input.value;
            }
        });
        return data;
    }
    validateRowData(data) {
        if (this.config.onValidate) {
            for (const [field, value] of Object.entries(data)) {
                const schema = this.getSchemaForField(field);
                if (!this.config.onValidate(field, value, schema)) {
                    return false;
                }
            }
        }
        return true;
    }
    applyRowData(rowIndex, data) {
        const row = this.getRowByIndex(rowIndex);
        if (!row)
            return;
        const cells = row.querySelectorAll('td:not(.edit-mechanism-actions)');
        cells.forEach((cell, cellIndex) => {
            const fieldName = this.getFieldNameForCell(cellIndex);
            cell.textContent = data[fieldName] || '';
            cell.classList.remove('editing-cell');
        });
        row.classList.remove('editing-row');
    }
    restoreRowData() {
        if (!this.originalRowData || this.editingRowIndex < 0)
            return;
        const row = this.getRowByIndex(this.editingRowIndex);
        if (!row)
            return;
        const cells = row.querySelectorAll('td:not(.edit-mechanism-actions)');
        cells.forEach((cell, index) => {
            if (this.originalRowData[index] !== undefined) {
                cell.textContent = this.originalRowData[index];
                cell.classList.remove('editing-cell');
            }
        });
        row.classList.remove('editing-row');
    }
    exitRowEdit() {
        this.editingRowIndex = -1;
        this.originalRowData = null;
        this.updateAllRowButtons();
    }
    getRowByIndex(index) {
        const rows = this.config.targetGrid.querySelectorAll('tbody tr');
        return rows[index] || null;
    }
    getFieldNameForCell(cellIndex) {
        // This would need to be enhanced based on your grid's structure
        // For now, return a generic field name
        return `field_${cellIndex}`;
    }
    getSchemaForField(fieldName) {
        // This would need to access the actual schema
        // For now, return a basic schema
        return { type: 'text', required: false };
    }
    // Public method to integrate with existing grid data
    integratWithGridData(getSchema, getFieldNames) {
        this.getSchemaForField = (fieldName) => {
            const schema = getSchema();
            return schema[fieldName] || { type: 'text', required: false };
        };
        this.getFieldNameForCell = (cellIndex) => {
            const fieldNames = getFieldNames();
            return fieldNames[cellIndex] || `field_${cellIndex}`;
        };
    }
}
