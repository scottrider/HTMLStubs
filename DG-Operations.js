/**
 * DataGrid Core Engine - CRUD Operations & State Management
 * Extension of DG.js with specific operation implementations
 */

// Extend the DataGrid class with CRUD operations
Object.assign(DataGrid.prototype, {

    /**
     * Start editing a record
     */
    startEdit(index) {
        if (this.editingIndex !== -1) {
            this.cancelEdit();
        }

        this.editingIndex = index;
        this.originalRecordData = { ...this.data[index] };
        this.render();
        
        dgLogger.debug(`Started editing record at index ${index}`);
    },

    /**
     * Save edited record
     */
    saveEdit(index) {
        try {
            const rowElement = this.container.querySelector(`[data-index="${index}"]`);
            const formData = this.collectFormData(rowElement);
            
            // Validate required fields
            const validation = this.validateRecord(formData);
            if (!validation.isValid) {
                alert(`Validation failed: ${validation.errors.join(', ')}`);
                return;
            }

            // Update the record
            Object.assign(this.data[index], formData);
            this.editingIndex = -1;
            this.originalRecordData = null;
            
            this.render();
            this.notifyDataChange();
            
            dgLogger.info(`Record saved at index ${index}`);
        } catch (error) {
            dgLogger.error('Error saving record:', error);
            alert('Failed to save record');
        }
    },

    /**
     * Cancel editing
     */
    cancelEdit() {
        if (this.editingIndex !== -1 && this.originalRecordData) {
            this.data[this.editingIndex] = this.originalRecordData;
            this.editingIndex = -1;
            this.originalRecordData = null;
            this.render();
            
            dgLogger.debug('Edit cancelled');
        }
    },

    /**
     * Delete a record (soft delete if toggle enabled, hard delete otherwise)
     */
    deleteRecord(index) {
        if (!confirm('Are you sure you want to delete this record?')) {
            return;
        }

        try {
            if (this.config.enableToggle) {
                // Soft delete - mark as disabled
                this.data[index].isDisabled = true;
                dgLogger.info(`Record soft deleted at index ${index}`);
            } else {
                // Hard delete - remove from array
                this.data.splice(index, 1);
                dgLogger.info(`Record hard deleted at index ${index}`);
            }

            this.selectedRecords.delete(index);
            this.calculatePagination();
            this.render();
            this.notifyDataChange();
            
        } catch (error) {
            dgLogger.error('Error deleting record:', error);
            alert('Failed to delete record');
        }
    },

    /**
     * Add a new item to the data array
     */
    addItem(item) {
        try {
            // Generate ID if not provided
            if (!item.id) {
                item.id = this.generatePrimaryKey();
            }

            // Validate the item
            const validation = this.validateRecord(item);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Add to data array
            this.data.push(item);
            
            // Recalculate pagination
            this.calculatePagination();
            
            // Re-render the grid
            this.render();
            
            // Notify of change
            this.notifyDataChange();
            
            dgLogger.info('Item added successfully', item);
            return true;
            
        } catch (error) {
            dgLogger.error('Error adding item:', error);
            throw error;
        }
    },

    /**
     * Update an existing item in the data array
     */
    updateItem(index, updatedItem) {
        try {
            if (index < 0 || index >= this.data.length) {
                throw new Error('Invalid index');
            }

            // Validate the updated item
            const validation = this.validateRecord(updatedItem);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Update the item
            Object.assign(this.data[index], updatedItem);
            
            // Re-render the grid
            this.render();
            
            // Notify of change
            this.notifyDataChange();
            
            dgLogger.info(`Item updated at index ${index}`, updatedItem);
            return true;
            
        } catch (error) {
            dgLogger.error('Error updating item:', error);
            throw error;
        }
    },

    /**
     * Remove an item from the data array
     */
    removeItem(index) {
        try {
            if (index < 0 || index >= this.data.length) {
                throw new Error('Invalid index');
            }

            const removedItem = this.data.splice(index, 1)[0];
            
            // Clear selection for removed item
            this.selectedRecords.delete(index);
            
            // Recalculate pagination
            this.calculatePagination();
            
            // Re-render the grid
            this.render();
            
            // Notify of change
            this.notifyDataChange();
            
            dgLogger.info(`Item removed at index ${index}`, removedItem);
            return removedItem;
            
        } catch (error) {
            dgLogger.error('Error removing item:', error);
            throw error;
        }
    },

    /**
     * Show the add form
     */
    showForm() {
        this.clearForm();
        const formContainer = this.container.querySelector('.DG-form-container');
        formContainer.style.display = 'block';
        
        dgLogger.debug('Add form shown');
    },

    /**
     * Hide the add form
     */
    hideForm() {
        const formContainer = this.container.querySelector('.DG-form-container');
        formContainer.style.display = 'none';
        
        dgLogger.debug('Add form hidden');
    },

    /**
     * Save form data as new record
     */
    saveForm() {
        try {
            const formContainer = this.container.querySelector('.DG-form-container');
            const formData = this.collectFormData(formContainer);
            
            // Validate required fields
            const validation = this.validateRecord(formData);
            if (!validation.isValid) {
                alert(`Validation failed: ${validation.errors.join(', ')}`);
                return;
            }

            // Generate primary key if needed
            if (!formData[this.primaryKey]) {
                formData[this.primaryKey] = this.generatePrimaryKey();
            }

            // Add isDisabled field if toggle is enabled
            if (this.config.enableToggle) {
                formData.isDisabled = false;
            }

            this.data.push(formData);
            this.hideForm();
            this.calculatePagination();
            this.render();
            this.notifyDataChange();
            
            dgLogger.info('New record added via form');
        } catch (error) {
            dgLogger.error('Error saving form:', error);
            alert('Failed to save record');
        }
    },

    /**
     * Clear form fields
     */
    clearForm() {
        const formContainer = this.container.querySelector('.DG-form-container');
        const inputs = formContainer.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
    },

    /**
     * Collect form data from container
     */
    collectFormData(container) {
        const formData = {};
        const inputs = container.querySelectorAll('[data-field]');
        
        inputs.forEach(input => {
            const fieldName = input.dataset.field;
            const fieldConfig = this.config.schema[fieldName];
            
            if (!fieldConfig) return;
            
            let value = input.value;
            
            // Type conversion
            switch (fieldConfig.type) {
                case 'number':
                    value = value ? parseFloat(value) : null;
                    break;
                case 'boolean':
                    value = input.checked;
                    break;
                case 'date':
                    value = value || null;
                    break;
                default:
                    value = value || '';
            }
            
            formData[fieldName] = value;
        });
        
        return formData;
    },

    /**
     * Validate record data against schema
     */
    validateRecord(data) {
        const errors = [];
        
        for (const [fieldName, fieldConfig] of Object.entries(this.config.schema)) {
            const value = data[fieldName];
            
            // Check required fields
            if (fieldConfig.required && (value === null || value === undefined || value === '')) {
                errors.push(`${fieldConfig.displayName || fieldName} is required`);
            }
            
            // Type validation
            if (value !== null && value !== undefined && value !== '') {
                switch (fieldConfig.type) {
                    case 'email':
                        if (!/\S+@\S+\.\S+/.test(value)) {
                            errors.push(`${fieldConfig.displayName || fieldName} must be a valid email`);
                        }
                        break;
                    case 'url':
                        if (!/^https?:\/\/.+/.test(value)) {
                            errors.push(`${fieldConfig.displayName || fieldName} must be a valid URL`);
                        }
                        break;
                    case 'number':
                        if (isNaN(value)) {
                            errors.push(`${fieldConfig.displayName || fieldName} must be a number`);
                        }
                        break;
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Generate primary key for new records
     */
    generatePrimaryKey() {
        const existingKeys = this.data.map(record => record[this.primaryKey]);
        const maxKey = Math.max(...existingKeys.filter(key => typeof key === 'number'), 0);
        return maxKey + 1;
    },

    /**
     * Handle record selection checkbox
     */
    handleRecordSelection(event) {
        const index = parseInt(event.target.dataset.index);
        
        if (event.target.checked) {
            this.selectedRecords.add(index);
        } else {
            this.selectedRecords.delete(index);
        }
        
        this.updateMasterCheckbox();
        this.renderHeader();
        this.notifySelectionChange();
        
        dgLogger.debug(`Record ${index} selection changed: ${event.target.checked}`);
    },

    /**
     * Handle master checkbox
     */
    handleMasterCheckbox(event) {
        const pageData = this.getCurrentPageData();
        
        pageData.forEach(record => {
            const globalIndex = this.getGlobalIndex(record);
            
            if (event.target.checked) {
                this.selectedRecords.add(globalIndex);
            } else {
                this.selectedRecords.delete(globalIndex);
            }
        });
        
        this.renderHeader();
        this.updateRecordCheckboxes();
        this.notifySelectionChange();
        
        dgLogger.debug(`Master checkbox changed: ${event.target.checked}`);
    },

    /**
     * Update master checkbox state
     */
    updateMasterCheckbox() {
        const masterCheckbox = this.container.querySelector('.DG-master-checkbox');
        if (!masterCheckbox) return;
        
        const pageData = this.getCurrentPageData();
        const pageIndexes = pageData.map(record => this.getGlobalIndex(record));
        
        const selectedOnPage = pageIndexes.filter(index => this.selectedRecords.has(index));
        
        if (selectedOnPage.length === 0) {
            masterCheckbox.checked = false;
            masterCheckbox.indeterminate = false;
        } else if (selectedOnPage.length === pageIndexes.length) {
            masterCheckbox.checked = true;
            masterCheckbox.indeterminate = false;
        } else {
            masterCheckbox.checked = false;
            masterCheckbox.indeterminate = true;
        }
    },

    /**
     * Update individual record checkboxes
     */
    updateRecordCheckboxes() {
        const checkboxes = this.container.querySelectorAll('.DG-record-checkbox');
        checkboxes.forEach(checkbox => {
            const index = parseInt(checkbox.dataset.index);
            checkbox.checked = this.selectedRecords.has(index);
        });
    },

    /**
     * Handle bulk toggle (delete/restore selected)
     */
    handleBulkToggle() {
        if (this.selectedRecords.size === 0) {
            alert('No records selected');
            return;
        }

        const action = this.viewingEnabled ? 'delete' : 'restore';
        const confirmMessage = `Are you sure you want to ${action} ${this.selectedRecords.size} selected record(s)?`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            Array.from(this.selectedRecords).forEach(index => {
                if (this.data[index]) {
                    this.data[index].isDisabled = this.viewingEnabled;
                }
            });

            this.selectedRecords.clear();
            this.calculatePagination();
            this.render();
            this.notifyDataChange();
            
            dgLogger.info(`Bulk ${action} completed for ${this.selectedRecords.size} records`);
        } catch (error) {
            dgLogger.error(`Error during bulk ${action}:`, error);
            alert(`Failed to ${action} selected records`);
        }
    },

    /**
     * Handle search input
     */
    handleSearch(searchTerm) {
        this.searchTerm = searchTerm.trim();
        this.currentPage = 1;
        this.calculatePagination();
        this.render();
        
        dgLogger.debug(`Search performed: "${this.searchTerm}"`);
    },

    /**
     * Clear search
     */
    clearSearch() {
        this.searchTerm = '';
        this.currentPage = 1;
        this.calculatePagination();
        this.render();
        
        dgLogger.debug('Search cleared');
    },

    /**
     * Handle toggle between enabled/disabled view
     */
    handleToggle(event) {
        this.viewingEnabled = event.target.checked;
        this.selectedRecords.clear();
        this.currentPage = 1;
        this.calculatePagination();
        this.render();
        
        dgLogger.info(`Toggle changed to: ${this.viewingEnabled ? 'enabled' : 'disabled'} view`);
    },

    /**
     * Go to specific page
     */
    goToPage(page) {
        if (page < 1 || page > this.totalPages) {
            return;
        }
        
        this.currentPage = page;
        this.render();
        
        dgLogger.debug(`Navigated to page ${page}`);
    },

    /**
     * Change page size
     */
    changePageSize(newSize) {
        this.config.pageSize = newSize;
        this.currentPage = 1;
        this.calculatePagination();
        this.render();
        
        dgLogger.debug(`Page size changed to ${newSize}`);
    }
});