// GridDataRow - Dynamic single record editing form based on schema
// Creates HTML form fields dynamically from schema information
// Supports both editable and read-only states
export class GridDataRow {
    constructor(config) {
        this.formData = {};
        this.isEditable = false;
        this.showCheckbox = false;
        this.isChecked = false;
        this.config = config;
        this.isEditable = config.isEditable ?? false;
        this.showCheckbox = config.showCheckbox ?? false;
        this.isChecked = config.isChecked ?? false;
        this.formData = { ...config.recordData };
        this.container = this.createContainer();
        this.render();
    }
    getElement() {
        return this.container;
    }
    getData() {
        return { ...this.formData };
    }
    setEditable(editable) {
        this.isEditable = editable;
        this.render();
    }
    setChecked(checked) {
        this.isChecked = checked;
        this.render();
    }
    getChecked() {
        return this.isChecked;
    }
    createContainer() {
        const container = document.createElement('div');
        container.className = 'grid-data-row';
        return container;
    }
    render() {
        const visibleFields = Object.keys(this.config.schema).filter(fieldName => {
            const field = this.config.schema[fieldName];
            return field.visible !== false;
        });
        this.container.innerHTML = `
            <div class="row-form">
                <div class="action-buttons">
                    ${this.showCheckbox ? `<input type="checkbox" class="record-checkbox" ${this.isChecked ? 'checked' : ''} />` : ''}
                    ${this.createActionButtons()}
                </div>
                ${this.createFormFields(visibleFields)}
            </div>
        `;
        this.attachEventListeners();
    }
    createActionButtons() {
        if (this.isEditable) {
            // Editable state: Save and Cancel buttons
            return `
                <button class="btn-emoji btn-save" id="saveBtn" title="Save">💾</button>
                <button class="btn-emoji btn-cancel" id="cancelBtn" title="Cancel">❌</button>
            `;
        }
        else {
            // Read-only state: Edit and Delete buttons
            return `
                <button class="btn-emoji btn-edit" id="editBtn" title="Edit">✏️</button>
                <button class="btn-emoji btn-delete" id="deleteBtn" title="Delete">🗑️</button>
            `;
        }
    }
    createFormFields(visibleFields) {
        return visibleFields.map(fieldName => {
            const fieldSchema = this.config.schema[fieldName];
            const value = this.formData[fieldName] || '';
            return this.createFieldGroup(fieldName, fieldSchema, value);
        }).join('');
    }
    createFieldGroup(fieldName, fieldSchema, value) {
        const displayName = fieldSchema.displayName || fieldName;
        let fieldHtml = '';
        if (!this.isEditable) {
            // Read-only state - show as text
            fieldHtml = `<div class="field-readonly">${value}</div>`;
        }
        else {
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
    createEditableField(fieldName, fieldSchema, value, required, requiredClass) {
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
    createCompanySelect(fieldName, value, fieldSchema) {
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
        const optionsList = options.map(company => `<option value="${company}" ${company === value ? 'selected' : ''}>${company}</option>`).join('');
        return `
            <select class="field-select ${requiredClass}" data-field="${fieldName}" ${required}>
                <option value="">Select Company...</option>
                ${optionsList}
            </select>
        `;
    }
    createDefaultField(fieldName, fieldSchema, value) {
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
    attachEventListeners() {
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
        const checkbox = this.container.querySelector('.record-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                this.isChecked = e.target.checked;
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
                    const fieldName = e.target.dataset.field;
                    if (fieldName) {
                        if (input.tagName === 'SELECT') {
                            this.formData[fieldName] = input.value;
                        }
                        else if (input.tagName === 'INPUT') {
                            this.formData[fieldName] = input.value;
                        }
                    }
                });
            });
        }
    }
    handleSave() {
        // Validate required fields
        if (this.validateForm()) {
            if (this.config.onSave) {
                this.config.onSave(this.formData);
            }
        }
    }
    handleCancel() {
        if (this.config.onCancel) {
            this.config.onCancel();
        }
    }
    handleEdit() {
        if (this.config.onEdit) {
            this.config.onEdit();
        }
        else {
            // Default behavior: switch to editable mode
            this.setEditable(true);
        }
    }
    handleDelete() {
        if (this.config.onDelete) {
            this.config.onDelete();
        }
    }
    validateForm() {
        const schema = this.config.schema;
        for (const [fieldName, fieldSchema] of Object.entries(schema)) {
            const field = fieldSchema;
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
    static createFromFirstRecord(sourceData, companyOptions, isEditable = false) {
        if (!sourceData?.positions?.schema || !sourceData?.positions?.data?.[0]) {
            throw new Error('Invalid source data structure');
        }
        const config = {
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
