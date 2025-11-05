// DataGridPaginator - Paginated display of GridDataRow components
// Displays multiple records with pagination controls and new record functionality
// All rows start in read-only state following Master Agent Edict for dual-state components
import { GridDataRow } from './griddatarow.js';
export class DataGridPaginator {
    static cssInjected = false;
    
    static injectCSS() {
        if (DataGridPaginator.cssInjected) return;
        
        const style = document.createElement('style');
        style.id = 'datagrid-paginator-styles';
        style.textContent = `
            .data-grid-paginator {
                font-family: Arial, sans-serif;
                background: white;
                border-radius: 8px;
                padding: 0 0 1px 0;
                margin: 0;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .paginator-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 0;
                padding: 0 0 1px 0;
                border-bottom: 2px solid #e9ecef;
            }
            .paginator-title {
                font-size: 18px;
                font-weight: bold;
                color: #333;
            }
            .paginator-info {
                font-size: 14px;
                color: #666;
            }
            .add-record-btn {
                width: 40px;
                height: 40px;
                border: 2px solid #28a745;
                border-radius: 50%;
                cursor: pointer;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #28a745;
                color: white;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
            }
            .add-record-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 8px rgba(40, 167, 69, 0.4);
                background: #218838;
                border-color: #218838;
            }
            .add-record-btn:active {
                transform: scale(0.95);
            }
            .delete-selected-btn {
                padding: 0 0 1px 0;
                border: 2px solid #dc3545;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #dc3545;
                color: white;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
                font-weight: 500;
            }
            .delete-selected-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 8px rgba(220, 53, 69, 0.4);
                background: #c82333;
                border-color: #c82333;
            }
            .delete-selected-btn:active {
                transform: scale(0.95);
            }
            .records-container {
                display: block;
                min-height: 200px;
                overflow-x: auto;
                padding: 0 0 1px 0;
                margin: 0;
            }
            .header-row {
                display: flex;
                flex-wrap: nowrap;
                gap: 15px;
                align-items: center;
                padding: 0 0 1px 0;
                border-bottom: 2px solid #007bff;
                margin: 0;
                background: #f8f9fa;
                font-weight: bold;
                color: #495057;
                white-space: nowrap;
                min-width: fit-content;
            }
            .header-checkbox {
                display: flex;
                flex-direction: column;
                width: 30px;
                flex-shrink: 0;
                align-items: center;
                justify-content: center;
            }
            .master-checkbox {
                width: 16px;
                height: 16px;
                cursor: pointer;
            }
            .header-field {
                display: flex;
                flex-direction: column;
                width: 120px;
                flex-shrink: 0;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .record-item {
                margin: 0;
                padding: 0 0 1px 0;
                min-width: fit-content;
            }
            .record-content {
                padding: 0;
            }
            .pagination-controls {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
                margin: 0;
                padding: 0 0 1px 0;
                border-top: 1px solid #e9ecef;
                background: #f8f9fa;
                border-radius: 0 0 8px 8px;
                overflow-x: auto;
                white-space: nowrap;
                min-width: fit-content;
                min-height: 30px;
            }
            .pagination-btn {
                padding: 0 0 1px 0;
                border: 1px solid #ccc;
                border-radius: 4px;
                cursor: pointer;
                background: white;
                font-size: 14px;
                transition: all 0.2s;
            }
            .pagination-btn:hover {
                background: #f8f9fa;
                border-color: #007bff;
            }
            .pagination-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background: #e9ecef;
            }
            .pagination-btn.active {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }
            .page-size-container {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-right: 20px;
            }
            .page-size-container label {
                font-size: 14px;
                color: #666;
                white-space: nowrap;
            }
            .page-size-select {
                padding: 4px 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 14px;
                background: white;
                cursor: pointer;
            }
            .page-info {
                font-size: 14px;
                color: #666;
                margin: 0 15px;
            }
            .no-records {
                text-align: center;
                padding: 0 0 1px 0;
                margin: 0;
                color: #666;
                font-style: italic;
            }
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
            .loading-spinner-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                border-radius: 8px;
                backdrop-filter: blur(2px);
            }
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #007bff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 15px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .spinner-message {
                font-size: 14px;
                color: #666;
                font-weight: 500;
                text-align: center;
            }
            .spinner-submessage {
                font-size: 12px;
                color: #999;
                margin-top: 5px;
                text-align: center;
            }
            
            /* Form Mock Styles - Unified Typography and Layout */
            .grid-data-row {
                padding: 0;
                margin: 0;
                border: 0;
                font-family: Arial, sans-serif;
                font-size: 14px;
                line-height: 1.4;
            }

            .grid-data-row * {
                font-family: Arial, sans-serif;
                font-size: 14px;
                line-height: 1.4;
            }

            .row-form {
                display: flex;
                flex-wrap: nowrap;
                gap: 4px;
                align-items: center;
                white-space: nowrap;
            } 

            .action-buttons {
                display: flex;
                gap: 4px;
                align-items: center;
            }

            .record-checkbox {
                width: 16px;
                height: 16px;
                cursor: pointer;
            }

            .btn-emoji {
                width: 24px;
                height: 24px;
                border: 1px solid #ccc;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                line-height: 1.4;
            }

            .btn-save {
                background: #28a745;
                border-color: #28a745;
                color: white;
            }

            .btn-cancel {
                background: #6c757d;
                border-color: #6c757d;
                color: white;
            }

            .field-group {
                display: flex;
                flex-direction: column;
                min-width: 120px;
            }

            /* Phone and calendar fields - fixed smaller width */
            .field-group:has(input[type="tel"]),
            .field-group:has(input[type="date"]),
            .field-group:has(.field-label-display) {
                min-width: 120px;
                max-width: 120px;
                flex-shrink: 0;
            }

            /* Position, company, email fields - dynamic equal width */
            .field-group:has(input[data-field="position"]),
            .field-group:has(select[data-field="company"]),
            .field-group:has(input[data-field="email"]) {
                flex: 1;
                min-width: 150px;
            }

            .field-input {
                padding: 4px 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 14px;
                font-family: Arial, sans-serif;
                line-height: 1.4;
                height: 32px;
                box-sizing: border-box;
            }
            
            .field-input.required {
                border-left: 3px solid #e74c3c;
            }

            .field-select {
                padding: 4px 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 14px;
                font-family: Arial, sans-serif;
                line-height: 1.4;
                height: 32px;
                background: white;
                box-sizing: border-box;
            }

            .field-label-display {
                padding: 4px 8px;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 4px;
                font-size: 14px;
                font-family: Arial, sans-serif;
                line-height: 1.4;
                height: 32px;
                color: #666;
                box-sizing: border-box;
                display: flex;
                align-items: center;
            }
        `;
        
        document.head.appendChild(style);
        DataGridPaginator.cssInjected = true;
    }

    constructor(config) {
        // Inject CSS once for all instances
        DataGridPaginator.injectCSS();
        
        this.currentPage = 1;
        this.totalPages = 1;
        this.gridRows = [];
        this.editingIndex = -1; // Track which row is being edited
        this.selectedIndexes = new Set(); // Track selected checkboxes
        this.masterCheckboxState = false;
        this.showDisabled = false; // Default to show enabled records (normal state)
        this.filteredData = []; // Filtered data based on toggle state
        this.searchTerm = ''; // Current search term
        this.config = config;
        console.log('🔧 DataGridPaginator constructor - initial data sample:', config.data.slice(-1));
        this.pageSize = config.pageSize || 5;
        this.filteredData = this.filterData(); // Initialize filtered data
        this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        this.container = this.createContainer();
        this.render();
    }
    getElement() {
        return this.container;
    }
    getCurrentPage() {
        return this.currentPage;
    }
    getTotalPages() {
        return this.totalPages;
    }
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.render();
        }
    }
    changePageSize(newPageSize) {
        // Clear current selection when changing page size
        this.selectedIndexes.clear();
        this.masterCheckboxState = false;
        this.pageSize = newPageSize;
        this.filteredData = this.filterData();
        this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        // Adjust current page if necessary
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        }
        if (this.totalPages === 0) {
            this.currentPage = 1;
        }
        this.render();
    }
    
    filterData() {
        const filtered = this.config.data.filter(record => {
            // Apply isDisabled filter (soft delete functionality)
            const passesDisabledFilter = this.showDisabled ? 
                (record.isDisabled === true) : 
                (record.isDisabled === false || record.isDisabled === undefined);
            
            if (!passesDisabledFilter) {
                return false;
            }
            
            // If no search term, show records that passed disabled filter
            if (!this.searchTerm || this.searchTerm.trim() === '') {
                return true;
            }
            
            // Apply search filter
            const searchTerm = this.searchTerm.toLowerCase().trim();
            const passesSearchFilter = this.getSearchableFields().some(fieldName => {
                const fieldValue = record[fieldName];
                if (fieldValue === null || fieldValue === undefined) return false;
                return fieldValue.toString().toLowerCase().includes(searchTerm);
            });
            
            return passesSearchFilter;
        });
        
        console.log('🔍 Filter results: showDisabled=', this.showDisabled, 'filtered count=', filtered.length, 'total count=', this.config.data.length);
        return filtered;
    }

    getSearchableFields() {
        if (!this.config.schema) return [];
        
        return Object.keys(this.config.schema).filter(fieldName => {
            const field = this.config.schema[fieldName];
            return field.searchable === true || field.searchable === undefined; // Default to searchable if not specified
        });
    }
    
    toggleDisabledFilter() {
        this.showDisabled = !this.showDisabled;
        this.filteredData = this.filterData();
        this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        this.currentPage = 1; // Reset to first page when toggling
        this.selectedIndexes.clear(); // Clear selections when filtering
        this.masterCheckboxState = false;
        this.render();
    }
    
    handleSearch(searchTerm) {
        this.searchTerm = searchTerm.trim();
        this.filteredData = this.filterData();
        this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        this.currentPage = 1; // Reset to first page when searching
        this.selectedIndexes.clear(); // Clear selections when searching
        this.masterCheckboxState = false;
        this.render();
    }

    addNewRecord(newRecord) {
        console.log('🔍 Adding new record:', newRecord);
        console.log('🔍 Record type check:', typeof newRecord, 'keys:', Object.keys(newRecord));
        
        // BUGFIX: Ensure required properties are present
        if (!newRecord.hasOwnProperty('id')) {
            newRecord.id = Date.now();
            console.log('🔧 Added missing id:', newRecord.id);
        }
        if (!newRecord.hasOwnProperty('isDisabled')) {
            newRecord.isDisabled = false;
            console.log('🔧 Added missing isDisabled:', newRecord.isDisabled);
        }
        
        // Set better default values for dates if not provided
        const today = new Date().toISOString().split('T')[0];
        if (!newRecord.icontact || newRecord.icontact === '') {
            newRecord.icontact = today;
            console.log('📅 Set initial contact date to today:', today);
        }
        if (!newRecord.lcontact || newRecord.lcontact === '') {
            newRecord.lcontact = today;
            console.log('📅 Set last contact date to today:', today);
        }
        
        this.config.data.push(newRecord);
        console.log('🔍 After push - last record:', this.config.data[this.config.data.length - 1]);
        
        // New records are created as enabled (isDisabled: false) and we default to showing enabled records
        // So new records are automatically visible - no filter switching needed
        console.log('📋 New record will be visible (isDisabled: false, showDisabled: false)');
        
        this.filteredData = this.filterData(); // Update filtered data
        console.log('📊 Filtered data length after adding:', this.filteredData.length);
        console.log('📊 Total data length:', this.config.data.length);
        
        this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        // Go to the last page to show the new record
        this.currentPage = this.totalPages;
        console.log('📄 Current page set to:', this.currentPage, 'Total pages:', this.totalPages);
        
        // Automatically enter edit mode for the new record
        const newRecordPageIndex = (this.filteredData.length - 1) % this.pageSize;
        this.editingIndex = newRecordPageIndex;
        console.log('✏️ Setting new record to edit mode - page index:', newRecordPageIndex);
        
        this.render();
    }

    removeRecord(index) {
        const globalIndex = this.getGlobalIndex(index);
        if (globalIndex >= 0 && globalIndex < this.config.data.length) {
            const record = this.config.data[globalIndex];
            
            // Check if custom delete handler is provided
            if (this.config.onDeleteRecord) {
                this.config.onDeleteRecord(globalIndex, record);
            } else {
                // Default behavior: soft delete (set isDisabled = true)
                this.config.data[globalIndex].isDisabled = true;
                this.filteredData = this.filterData(); // Update filtered data
                this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
                // Adjust current page if necessary
                if (this.currentPage > this.totalPages && this.totalPages > 0) {
                    this.currentPage = this.totalPages;
                }
                if (this.totalPages === 0) {
                    this.currentPage = 1;
                }
                this.render();
            }
        }
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'data-grid-paginator';
        return container;
    }
    
    render() {
        console.log('🎨 RENDER START - editingIndex:', this.editingIndex, 'filteredData.length:', this.filteredData.length);
        this.container.innerHTML = `
            <div class="paginator-header">
                <div>
                    <div class="paginator-title">Position Records</div>
                    <div class="paginator-info">
                        ${this.getPaginationInfo()}
                    </div>
                </div>
                ${this.createHeaderButtons()}
            </div>
            
            <div class="records-container">
                ${this.createHeaderRow()}
                ${this.createRecordsDisplay()}
            </div>
            
            ${this.createPaginationControls()}
        `;
        
        console.log('🎨 RENDER END - About to attachEventListeners');
        this.attachEventListeners();
        console.log('🎨 RENDER COMPLETE');
    }

    // Loading spinner functionality (kept in reserve for Ctrl+F5 refresh)
    showLoadingSpinner(message = 'Loading...') {
        const spinner = this.createLoadingSpinner(message);
        this.container.appendChild(spinner);
        console.log('🔄 Loading spinner shown:', message);
        return spinner;
    }

    hideLoadingSpinner() {
        const existingSpinner = this.container.querySelector('.loading-spinner-overlay');
        if (existingSpinner) {
            existingSpinner.remove();
            console.log('🔄 Loading spinner hidden');
        }
    }

    createLoadingSpinner(message) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-spinner-overlay';
        overlay.innerHTML = `
            <style>
                .loading-spinner-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    border-radius: 8px;
                    backdrop-filter: blur(2px);
                }
                
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #007bff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 15px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .spinner-message {
                    font-size: 14px;
                    color: #666;
                    font-weight: 500;
                    text-align: center;
                }
                
                .spinner-submessage {
                    font-size: 12px;
                    color: #999;
                    margin-top: 5px;
                    text-align: center;
                }
            </style>
            <div class="spinner"></div>
            <div class="spinner-message">${message}</div>
            <div class="spinner-submessage">Please wait...</div>
        `;
        return overlay;
    }

    // Demo method for testing spinner (can be removed later)
    testLoadingSpinner() {
        console.log('🧪 Testing loading spinner...');
        const spinner = this.showLoadingSpinner('Refreshing data...');
        
        // Auto-hide after 3 seconds for demo
        setTimeout(() => {
            this.hideLoadingSpinner();
            console.log('🧪 Spinner test completed');
        }, 3000);
    }
    createHeaderRow() {
        if (this.config.data.length === 0) {
            return ''; // No header if no data
        }
        const showCheckboxes = this.config.showCheckboxes ?? false;
        const checkboxHeader = showCheckboxes ? `
            <div class="header-checkbox">
                <input type="checkbox" 
                       class="master-checkbox" 
                       id="masterCheckbox"
                       ${this.masterCheckboxState ? 'checked' : ''} />
            </div>
        ` : '';
        const visibleFields = Object.keys(this.config.schema).filter(fieldName => {
            const field = this.config.schema[fieldName];
            return field.visible !== false;
        });
        const headerFields = visibleFields.map(fieldName => {
            const fieldSchema = this.config.schema[fieldName];
            const displayName = fieldSchema.displayName || fieldName;
            return `
                <div class="header-field">
                    ${displayName}
                </div>
            `;
        }).join('');
        return `
            <div class="header-row">
                ${checkboxHeader}
                ${headerFields}
            </div>
        `;
    }
    createAddButton() {
        return `
            <button class="add-record-btn" id="addRecordBtn" title="Add New Record">
                ➕
            </button>
        `;
    }
    createDeleteSelectedButton() {
        return `
            <button class="delete-selected-btn" id="deleteSelectedBtn" title="Delete Selected Records">
                🗑️ Delete Selected (${this.selectedIndexes.size})
            </button>
        `;
    }
    createHeaderButtons() {
        if (this.selectedIndexes.size > 0) {
            return this.createDeleteSelectedButton();
        }
        else if (this.config.showAddButton !== false) {
            return this.createAddButton();
        }
        return '';
    }
    createRecordsDisplay() {
        console.log('🎯 Creating records display - filteredData.length:', this.filteredData.length);
        if (this.filteredData.length === 0) {
            return `
                <div class="no-records">
                    No records found. Click the ➕ button to add a new record.
                </div>
            `;
        }
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.filteredData.length);
        const pageRecords = this.filteredData.slice(startIndex, endIndex);
        console.log('📄 Page records:', pageRecords.length, 'from', startIndex, 'to', endIndex);
        this.gridRows = []; // Clear existing rows
        return pageRecords.map((record, index) => {
            const globalIndex = startIndex + index;
            const isEditing = this.editingIndex === index;
            const isChecked = this.selectedIndexes.has(globalIndex);
            console.log(`📝 Record ${index}: editingIndex=${this.editingIndex}, isEditing=${isEditing}, record.id=${record.id}`);
            const gridRowConfig = {
                schema: this.config.schema,
                recordData: { ...record }, // Create copy to avoid mutating original
                companyOptions: this.config.companyOptions,
                isEditable: isEditing,
                showCheckbox: this.config.showCheckboxes ?? false,
                isChecked: isChecked,
                onSave: (data) => this.handleSaveRecord(index, data),
                onCancel: () => this.handleCancelEdit(index),
                onEdit: () => this.handleEditRecord(index),
                onDelete: () => this.handleDeleteRecord(index),
                onCheckboxChange: (checked) => this.handleCheckboxChange(globalIndex, checked)
            };
            const gridRow = new GridDataRow(gridRowConfig);
            this.gridRows.push(gridRow);
            return `
                <div class="record-item">
                    <div class="record-content" id="record-${index}">
                        <!-- GridDataRow will be inserted here -->
                    </div>
                </div>
            `;
        }).join('');
    }
    createPaginationControls() {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        data-page="${i}">${i}</button>
            `);
        }
        return `
            <div class="pagination-controls">
                <div class="page-size-container">
                    <label for="pageSizeSelect">Rows per page:</label>
                    <select id="pageSizeSelect" class="page-size-select">
                        <option value="5" ${this.pageSize === 5 ? 'selected' : ''}>5</option>
                        <option value="10" ${this.pageSize === 10 ? 'selected' : ''}>10</option>
                        <option value="15" ${this.pageSize === 15 ? 'selected' : ''}>15</option>
                        <option value="20" ${this.pageSize === 20 ? 'selected' : ''}>20</option>
                    </select>
                </div>
                
                <button class="pagination-btn" id="firstBtn" ${this.currentPage === 1 ? 'disabled' : ''}>
                    First
                </button>
                <button class="pagination-btn" id="prevBtn" ${this.currentPage === 1 ? 'disabled' : ''}>
                    Previous
                </button>
                
                ${pages.join('')}
                
                <button class="pagination-btn" id="nextBtn" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                    Next
                </button>
                <button class="pagination-btn" id="lastBtn" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                    Last
                </button>
                
                <span class="page-info">
                    Page ${this.currentPage} of ${this.totalPages}
                </span>
            </div>
        `;
    }
    getPaginationInfo() {
        const currentData = this.filteredData;
        if (currentData.length === 0) {
            return 'No records';
        }
        const startIndex = (this.currentPage - 1) * this.pageSize + 1;
        const endIndex = Math.min(this.currentPage * this.pageSize, currentData.length);
        const filterInfo = this.filteredData !== this.config.data ?
            ` (filtered from ${this.config.data.length} total)` : '';
        return `Showing ${startIndex}-${endIndex} of ${currentData.length} records${filterInfo}`;
    }
    attachEventListeners() {
        // Add record button
        const addBtn = this.container.querySelector('#addRecordBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.handleAddRecord();
            });
        }
        // Delete selected button
        const deleteSelectedBtn = this.container.querySelector('#deleteSelectedBtn');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', () => {
                this.handleDeleteSelected();
            });
        }
        // Master checkbox
        const masterCheckbox = this.container.querySelector('#masterCheckbox');
        if (masterCheckbox) {
            masterCheckbox.addEventListener('change', (e) => {
                this.handleMasterCheckboxChange(e.target.checked);
            });
        }
        // Pagination buttons
        const firstBtn = this.container.querySelector('#firstBtn');
        if (firstBtn) {
            firstBtn.addEventListener('click', () => this.goToPage(1));
        }
        const prevBtn = this.container.querySelector('#prevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        }
        const nextBtn = this.container.querySelector('#nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        }
        const lastBtn = this.container.querySelector('#lastBtn');
        if (lastBtn) {
            lastBtn.addEventListener('click', () => this.goToPage(this.totalPages));
        }
        // Page number buttons
        const pageButtons = this.container.querySelectorAll('[data-page]');
        pageButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page || '1');
                this.goToPage(page);
            });
        });
        // Page size selector
        const pageSizeSelect = this.container.querySelector('#pageSizeSelect');
        if (pageSizeSelect) { 
            pageSizeSelect.addEventListener('change', (e) => {
                const newPageSize = parseInt(e.target.value);
                this.changePageSize(newPageSize);
            });
        }
        // Insert GridDataRow components
        this.gridRows.forEach((gridRow, index) => {
            const container = this.container.querySelector(`#record-${index}`);
            if (container) {
                container.appendChild(gridRow.getElement());
            }
        });
    }
    handleAddRecord() {
        if (this.config.onNewRecord) {
            this.config.onNewRecord();
        }
        else {
            // Default new record creation
            const newRecord = this.createDefaultNewRecord();
            this.addNewRecord(newRecord);
        }
    }
    handleEditRecord(index) {
        console.log('✏️ handleEditRecord called - index:', index, 'current editingIndex:', this.editingIndex);
        // Cancel any other editing
        if (this.editingIndex !== -1 && this.editingIndex !== index) {
            this.editingIndex = -1;
        }
        this.editingIndex = index;
        console.log('✏️ editingIndex set to:', this.editingIndex);
        this.render(); // Re-render to show edit state
        if (this.config.onEditRecord) {
            const globalIndex = this.getGlobalIndex(index);
            this.config.onEditRecord(globalIndex, this.config.data[globalIndex]);
        }
    }
    handleSaveRecord(index, data) {
        console.log('💾 handleSaveRecord called - index:', index, 'editingIndex before:', this.editingIndex);
        const globalIndex = this.getGlobalIndex(index);
        if (globalIndex >= 0 && globalIndex < this.config.data.length) {
            // Update the original data
            Object.assign(this.config.data[globalIndex], data);
            
            // Exit edit mode
            this.editingIndex = -1;
            console.log('💾 editingIndex set to -1, re-rendering...');
            
            this.render(); // Re-render to show read-only state
            if (this.config.onSaveRecord) {
                this.config.onSaveRecord(globalIndex, data);
            }
        }
    }
    handleCancelEdit(index) {
        this.editingIndex = -1;
        this.render(); // Re-render to show read-only state
    }
    handleDeleteRecord(index) {
        const globalIndex = this.getGlobalIndex(index);
        if (this.config.onDeleteRecord) {
            this.config.onDeleteRecord(globalIndex, this.config.data[globalIndex]);
        }
        else {
            // Default delete behavior
            if (confirm('Are you sure you want to delete this record?')) {
                this.removeRecord(index);
            }
        }
    }
    getGlobalIndex(pageIndex) {
        return (this.currentPage - 1) * this.pageSize + pageIndex;
    }
    createDefaultNewRecord() {
        const newRecord = {};
        // Initialize with empty values based on schema
        Object.keys(this.config.schema).forEach(fieldName => {
            const field = this.config.schema[fieldName];
            if (field.visible !== false) {
                switch (fieldName) {
                    case 'icontact':
                        newRecord[fieldName] = new Date().toISOString().split('T')[0]; // Today's date
                        break;
                    case 'lcontact':
                        newRecord[fieldName] = new Date().toISOString().split('T')[0]; // Today's date
                        break;
                    default:
                        newRecord[fieldName] = '';
                }
            }
        });
        return newRecord;
    }
    handleCheckboxChange(globalIndex, checked) {
        if (checked) {
            this.selectedIndexes.add(globalIndex);
        }
        else {
            this.selectedIndexes.delete(globalIndex);
        }
        // Update master checkbox state based on visible page records
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.config.data.length);
        let allVisibleSelected = true;
        for (let i = startIndex; i < endIndex; i++) {
            if (!this.selectedIndexes.has(i)) {
                allVisibleSelected = false;
                break;
            }
        }
        this.masterCheckboxState = allVisibleSelected && (endIndex > startIndex);
        // Re-render to update header buttons and master checkbox
        this.render();
        if (this.config.onSelectionChange) {
            this.config.onSelectionChange(Array.from(this.selectedIndexes));
        }
    }
    handleMasterCheckboxChange(checked) {
        this.masterCheckboxState = checked;
        // Calculate the range of visible records on current page
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.config.data.length);
        if (checked) {
            // Select only visible page records
            for (let i = startIndex; i < endIndex; i++) {
                this.selectedIndexes.add(i);
            }
        }
        else {
            // Deselect only visible page records
            for (let i = startIndex; i < endIndex; i++) {
                this.selectedIndexes.delete(i);
            }
        }
        // Re-render to update all checkboxes and header buttons
        this.render();
        if (this.config.onSelectionChange) {
            this.config.onSelectionChange(Array.from(this.selectedIndexes));
        }
    }
    handleDeleteSelected() {
        try {
            if (this.selectedIndexes.size === 0)
                return;
            const selectedArray = Array.from(this.selectedIndexes).sort((a, b) => b - a);
            if (this.config.onDeleteSelected) {
                this.config.onDeleteSelected(selectedArray);
            }
            else {
                // Default behavior: confirm and delete
                if (confirm(`Delete ${this.selectedIndexes.size} selected record(s)?`)) {
                    // Remove records in reverse order to maintain indexes
                    selectedArray.forEach(index => {
                        this.config.data.splice(index, 1);
                    });
                    // Clear selection and update pagination
                    this.selectedIndexes.clear();
                    this.masterCheckboxState = false;
                    this.totalPages = Math.ceil(this.config.data.length / this.pageSize);
                    // Adjust current page if necessary
                    if (this.currentPage > this.totalPages && this.totalPages > 0) {
                        this.currentPage = this.totalPages;
                    }
                    if (this.totalPages === 0) {
                        this.currentPage = 1;
                    }
                    this.render();
                }
            }
        } catch (error) {
            console.error('Error in handleDeleteSelected:', error);
            alert('An error occurred while deleting selected records. Please try again.');
        }
    }
    // Static factory method following Master Agent Edict for static factory patterns
    static createFromData(sourceData, config) {
        if (!sourceData?.positions?.schema || !sourceData?.positions?.data) {
            throw new Error('Invalid source data structure - missing positions.schema or positions.data');
        }
        const paginatorConfig = {
            schema: sourceData.positions.schema,
            data: sourceData.positions.data,
            companyOptions: config?.companyOptions || [
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
            ],
            pageSize: config?.pageSize || 5,
            showAddButton: config?.showAddButton !== false,
            showCheckboxes: config?.showCheckboxes !== false,
            ...config
        };
        return new DataGridPaginator(paginatorConfig);
    }
}
