// DataGridPaginator - Paginated display of GridDataRow components
// Displays multiple records with pagination controls and new record functionality
// All rows start in read-only state following Master Agent Edict for dual-state components

import { GridDataRow, GridDataRowConfig } from './griddatarow.js';

export interface DataGridPaginatorConfig {
    schema: any;
    data: any[];
    companyOptions?: string[];
    pageSize?: number;
    showAddButton?: boolean;
    showCheckboxes?: boolean;
    onNewRecord?: () => void;
    onEditRecord?: (index: number, record: any) => void;
    onDeleteRecord?: (index: number, record: any) => void;
    onSaveRecord?: (index: number, record: any) => void;
    onSelectionChange?: (selectedIndexes: number[]) => void;
    onDeleteSelected?: (selectedIndexes: number[]) => void;
}

export class DataGridPaginator {
    private config: DataGridPaginatorConfig;
    private container: HTMLElement;
    private currentPage: number = 1;
    private totalPages: number = 1;
    private pageSize: number;
    private gridRows: GridDataRow[] = [];
    private editingIndex: number = -1; // Track which row is being edited
    private selectedIndexes: Set<number> = new Set(); // Track selected checkboxes
    private masterCheckboxState: boolean = false;
    private showDisabled: boolean = false; // Toggle state for enabled/disabled filter
    private filteredData: any[] = []; // Filtered data based on toggle state

    constructor(config: DataGridPaginatorConfig) {
        this.config = config;
        this.pageSize = config.pageSize || 5;
        this.filteredData = this.filterData(); // Initialize filtered data
        this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        this.container = this.createContainer();
        this.render();
    }

    public getElement(): HTMLElement {
        return this.container;
    }

    public getCurrentPage(): number {
        return this.currentPage;
    }

    public getTotalPages(): number {
        return this.totalPages;
    }

    public goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.render();
        }
    }

    public changePageSize(newPageSize: number): void {
        // Clear current selection when changing page size
        this.selectedIndexes.clear();
        this.masterCheckboxState = false;
        
        this.pageSize = newPageSize;
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

    private filterData(): any[] {
        return this.config.data.filter(record => {
            // Show only enabled records (isDisabled = false) by default
            // When showDisabled is true, show only disabled records (isDisabled = true)
            return this.showDisabled ? (record.isDisabled === true) : (record.isDisabled === false);
        });
    }

    public toggleDisabledFilter(): void {
        this.showDisabled = !this.showDisabled;
        this.filteredData = this.filterData();
        this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        this.currentPage = 1; // Reset to first page when toggling
        this.selectedIndexes.clear(); // Clear selections when filtering
        this.masterCheckboxState = false;
        this.render();
    }

    public addNewRecord(newRecord: any): void {
        this.config.data.push(newRecord);
        this.filterData(); // Update filtered data
        this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        // Go to the last page to show the new record
        this.currentPage = this.totalPages;
        this.render();
    }

    public removeRecord(index: number): void {
        const globalIndex = this.getGlobalIndex(index);
        if (globalIndex >= 0 && globalIndex < this.config.data.length) {
            // Soft delete: set isDisabled = true instead of removing record
            this.config.data[globalIndex].isDisabled = true;
            this.filterData(); // Update filtered data
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

    private createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'data-grid-paginator';
        return container;
    }

    private render(): void {
        this.container.innerHTML = `
            <style>
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
                }
                .pagination-btn {
                    padding: 2px;
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
                .toggle-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-top: 5px;
                }
                .toggle-switch {
                    position: relative;
                    width: 50px;
                    height: 24px;
                    background: #ccc;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                .toggle-switch.active {
                    background: #ff6b6b;
                }
                .toggle-slider {
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                    transition: transform 0.3s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .toggle-switch.active .toggle-slider {
                    transform: translateX(26px);
                }
                .toggle-label {
                    font-size: 14px;
                    color: #666;
                    user-select: none;
                }
            </style>
            
            <div class="paginator-header">
                <div>
                    <div class="paginator-title">Position Records</div>
                    <div class="paginator-info">
                        ${this.getPaginationInfo()}
                    </div>
                    <div class="toggle-container">
                        <span class="toggle-label">Show Enabled Only</span>
                        <div class="toggle-switch ${this.showDisabled ? 'active' : ''}" data-toggle="disabled-filter">
                            <div class="toggle-slider"></div>
                        </div>
                        <span class="toggle-label">Show Disabled Only</span>
                    </div>
                </div>
                ${this.createHeaderButtons()}
            </div>
            
            <div class="records-container">
                ${this.createHeaderRow()}
                ${this.createRecordsDisplay()}
            </div>
            
            ${this.totalPages > 1 ? this.createPaginationControls() : ''}
        `;

        this.attachEventListeners();
    }

    private createHeaderRow(): string {
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

    private createAddButton(): string {
        return `
            <button class="add-record-btn" id="addRecordBtn" title="Add New Record">
                ➕
            </button>
        `;
    }

    private createDeleteSelectedButton(): string {
        return `
            <button class="delete-selected-btn" id="deleteSelectedBtn" title="Delete Selected Records">
                🗑️ Delete Selected (${this.selectedIndexes.size})
            </button>
        `;
    }

    private createHeaderButtons(): string {
        if (this.selectedIndexes.size > 0) {
            return this.createDeleteSelectedButton();
        } else if (this.config.showAddButton !== false) {
            return this.createAddButton();
        }
        return '';
    }

    private createRecordsDisplay(): string {
        if (this.config.data.length === 0) {
            return `
                <div class="no-records">
                    No records found. Click the ➕ button to add a new record.
                </div>
            `;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.filteredData.length);
        const pageRecords = this.filteredData.slice(startIndex, endIndex);

        this.gridRows = []; // Clear existing rows

        return pageRecords.map((record, index) => {
            const globalIndex = startIndex + index;
            const isEditing = this.editingIndex === index;
            const isChecked = this.selectedIndexes.has(globalIndex);
            
            const gridRowConfig: GridDataRowConfig = {
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

    private createPaginationControls(): string {
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

    private getPaginationInfo(): string {
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

    private attachEventListeners(): void {
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
                this.handleMasterCheckboxChange((e.target as HTMLInputElement).checked);
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
                const page = parseInt((e.target as HTMLElement).dataset.page || '1');
                this.goToPage(page);
            });
        });

        // Page size selector
        const pageSizeSelect = this.container.querySelector('#pageSizeSelect');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                const newPageSize = parseInt((e.target as HTMLSelectElement).value);
                this.changePageSize(newPageSize);
            });
        }

        // Toggle switch for disabled filter
        const toggleSwitch = this.container.querySelector('[data-toggle="disabled-filter"]');
        if (toggleSwitch) {
            toggleSwitch.addEventListener('click', () => {
                this.toggleDisabledFilter();
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

    private handleAddRecord(): void {
        if (this.config.onNewRecord) {
            this.config.onNewRecord();
        } else {
            // Default new record creation
            const newRecord = this.createDefaultNewRecord();
            this.addNewRecord(newRecord);
        }
    }

    private handleEditRecord(index: number): void {
        // Cancel any other editing
        if (this.editingIndex !== -1 && this.editingIndex !== index) {
            this.editingIndex = -1;
        }
        
        this.editingIndex = index;
        this.render(); // Re-render to show edit state
        
        if (this.config.onEditRecord) {
            const globalIndex = this.getGlobalIndex(index);
            this.config.onEditRecord(globalIndex, this.config.data[globalIndex]);
        }
    }

    private handleSaveRecord(index: number, data: any): void {
        const globalIndex = this.getGlobalIndex(index);
        if (globalIndex >= 0 && globalIndex < this.config.data.length) {
            // Update the original data
            Object.assign(this.config.data[globalIndex], data);
            
            // Exit edit mode
            this.editingIndex = -1;
            this.render(); // Re-render to show read-only state
            
            if (this.config.onSaveRecord) {
                this.config.onSaveRecord(globalIndex, data);
            }
        }
    }

    private handleCancelEdit(index: number): void {
        this.editingIndex = -1;
        this.render(); // Re-render to show read-only state
    }

    private handleDeleteRecord(index: number): void {
        const globalIndex = this.getGlobalIndex(index);
        
        if (this.config.onDeleteRecord) {
            this.config.onDeleteRecord(globalIndex, this.config.data[globalIndex]);
        } else {
            // Default soft delete behavior
            if (confirm('Are you sure you want to mark this record as disabled?')) {
                this.removeRecord(index);
            }
        }
    }

    private getGlobalIndex(pageIndex: number): number {
        const filteredIndex = (this.currentPage - 1) * this.pageSize + pageIndex;
        if (filteredIndex >= this.filteredData.length) {
            return -1;
        }
        
        // Find the original index in config.data
        const filteredRecord = this.filteredData[filteredIndex];
        return this.config.data.findIndex(record => record === filteredRecord);
    }

    private createDefaultNewRecord(): any {
        const newRecord: any = {};
        
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

    private handleCheckboxChange(globalIndex: number, checked: boolean): void {
        if (checked) {
            this.selectedIndexes.add(globalIndex);
        } else {
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

    private handleMasterCheckboxChange(checked: boolean): void {
        this.masterCheckboxState = checked;
        
        // Calculate the range of visible records on current page
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.config.data.length);
        
        if (checked) {
            // Select only visible page records
            for (let i = startIndex; i < endIndex; i++) {
                this.selectedIndexes.add(i);
            }
        } else {
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

    private handleDeleteSelected(): void {
        if (this.selectedIndexes.size === 0) return;
        
        const selectedArray = Array.from(this.selectedIndexes);
        
        if (this.config.onDeleteSelected) {
            this.config.onDeleteSelected(selectedArray);
        } else {
            // Default behavior: soft delete (set isDisabled = true)
            if (confirm(`Mark ${this.selectedIndexes.size} selected record(s) as disabled?`)) {
                // Soft delete: set isDisabled = true for selected records
                selectedArray.forEach(index => {
                    if (index >= 0 && index < this.config.data.length) {
                        this.config.data[index].isDisabled = true;
                    }
                });
                
                // Clear selection and update filtered data
                this.selectedIndexes.clear();
                this.masterCheckboxState = false;
                this.filterData(); // Update filtered data after soft delete
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

    // Static factory method following Master Agent Edict for static factory patterns
    public static createFromData(sourceData: any, config?: Partial<DataGridPaginatorConfig>): DataGridPaginator {
        if (!sourceData?.positions?.schema || !sourceData?.positions?.data) {
            throw new Error('Invalid source data structure - missing positions.schema or positions.data');
        }

        const paginatorConfig: DataGridPaginatorConfig = {
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