// EditMechanism - A loosely coupled editing system that can be applied to any DataGrid
// Master Agent Edict: Loosely coupled design - separate concerns, pluggable components

export type EditMode = 'edit' | 'locked' | 'readonly';

export interface EditableField {
    field: string;
    mode: EditMode;
    value: any;
    schema: any;
}

export interface EditMechanismConfig {
    targetGrid: HTMLElement;
    defaultMode: EditMode;
    onFieldEdit?: (field: EditableField) => void;
    onRowSave?: (rowIndex: number, data: any) => void;
    onValidate?: (field: string, value: any, schema: any) => boolean;
}

export class EditMechanism {
    private config: EditMechanismConfig;
    private currentEditMode: EditMode = 'readonly';
    private editingRowIndex: number = -1;
    private originalRowData: any = null;

    constructor(config: EditMechanismConfig) {
        this.config = config;
        this.currentEditMode = config.defaultMode;
        this.attachToGrid();
    }

    // Public API - Apply editing capabilities to a grid
    public enableEditing(): void {
        this.currentEditMode = 'edit';
        this.refreshGridEditingState();
    }

    public disableEditing(): void {
        this.currentEditMode = 'readonly';
        this.refreshGridEditingState();
    }

    public lockEditing(): void {
        this.currentEditMode = 'locked';
        this.refreshGridEditingState();
    }

    public setEditMode(mode: EditMode): void {
        this.currentEditMode = mode;
        this.refreshGridEditingState();
    }

    public startRowEdit(rowIndex: number): boolean {
        if (this.currentEditMode !== 'edit') return false;
        
        this.editingRowIndex = rowIndex;
        this.backupRowData(rowIndex);
        this.convertRowToEditable(rowIndex);
        return true;
    }

    public saveRowEdit(rowIndex: number): boolean {
        if (this.editingRowIndex !== rowIndex) return false;
        
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

    public cancelRowEdit(): void {
        if (this.editingRowIndex >= 0) {
            this.restoreRowData();
            this.exitRowEdit();
        }
    }

    // Core mechanism methods
    private attachToGrid(): void {
        // Add edit controls and event listeners to the target grid
        this.injectEditControls();
        this.attachEventListeners();
    }

    private injectEditControls(): void {
        const grid = this.config.targetGrid;
        
        // Add edit mode selector
        const toolbar = this.createEditToolbar();
        grid.insertBefore(toolbar, grid.firstChild);
        
        // Add edit buttons to each row
        this.addEditButtonsToRows();
    }

    private createEditToolbar(): HTMLElement {
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

    private addEditButtonsToRows(): void {
        const table = this.config.targetGrid.querySelector('table');
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, index) => {
            if (!row.querySelector('.edit-mechanism-actions')) {
                this.addEditButtonToRow(row as HTMLTableRowElement, index);
            }
        });
    }

    private addEditButtonToRow(row: HTMLTableRowElement, rowIndex: number): void {
        const actionCell = document.createElement('td');
        actionCell.className = 'edit-mechanism-actions';
        actionCell.innerHTML = this.getRowActionButtons(rowIndex, false);
        row.appendChild(actionCell);
    }

    private getRowActionButtons(rowIndex: number, isEditing: boolean): string {
        if (this.currentEditMode !== 'edit') {
            return '<span class="edit-disabled">—</span>';
        }
        
        if (isEditing) {
            return `
                <button class="edit-mechanism-btn save-row" data-row="${rowIndex}">Save</button>
                <button class="edit-mechanism-btn cancel-row" data-row="${rowIndex}">Cancel</button>
            `;
        } else {
            return `<button class="edit-mechanism-btn edit-row" data-row="${rowIndex}">Edit</button>`;
        }
    }

    private attachEventListeners(): void {
        const grid = this.config.targetGrid;
        
        // Mode change buttons
        grid.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            
            if (target.classList.contains('mode-readonly')) {
                this.setEditMode('readonly');
            } else if (target.classList.contains('mode-edit')) {
                this.setEditMode('edit');
            } else if (target.classList.contains('mode-locked')) {
                this.setEditMode('locked');
            } else if (target.classList.contains('edit-row')) {
                const rowIndex = parseInt(target.dataset.row || '0');
                this.startRowEdit(rowIndex);
            } else if (target.classList.contains('save-row')) {
                const rowIndex = parseInt(target.dataset.row || '0');
                this.saveRowEdit(rowIndex);
            } else if (target.classList.contains('cancel-row')) {
                this.cancelRowEdit();
            }
        });
    }

    private refreshGridEditingState(): void {
        // Update toolbar buttons
        const toolbar = this.config.targetGrid.querySelector('.edit-mechanism-toolbar');
        if (toolbar) {
            toolbar.querySelectorAll('.edit-mechanism-btn[data-mode]').forEach(btn => {
                btn.classList.toggle('active', (btn as HTMLElement).dataset.mode === this.currentEditMode);
            });
        }
        
        // Update row buttons
        this.updateAllRowButtons();
    }

    private updateAllRowButtons(): void {
        const rows = this.config.targetGrid.querySelectorAll('tbody tr');
        rows.forEach((row, index) => {
            const actionCell = row.querySelector('.edit-mechanism-actions');
            if (actionCell) {
                const isEditing = this.editingRowIndex === index;
                actionCell.innerHTML = this.getRowActionButtons(index, isEditing);
            }
        });
    }

    private convertRowToEditable(rowIndex: number): void {
        const row = this.getRowByIndex(rowIndex);
        if (!row) return;

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

    private createInputForField(fieldName: string, value: string, schema: any): HTMLInputElement {
        const input = document.createElement('input');
        input.value = value;
        input.dataset.field = fieldName;
        
        // Apply schema-based properties
        if (schema) {
            input.type = this.getInputTypeFromSchema(schema);
            if (schema.required) input.required = true;
            if (schema.css?.placeholder) input.placeholder = schema.css.placeholder;
            if (schema.css?.maxlength) input.maxLength = parseInt(schema.css.maxlength);
        }
        
        input.style.width = '100%';
        input.style.border = '1px solid #4CAF50';
        input.style.padding = '2px 4px';
        
        return input;
    }

    private getInputTypeFromSchema(schema: any): string {
        if (schema.htmlType) return schema.htmlType;
        if (schema.type === 'email') return 'email';
        if (schema.type === 'phone') return 'tel';
        if (schema.type === 'date') return 'date';
        return 'text';
    }

    private backupRowData(rowIndex: number): void {
        const row = this.getRowByIndex(rowIndex);
        if (row) {
            const cells = row.querySelectorAll('td:not(.edit-mechanism-actions)');
            this.originalRowData = Array.from(cells).map(cell => cell.textContent || '');
        }
    }

    private extractRowData(rowIndex: number): any {
        const row = this.getRowByIndex(rowIndex);
        if (!row) return {};

        const data: any = {};
        const inputs = row.querySelectorAll('input[data-field]');
        inputs.forEach(input => {
            const field = (input as HTMLInputElement).dataset.field;
            if (field) {
                data[field] = (input as HTMLInputElement).value;
            }
        });
        
        return data;
    }

    private validateRowData(data: any): boolean {
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

    private applyRowData(rowIndex: number, data: any): void {
        const row = this.getRowByIndex(rowIndex);
        if (!row) return;

        const cells = row.querySelectorAll('td:not(.edit-mechanism-actions)');
        cells.forEach((cell, cellIndex) => {
            const fieldName = this.getFieldNameForCell(cellIndex);
            cell.textContent = data[fieldName] || '';
            cell.classList.remove('editing-cell');
        });
        
        row.classList.remove('editing-row');
    }

    private restoreRowData(): void {
        if (!this.originalRowData || this.editingRowIndex < 0) return;
        
        const row = this.getRowByIndex(this.editingRowIndex);
        if (!row) return;

        const cells = row.querySelectorAll('td:not(.edit-mechanism-actions)');
        cells.forEach((cell, index) => {
            if (this.originalRowData[index] !== undefined) {
                cell.textContent = this.originalRowData[index];
                cell.classList.remove('editing-cell');
            }
        });
        
        row.classList.remove('editing-row');
    }

    private exitRowEdit(): void {
        this.editingRowIndex = -1;
        this.originalRowData = null;
        this.updateAllRowButtons();
    }

    private getRowByIndex(index: number): HTMLTableRowElement | null {
        const rows = this.config.targetGrid.querySelectorAll('tbody tr');
        return rows[index] as HTMLTableRowElement || null;
    }

    private getFieldNameForCell(cellIndex: number): string {
        // This would need to be enhanced based on your grid's structure
        // For now, return a generic field name
        return `field_${cellIndex}`;
    }

    private getSchemaForField(fieldName: string): any {
        // This would need to access the actual schema
        // For now, return a basic schema
        return { type: 'text', required: false };
    }

    // Public method to integrate with existing grid data
    public integratWithGridData(getSchema: () => any, getFieldNames: () => string[]): void {
        this.getSchemaForField = (fieldName: string) => {
            const schema = getSchema();
            return schema[fieldName] || { type: 'text', required: false };
        };
        
        this.getFieldNameForCell = (cellIndex: number) => {
            const fieldNames = getFieldNames();
            return fieldNames[cellIndex] || `field_${cellIndex}`;
        };
    }
}