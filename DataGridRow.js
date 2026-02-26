/**
 * DataGridRow - Row management and form operations for DataGrid
 * Component for handling row-form interactions, editing state, and field management
 */

const rowLogger = window.DataGridNamespace?.logger || { 
    debug: () => {},
    info: console.info,
    warn: console.warn,
    error: console.error
};

/**
 * Apply dimensions to row-form field elements
 */
function applyRowFormDimensions(schema) {
    const rowFormElement = document.querySelector('.row-form');

    if (!rowFormElement) {
        rowLogger.debug('Row-form element not found for CSS dimension application');
        return;
    }

    if (!schema || typeof schema !== 'object') {
        rowLogger.warn('applyRowFormDimensions: invalid schema provided');
        return;
    }

    // Apply dimensions to individual form fields based on schema
    Object.entries(schema).forEach(([fieldName, fieldConfig]) => {
        if (!fieldConfig?.css) {
            return;
        }

        // Find form elements with data-field attribute matching the field name
        const fieldElements = rowFormElement.querySelectorAll(`[data-field="${fieldName}"]`);

        fieldElements.forEach(element => {
            const { width, height, minWidth, maxWidth, minHeight, maxHeight } = fieldConfig.css;

            if (width) {
                element.style.width = width;
            }
            if (height) {
                element.style.height = height;
            }
            if (minWidth) {
                element.style.minWidth = minWidth;
            }
            if (maxWidth) {
                element.style.maxWidth = maxWidth;
            }
            if (minHeight) {
                element.style.minHeight = minHeight;
            }
            if (maxHeight) {
                element.style.maxHeight = maxHeight;
            }
        });
    });

    rowLogger.debug('Row-form field dimensions applied from schema');
}

/**
 * Clear method for datagrid-checkbox - clears all row-form children values
 */
function clearRowForm() {
    const checkbox = document.querySelector('input[name="datagrid-checkbox"]');
    if (checkbox && checkbox.checked) {
        const rowForm = checkbox.closest('.row-form');
        if (rowForm) {
            // Clear all input fields
            rowForm.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="number"], textarea')
                .forEach(input => {
                    input.value = '';
                });

            // Reset select fields to first option
            rowForm.querySelectorAll('select').forEach(select => {
                select.selectedIndex = 0;
            });
            
            // Clear label displays
            rowForm.querySelectorAll('.field-label-display').forEach(label => {
                label.textContent = '';
            });
            
            // Uncheck the checkbox after clearing
            checkbox.checked = false;
            
            // Reset editing index if needed
            if (typeof editingIndex !== 'undefined') {
                editingIndex = -1;
            }
            
            rowLogger.debug('Row form cleared');
        }
    }
}

/**
 * DataGridRow class for managing individual row operations
 */
class DataGridRow {
    constructor(element, data = {}, options = {}) {
        this.element = typeof element === 'string' ? document.querySelector(element) : element;
        if (!this.element) {
            throw new Error('DataGridRow: Element not found');
        }
        
        this.data = data;
        this.options = {
            editable: options.editable !== false, // Default to true
            selectable: options.selectable !== false, // Default to true
            ...options
        };
        
        this.isEditing = false;
        this.isSelected = false;
        
        this.init();
    }
    
    init() {
        // Add row classes
        this.element.classList.add('DataGrid__row');
        
        // Set up event handlers
        this.bindEvents();
        
        // Initialize state
        this.updateDisplay();
    }
    
    bindEvents() {
        // Handle click events for selection
        if (this.options.selectable) {
            this.element.addEventListener('click', (e) => {
                if (!e.target.closest('.DataGrid__cell--actions')) {
                    this.toggleSelection();
                }
            });
        }
        
        // Handle edit/save/cancel buttons if present
        this.element.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-edit')) {
                this.startEdit();
            } else if (e.target.classList.contains('btn-save')) {
                this.saveEdit();
            } else if (e.target.classList.contains('btn-cancel')) {
                this.cancelEdit();
            } else if (e.target.classList.contains('btn-delete')) {
                this.delete();
            }
        });
    }
    
    updateDisplay() {
        // Update row state classes
        this.element.classList.toggle('DataGrid__row--editing', this.isEditing);
        this.element.classList.toggle('DataGrid__row--selected', this.isSelected);
    }
    
    select() {
        this.isSelected = true;
        this.updateDisplay();
        
        // Dispatch selection event
        this.element.dispatchEvent(new CustomEvent('row-selected', {
            detail: { row: this, data: this.data },
            bubbles: true
        }));
    }
    
    deselect() {
        this.isSelected = false;
        this.updateDisplay();
        
        // Dispatch deselection event
        this.element.dispatchEvent(new CustomEvent('row-deselected', {
            detail: { row: this, data: this.data },
            bubbles: true
        }));
    }
    
    toggleSelection() {
        if (this.isSelected) {
            this.deselect();
        } else {
            this.select();
        }
    }
    
    startEdit() {
        if (!this.options.editable || this.isEditing) {
            return;
        }
        
        this.isEditing = true;
        this.originalData = { ...this.data };
        this.updateDisplay();
        
        // Convert display cells to input fields
        this.convertToEditMode();
        
        // Dispatch edit start event
        this.element.dispatchEvent(new CustomEvent('row-edit-start', {
            detail: { row: this, data: this.data },
            bubbles: true
        }));
    }
    
    saveEdit() {
        if (!this.isEditing) {
            return;
        }
        
        // Extract data from form fields
        const updatedData = this.extractFormData();
        
        // Validate data
        if (!this.validateData(updatedData)) {
            return;
        }
        
        // Update data
        this.data = { ...this.data, ...updatedData };
        
        // Exit edit mode
        this.isEditing = false;
        this.updateDisplay();
        
        // Convert back to display mode
        this.convertToDisplayMode();
        
        // Dispatch save event
        this.element.dispatchEvent(new CustomEvent('row-saved', {
            detail: { row: this, data: this.data, originalData: this.originalData },
            bubbles: true
        }));
        
        delete this.originalData;
    }
    
    cancelEdit() {
        if (!this.isEditing) {
            return;
        }
        
        // Restore original data
        this.data = { ...this.originalData };
        
        // Exit edit mode
        this.isEditing = false;
        this.updateDisplay();
        
        // Convert back to display mode
        this.convertToDisplayMode();
        
        // Dispatch cancel event
        this.element.dispatchEvent(new CustomEvent('row-edit-cancelled', {
            detail: { row: this, data: this.data },
            bubbles: true
        }));
        
        delete this.originalData;
    }
    
    delete() {
        // Dispatch delete event (let parent handle actual deletion)
        this.element.dispatchEvent(new CustomEvent('row-delete', {
            detail: { row: this, data: this.data },
            bubbles: true
        }));
    }
    
    convertToEditMode() {
        // Find all data cells and convert to input fields
        const cells = this.element.querySelectorAll('.DataGrid__cell[data-field]');
        
        cells.forEach(cell => {
            const fieldName = cell.getAttribute('data-field');
            const currentValue = this.data[fieldName] || '';
            
            // Skip action cells
            if (cell.classList.contains('DataGrid__cell--actions')) {
                return;
            }
            
            // Create appropriate input element
            const input = this.createInputForField(fieldName, currentValue);
            
            // Store original content
            cell.setAttribute('data-original-content', cell.innerHTML);
            
            // Replace content with input
            cell.innerHTML = '';
            cell.appendChild(input);
            
            // Focus first input
            if (cell === cells[0] && input.focus) {
                setTimeout(() => input.focus(), 10);
            }
        });
    }
    
    convertToDisplayMode() {
        // Find all cells with inputs and convert back to display
        const cells = this.element.querySelectorAll('.DataGrid__cell[data-field]');
        
        cells.forEach(cell => {
            const fieldName = cell.getAttribute('data-field');
            const value = this.data[fieldName] || '';
            
            // Skip action cells
            if (cell.classList.contains('DataGrid__cell--actions')) {
                return;
            }
            
            // Restore display content
            cell.innerHTML = this.formatDisplayValue(fieldName, value);
        });
    }
    
    createInputForField(fieldName, value) {
        // Create appropriate input based on field type
        let input;
        
        if (fieldName === 'email') {
            input = document.createElement('input');
            input.type = 'email';
        } else if (fieldName.includes('phone') || fieldName.includes('Phone')) {
            input = document.createElement('input');
            input.type = 'tel';
        } else if (fieldName.includes('date') || fieldName.includes('Date')) {
            input = document.createElement('input');
            input.type = 'date';
        } else {
            input = document.createElement('input');
            input.type = 'text';
        }
        
        input.value = value;
        input.className = 'DataGrid__input';
        input.setAttribute('data-field', fieldName);
        
        return input;
    }
    
    extractFormData() {
        const data = {};
        const inputs = this.element.querySelectorAll('.DataGrid__input[data-field]');
        
        inputs.forEach(input => {
            const fieldName = input.getAttribute('data-field');
            data[fieldName] = input.value;
        });
        
        return data;
    }
    
    validateData(data) {
        // Basic validation - can be extended
        for (const [field, value] of Object.entries(data)) {
            if (field === 'email' && value && !this.isValidEmail(value)) {
                alert(`Invalid email format: ${value}`);
                return false;
            }
        }
        
        return true;
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    formatDisplayValue(fieldName, value) {
        // Format values for display
        if (!value) return '';
        
        if (fieldName === 'email' && value) {
            return `<a href="mailto:${value}">${value}</a>`;
        }
        
        if ((fieldName.includes('phone') || fieldName.includes('Phone')) && value) {
            return `<a href="tel:${value}">${value}</a>`;
        }
        
        return value;
    }
    
    getData() {
        return { ...this.data };
    }
    
    setData(newData) {
        this.data = { ...this.data, ...newData };
        if (!this.isEditing) {
            this.convertToDisplayMode();
        }
    }
    
    destroy() {
        // Remove event listeners and clean up
        this.element.remove();
    }
    
    // Static methods
    static createFromData(data, options = {}) {
        // Create a new row element with data
        const row = document.createElement('tr');
        row.className = 'DataGrid__row';
        
        // Create row instance
        const instance = new DataGridRow(row, data, options);
        
        return instance;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataGridRow, applyRowFormDimensions, clearRowForm };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.DataGridRow = DataGridRow;
    window.applyRowFormDimensions = applyRowFormDimensions;
    window.clearRowForm = clearRowForm;
}