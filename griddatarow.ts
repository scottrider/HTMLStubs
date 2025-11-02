// GridDataRow - Dynamic single record editing form based on schema
// Creates HTML form fields dynamically from schema information
// Supports both editable and read-only states

export interface GridDataRowConfig {
    schema: any;
    recordData: any;
    companyOptions?: string[]; // For company select dropdown
    isEditable?: boolean; // New: determines if form is in edit mode
    showCheckbox?: boolean; // New: show selection checkbox
    isChecked?: boolean; // New: checkbox state
    onSave?: (data: any) => void;
    onCancel?: () => void;
    onEdit?: () => void; // New: callback for edit button
    onDelete?: () => void; // New: callback for delete button
    onCheckboxChange?: (checked: boolean) => void; // New: checkbox change callback
}

export class GridDataRow {
    private config: GridDataRowConfig;
    private container: HTMLElement;
    private formData: any = {};
    private isEditable: boolean = false;
    private showCheckbox: boolean = false;
    private isChecked: boolean = false;

    constructor(config: GridDataRowConfig) {
        this.config = config;
        this.isEditable = config.isEditable ?? false;
        this.showCheckbox = config.showCheckbox ?? false;
        this.isChecked = config.isChecked ?? false;
        this.formData = { ...config.recordData };
        this.container = this.createContainer();
        this.render();
    }

    public getElement(): HTMLElement {
        return this.container;
    }

    public getData(): any {
        return { ...this.formData };
    }

    public setEditable(editable: boolean): void {
        this.isEditable = editable;
        this.render();
    }

    public setChecked(checked: boolean): void {
        this.isChecked = checked;
        this.render();
    }

    public getChecked(): boolean {
        return this.isChecked;
    }

    private createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'grid-data-row';
        return container;
    }

    private render(): void {
        const visibleFields = Object.keys(this.config.schema).filter(fieldName => {
            const field = this.config.schema[fieldName];
            return field.visible !== false;
        });

        this.container.innerHTML = `
            <style>
                .grid-data-row {
                    background: white;
                    font-family: Arial, sans-serif;
                    position: relative;
                    transition: background-color 0.2s ease;
                    padding-bottom: 1px;
                    margin-bottom: 1px;
                }
                .grid-data-row:hover,
                .grid-data-row:focus-within {
                    background-color: #f8f9fa;
                    outline: 2px solid #007bff;
                    outline-offset: 1px;
                }
                .row-form {
                    display: flex;
                    flex-wrap: nowrap;
                    gap: 15px;
                    align-items: center;
                    overflow: visible;
                    white-space: nowrap;
                }
                .checkbox-group {
                    display: flex;
                    flex-direction: column;
                    width: 30px;
                    flex-shrink: 0;
                    align-items: center;
                    justify-content: center;
                }
                .record-checkbox {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }
                .field-group {
                    display: flex;
                    flex-direction: column;
                    width: 120px;
                    flex-shrink: 0;
                }
                .field-label {
                    font-weight: bold;
                    margin: 0;
                    font-size: 12px;
                    color: #666;
                    white-space: nowrap;
                }
                .field-input {
                    padding: 0 0 1px 0;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 14px;
                    width: 100%;
                    box-sizing: border-box;
                }
                .field-input:focus {
                    border-color: #007cba;
                    outline: none;
                    box-shadow: 0 0 3px rgba(0, 124, 186, 0.3);
                }
                .field-input.required {
                    border-left: 3px solid #e74c3c;
                }
                .field-select {
                    padding: 0 0 1px 0;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 14px;
                    background: white;
                    min-width: 150px;
                }
                .field-label-display {
                    padding: 0 0 1px 0;
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 4px;
                    font-size: 14px;
                    color: #666;
                    min-width: 100px;
                }
                .field-readonly {
                    padding: 0 0 1px 0;
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 4px;
                    font-size: 14px;
                    color: #666;
                    min-width: 100px;
                }
                .action-buttons {
                    position: absolute;
                    top: -30px;
                    right: 10px;
                    display: none;
                    gap: 8px;
                    align-items: center;
                    width: auto;
                    flex-shrink: 0;
                    background: white;
                    padding: 0 0 1px 0;
                    margin: 0;
                    border-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    z-index: 100;
                }
                .grid-data-row:hover .action-buttons,
                .grid-data-row:focus-within .action-buttons {
                    display: flex;
                }
                .btn-emoji {
                    width: 32px;
                    height: 32px;
                    border: 1px solid #ccc;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    transition: transform 0.1s;
                }
                .btn-emoji:hover {
                    transform: scale(1.1);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .btn-save {
                    background: #28a745;
                    border-color: #28a745;
                }
                .btn-save:hover {
                    background: #218838;
                }
                .btn-cancel {
                    background: #6c757d;
                    border-color: #6c757d;
                }
                .btn-cancel:hover {
                    background: #5a6268;
                }
                .btn-edit {
                    background: #007bff;
                    border-color: #007bff;
                }
                .btn-edit:hover {
                    background: #0056b3;
                }
                .btn-delete {
                    background: #dc3545;
                    border-color: #dc3545;
                }
                .btn-delete:hover {
                    background: #c82333;
                }
            </style>
            <div class="row-form">
                ${this.showCheckbox ? this.createCheckboxField() : ''}
                ${this.createFormFields(visibleFields)}
                <div class="action-buttons">
                    ${this.createActionButtons()}
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    private createCheckboxField(): string {
        return `
            <div class="checkbox-group">
                <input type="checkbox" 
                       class="record-checkbox" 
                       id="recordCheckbox"
                       ${this.isChecked ? 'checked' : ''} />
            </div>
        `;
    }

    private createActionButtons(): string {
        if (this.isEditable) {
            // Editable state: Save and Cancel buttons
            return `
                <button class="btn-emoji btn-save" id="saveBtn" title="Save">💾</button>
                <button class="btn-emoji btn-cancel" id="cancelBtn" title="Cancel">❌</button>
            `;
        } else {
            // Read-only state: Edit and Delete buttons
            return `
                <button class="btn-emoji btn-edit" id="editBtn" title="Edit">✏️</button>
                <button class="btn-emoji btn-delete" id="deleteBtn" title="Delete">🗑️</button>
            `;
        }
    }

    private createFormFields(visibleFields: string[]): string {
        return visibleFields.map(fieldName => {
            const fieldSchema = this.config.schema[fieldName];
            const value = this.formData[fieldName] || '';
            
            return this.createFieldGroup(fieldName, fieldSchema, value);
        }).join('');
    }

    private createFieldGroup(fieldName: string, fieldSchema: any, value: string): string {
        const displayName = fieldSchema.displayName || fieldName;

        let fieldHtml = '';

        if (!this.isEditable) {
            // Read-only state - show as text
            fieldHtml = `<div class="field-readonly">${value}</div>`;
        } else {
            // Editable state - show input fields based on field type
            const required = fieldSchema.required ? 'required' : '';
            const requiredClass = fieldSchema.required ? 'required' : '';
            fieldHtml = this.createEditableField(fieldName, fieldSchema, value, required, requiredClass);
        }

        return `
            <div class="field-group">
                ${fieldHtml}
            </div>
        `;
    }

    private createEditableField(fieldName: string, fieldSchema: any, value: string, required: string, requiredClass: string): string {
        // Handle special field mappings per your requirements
        switch (fieldName) {
            case 'position':
                // Position is an input text field
                return `<input type="text" class="field-input ${requiredClass}" 
                    value="${value}" data-field="${fieldName}" 
                    placeholder="${fieldSchema.css?.placeholder || ''}" 
                    maxlength="${fieldSchema.css?.maxlength || ''}" ${required} />`;

            case 'company':
                // Company would be a select of company records
                return this.createCompanySelect(fieldName, value, fieldSchema);

            case 'email':
                // Email is an input text field
                return `<input type="email" class="field-input ${requiredClass}" 
                    value="${value}" data-field="${fieldName}" 
                    placeholder="${fieldSchema.css?.placeholder || ''}" ${required} />`;

            case 'cphone':
                // Cell is an input text phone field
                return `<input type="tel" class="field-input ${requiredClass}" 
                    value="${value}" data-field="${fieldName}" 
                    placeholder="${fieldSchema.css?.placeholder || ''}" ${required} />`;

            case 'ophone':
                // Office is an input text phone field
                return `<input type="tel" class="field-input ${requiredClass}" 
                    value="${value}" data-field="${fieldName}" 
                    placeholder="${fieldSchema.css?.placeholder || ''}" ${required} />`;

            case 'icontact':
                // Initial Contact is a label field
                return `<div class="field-label-display" data-field="${fieldName}">${value}</div>`;

            case 'lcontact':
                // Last Contact is a calendar field
                return `<input type="date" class="field-input ${requiredClass}" 
                    value="${value}" data-field="${fieldName}" 
                    min="${fieldSchema.css?.min || ''}" 
                    max="${fieldSchema.css?.max || ''}" ${required} />`;

            default:
                // Default handling based on schema
                return this.createDefaultField(fieldName, fieldSchema, value);
        }
    }

    private createCompanySelect(fieldName: string, value: string, fieldSchema: any): string {
        const required = fieldSchema.required ? 'required' : '';
        const requiredClass = fieldSchema.required ? 'required' : '';
        
        // Use provided company options or extract from data
        let options = this.config.companyOptions || [];
        
        if (options.length === 0) {
            // Default company options if none provided
            options = [
                'TechCorp Inc',
                'InnovateSoft', 
                'DataDrive Systems',
                'CloudFirst Technologies',
                'NextGen Solutions',
                'DesignWorks Studio',
                'ServerTech Corp',
                'TestPro Solutions',
                'AI Innovations Ltd',
                'SecureNet Corp'
            ];
        }

        const optionsList = options.map(company => 
            `<option value="${company}" ${company === value ? 'selected' : ''}>${company}</option>`
        ).join('');

        return `
            <select class="field-select ${requiredClass}" data-field="${fieldName}" ${required}>
                <option value="">Select Company...</option>
                ${optionsList}
            </select>
        `;
    }

    private createDefaultField(fieldName: string, fieldSchema: any, value: string): string {
        const required = fieldSchema.required ? 'required' : '';
        const requiredClass = fieldSchema.required ? 'required' : '';
        const inputType = fieldSchema.htmlType || 'text';
        
        if (fieldSchema.htmlElement === 'label') {
            return `<div class="field-label-display" data-field="${fieldName}">${value}</div>`;
        }
        
        return `<input type="${inputType}" class="field-input ${requiredClass}" 
            value="${value}" data-field="${fieldName}" 
            placeholder="${fieldSchema.css?.placeholder || ''}" ${required} />`;
    }

    private attachEventListeners(): void {
        // Save button
        const saveBtn = this.container.querySelector('#saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.handleSave();
            });
        }

        // Cancel button
        const cancelBtn = this.container.querySelector('#cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.handleCancel();
            });
        }

        // Edit button
        const editBtn = this.container.querySelector('#editBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.handleEdit();
            });
        }

        // Delete button
        const deleteBtn = this.container.querySelector('#deleteBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.handleDelete();
            });
        }

        // Checkbox
        const checkbox = this.container.querySelector('#recordCheckbox');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                this.isChecked = (e.target as HTMLInputElement).checked;
                if (this.config.onCheckboxChange) {
                    this.config.onCheckboxChange(this.isChecked);
                }
            });
        }

        // Field change listeners (only for editable mode)
        if (this.isEditable) {
            const inputs = this.container.querySelectorAll('[data-field]');
            inputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    const fieldName = (e.target as HTMLElement).dataset.field;
                    if (fieldName) {
                        if (input.tagName === 'SELECT') {
                            this.formData[fieldName] = (input as HTMLSelectElement).value;
                        } else if (input.tagName === 'INPUT') {
                            this.formData[fieldName] = (input as HTMLInputElement).value;
                        }
                    }
                });
            });
        }
    }

    private handleSave(): void {
        // Validate required fields
        if (this.validateForm()) {
            if (this.config.onSave) {
                this.config.onSave(this.formData);
            }
        }
    }

    private handleCancel(): void {
        if (this.config.onCancel) {
            this.config.onCancel();
        }
    }

    private handleEdit(): void {
        if (this.config.onEdit) {
            this.config.onEdit();
        } else {
            // Default behavior: switch to editable mode
            this.setEditable(true);
        }
    }

    private handleDelete(): void {
        if (this.config.onDelete) {
            this.config.onDelete();
        }
    }

    private validateForm(): boolean {
        const schema = this.config.schema;
        
        for (const [fieldName, fieldSchema] of Object.entries(schema)) {
            const field = fieldSchema as any;
            if (field.required && field.visible !== false) {
                const value = this.formData[fieldName];
                if (!value || (typeof value === 'string' && value.trim() === '')) {
                    alert(`${field.displayName || fieldName} is required`);
                    return false;
                }
            }
        }
        
        return true;
    }

    // Static method to create from first record
    public static createFromFirstRecord(sourceData: any, companyOptions?: string[], isEditable: boolean = false): GridDataRow {
        if (!sourceData?.positions?.schema || !sourceData?.positions?.data?.[0]) {
            throw new Error('Invalid source data structure');
        }

        const config: GridDataRowConfig = {
            schema: sourceData.positions.schema,
            recordData: sourceData.positions.data[0],
            companyOptions: companyOptions,
            isEditable: isEditable,
            onSave: (data) => {
                console.log('Record saved:', data);
                // Update the source data
                Object.assign(sourceData.positions.data[0], data);
            },
            onCancel: () => {
                console.log('Edit cancelled');
            },
            onEdit: () => {
                console.log('Edit requested');
            },
            onDelete: () => {
                console.log('Delete requested');
                if (confirm('Are you sure you want to delete this record?')) {
                    // Remove from source data
                    sourceData.positions.data.splice(0, 1);
                    console.log('Record deleted');
                }
            }
        };

        return new GridDataRow(config);
    }
}