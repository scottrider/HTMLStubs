/**
 * DataGrid Core Engine (DG.js)
 * Generic, data-agnostic grid system that works with any schema/data combination
 * 
 * Features:
 * - Schema-driven rendering
 * - Dynamic column generation
 * - Generic CRUD operations
 * - Pagination
 * - Search/filtering
 * - Selection management
 * - Inline editing
 * - Data state management (enabled/disabled)
 */

// Create logger instance
const dgLogger = window.DataGridNamespace?.logger || {
    debug: () => {},
    info: console.info.bind(console, '[DG]:'),
    warn: console.warn.bind(console, '[DG]:'),
    error: console.error.bind(console, '[DG]:')
};

/**
 * Generic DataGrid Engine Class
 */
class DataGrid {
    constructor(containerIdOrConfig, data = null, schema = null) {
        // Handle both old three-parameter format and new config object format
        let config;
        
        if (typeof containerIdOrConfig === 'string') {
            // Old format: DataGrid(containerId, data, schema)
            config = {
                containerId: containerIdOrConfig,
                data: data || [],
                schema: schema,
                entityType: schema?.entityName || 'generic'
            };
        } else if (typeof containerIdOrConfig === 'object' && containerIdOrConfig !== null) {
            // New format: DataGrid(config)
            config = containerIdOrConfig;
        } else {
            throw new Error('DataGrid constructor requires either a containerId string or a config object');
        }

        // Validate required parameters
        if (!config.containerId) {
            throw new Error('DataGrid requires a containerId');
        }
        
        if (!config.schema) {
            throw new Error('DataGrid requires a schema');
        }

        // Normalize schema format to the original jobsearch format that the rest of the code expects
        let normalizedSchema;
        
        if (config.schema.fields && Array.isArray(config.schema.fields)) {
            // Convert new Universal DataGrid schema format to old format
            normalizedSchema = {};
            config.schema.fields.forEach(field => {
                normalizedSchema[field.name] = {
                    type: field.type === 'text' ? 'string' : field.type,
                    displayName: field.label || field.name,
                    required: field.required || false,
                    primaryKey: field.readOnly || field.primaryKey || field.name === 'id',
                    htmlElement: field.type === 'number' ? 'input' : 'input',
                    htmlType: field.type === 'number' ? 'number' : 'text',
                    foreignKey: field.foreignKey || null
                };
            });
        } else if (typeof config.schema === 'object' && config.schema !== null) {
            // Already in the old jobsearch format
            normalizedSchema = config.schema;
        } else {
            throw new Error('Schema must be either a Universal DataGrid schema object or a jobsearch format schema object');
        }

        this.config = {
            containerId: config.containerId,
            entityType: config.entityType || config.schema?.entityName || 'generic',
            schema: normalizedSchema, // Use normalized schema
            data: config.data || [],
            pageSize: config.pageSize || 10,
            enableInlineEdit: config.enableInlineEdit !== false,
            enableSelection: config.enableSelection !== false,
            enablePagination: config.enablePagination !== false,
            enableSearch: config.enableSearch !== false,
            enableToggle: config.enableToggle !== false,
            onDataChange: config.onDataChange || null,
            onSelectionChange: config.onSelectionChange || null,
            foreignKeyResolvers: config.foreignKeyResolvers || {},
            // Store the original schema for reference
            originalSchema: config.schema
        };

        // Internal state
        this.data = [...this.config.data];
        this.filteredData = [...this.data];
        this.currentPage = 1;
        this.totalPages = 1;
        this.selectedRecords = new Set();
        this.editingIndex = -1;
        this.originalRecordData = null;
        this.viewingEnabled = true;
        this.searchTerm = '';
        
        // Schema analysis
        this.schemaFields = Object.keys(this.config.schema);
        this.primaryKey = this.findPrimaryKey();
        
        // Initialize
        this.init();
    }

    /**
     * Initialize the DataGrid
     */
    init() {
        try {
            this.validateConfig();
            this.setupContainer();
            this.applySchemaDimensions();
            this.calculatePagination();
            this.render();
            this.attachEventListeners();
            
            dgLogger.info(`DataGrid initialized for entity: ${this.config.entityType}`);
        } catch (error) {
            dgLogger.error('Failed to initialize DataGrid:', error);
            throw error;
        }
    }

    /**
     * Validate the configuration
     */
    validateConfig() {
        if (!this.config.containerId) {
            throw new Error('Container ID is required');
        }
        
        if (!this.config.entityType) {
            throw new Error('Entity type is required');
        }
        
        if (!this.config.schema || Object.keys(this.config.schema).length === 0) {
            throw new Error('Schema is required and must have fields');
        }

        const container = document.getElementById(this.config.containerId);
        if (!container) {
            throw new Error(`Container with ID '${this.config.containerId}' not found`);
        }
    }

    /**
     * Find primary key field from schema
     */
    findPrimaryKey() {
        for (const [fieldName, fieldConfig] of Object.entries(this.config.schema)) {
            if (fieldConfig.primaryKey) {
                return fieldName;
            }
        }
        // Default to 'id' if no primary key found
        return 'id';
    }

    /**
     * Setup container structure
     */
    setupContainer() {
        const container = document.getElementById(this.config.containerId);
        container.innerHTML = `
            <div class="DG-container" data-entity="${this.config.entityType}">
                ${this.config.enableSearch ? '<div class="DG-search-container"></div>' : ''}
                <div class="DG-header-info"></div>
                <div class="DG-header-controls"></div>
                ${this.config.enableToggle ? '<div class="DG-toggle-container"></div>' : ''}
                <div class="DG-grid-container DataGrid"></div>
                <div class="DG-form-container" style="display: none;">
                    <div class="row-form" id="DG-row-form-${this.config.entityType}"></div>
                </div>
                ${this.config.enablePagination ? '<div class="DG-pagination-container"></div>' : ''}
            </div>
        `;
    }

    /**
     * Apply schema-driven CSS dimensions
     */
    applySchemaDimensions() {
        const gridContainer = this.container.querySelector('.DG-grid-container');
        
        // Generate CSS custom properties from schema
        let gridColumns = [];
        Object.entries(this.config.schema).forEach(([fieldName, fieldConfig]) => {
            const css = fieldConfig.css || {};
            const width = css.width || '150px';
            const flex = css.gridFlex || '1fr';
            const minWidth = css.minWidth || width;
            
            // Set CSS custom properties
            gridContainer.style.setProperty(`--${fieldName}-width`, width);
            gridContainer.style.setProperty(`--${fieldName}-flex`, flex);
            gridContainer.style.setProperty(`--${fieldName}-min-width`, minWidth);
            
            gridColumns.push(`minmax(var(--${fieldName}-min-width), var(--${fieldName}-flex))`);
        });

        // Apply grid template
        gridContainer.style.setProperty('--dg-grid-columns', gridColumns.join(' '));
    }

    /**
     * Get container element
     */
    get container() {
        return document.getElementById(this.config.containerId).querySelector('.DG-container');
    }

    /**
     * Calculate pagination
     */
    calculatePagination() {
        if (!this.config.enablePagination) {
            this.totalPages = 1;
            return;
        }

        const displayData = this.getDisplayData();
        this.totalPages = Math.ceil(displayData.length / this.config.pageSize) || 1;
        
        // Ensure current page is valid
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
        }
    }

    /**
     * Get data for current display mode (enabled/disabled/all)
     */
    getDisplayData() {
        let data = this.data;
        
        if (this.config.enableToggle) {
            data = data.filter(record => {
                const isDisabled = record.isDisabled === true;
                return this.viewingEnabled ? !isDisabled : isDisabled;
            });
        }
        
        if (this.searchTerm && this.config.enableSearch) {
            data = data.filter(record => this.matchesSearch(record, this.searchTerm));
        }
        
        return data;
    }

    /**
     * Get current page data
     */
    getCurrentPageData() {
        if (!this.config.enablePagination) {
            return this.getDisplayData();
        }

        const displayData = this.getDisplayData();
        const startIndex = (this.currentPage - 1) * this.config.pageSize;
        return displayData.slice(startIndex, startIndex + this.config.pageSize);
    }

    /**
     * Check if record matches search term
     */
    matchesSearch(record, searchTerm) {
        const term = searchTerm.toLowerCase();
        
        for (const [fieldName, fieldConfig] of Object.entries(this.config.schema)) {
            const value = this.getFieldDisplayValue(record, fieldName, fieldConfig);
            if (value && value.toString().toLowerCase().includes(term)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get display value for a field (handles foreign keys)
     */
    getFieldDisplayValue(record, fieldName, fieldConfig) {
        let value = record[fieldName];
        
        // Handle foreign key resolution
        if (fieldConfig.foreignKey && this.config.foreignKeyResolvers[fieldName]) {
            const resolver = this.config.foreignKeyResolvers[fieldName];
            value = resolver(value) || value;
        }
        
        return value;
    }

    /**
     * Render the entire DataGrid
     */
    render() {
        this.renderHeader();
        this.renderGrid();
        this.renderPagination();
        this.renderSearch();
        this.renderToggle();
        this.renderForm();
    }

    /**
     * Render header information
     */
    renderHeader() {
        const headerInfo = this.container.querySelector('.DG-header-info');
        const headerControls = this.container.querySelector('.DG-header-controls');
        
        const displayData = this.getDisplayData();
        const selectedCount = this.selectedRecords.size;
        
        if (selectedCount > 0) {
            headerInfo.innerHTML = `
                <div class="header-title">${this.config.entityType} Records</div>
                <div class="header-summary">${selectedCount} record(s) selected</div>
            `;
            
            headerControls.innerHTML = this.renderSelectionControls();
        } else {
            headerInfo.innerHTML = `
                <div class="header-title">${this.config.entityType} Records</div>
                <div class="header-summary">
                    ${displayData.length} record(s) 
                    ${this.config.enableToggle ? (this.viewingEnabled ? 'enabled' : 'disabled') : ''}
                </div>
            `;
            
            headerControls.innerHTML = this.renderNormalControls();
        }
    }

    /**
     * Render selection controls
     */
    renderSelectionControls() {
        const actionLabel = this.viewingEnabled ? 'Delete Selected' : 'Restore Selected';
        
        return `
            <div class="DG-controls-left">
                ${this.config.enablePagination ? this.renderPaginationControls() : ''}
            </div>
            <div class="DG-controls-middle">
                <button class="DG-action-button" data-action="bulk-toggle">${actionLabel}</button>
            </div>
            <div class="DG-controls-right">
                ${this.config.enablePagination ? this.renderPageSizeControl() : ''}
            </div>
        `;
    }

    /**
     * Render normal controls
     */
    renderNormalControls() {
        return `
            <div class="DG-controls-left">
                ${this.config.enablePagination ? this.renderPaginationControls() : ''}
            </div>
            <div class="DG-controls-middle">
                <button class="DG-add-button" data-action="add">Add ${this.config.entityType}</button>
            </div>
            <div class="DG-controls-right">
                ${this.config.enablePagination ? this.renderPageSizeControl() : ''}
            </div>
        `;
    }

    /**
     * Render pagination controls
     */
    renderPaginationControls() {
        return `
            <div class="pagination-controls">
                <button data-action="first-page" ${this.currentPage === 1 ? 'disabled' : ''}>First</button>
                <button data-action="prev-page" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
                <span class="page-info">Page ${this.currentPage} of ${this.totalPages}</span>
                <button data-action="next-page" ${this.currentPage === this.totalPages ? 'disabled' : ''}>Next</button>
                <button data-action="last-page" ${this.currentPage === this.totalPages ? 'disabled' : ''}>Last</button>
            </div>
        `;
    }

    /**
     * Render page size control
     */
    renderPageSizeControl() {
        const pageSizes = [5, 10, 25, 50];
        
        return `
            <select class="DG-page-size" data-action="change-page-size">
                ${pageSizes.map(size => 
                    `<option value="${size}" ${size === this.config.pageSize ? 'selected' : ''}>${size} per page</option>`
                ).join('')}
            </select>
        `;
    }

    /**
     * Render the grid itself
     */
    renderGrid() {
        const gridContainer = this.container.querySelector('.DG-grid-container');
        const pageData = this.getCurrentPageData();
        
        let html = this.renderHeaderRow();
        html += pageData.map((record, index) => this.renderDataRow(record, index)).join('');
        
        gridContainer.innerHTML = html;
    }

    /**
     * Render header row
     */
    renderHeaderRow() {
        let html = '<div class="DG-row DG-header-row">';
        
        if (this.config.enableSelection) {
            html += '<div class="DG-cell DG-cell-checkbox"><input type="checkbox" class="DG-master-checkbox"></div>';
        }
        
        for (const [fieldName, fieldConfig] of Object.entries(this.config.schema)) {
            html += `<div class="DG-cell DG-cell-header" data-field="${fieldName}">${fieldConfig.displayName || fieldName}</div>`;
        }
        
        html += '<div class="DG-cell DG-cell-actions">Actions</div>';
        html += '</div>';
        
        return html;
    }

    /**
     * Render data row
     */
    renderDataRow(record, index) {
        const globalIndex = this.getGlobalIndex(record);
        const isSelected = this.selectedRecords.has(globalIndex);
        const isEditing = this.editingIndex === globalIndex;
        
        let html = `<div class="DG-row DG-data-row" data-index="${globalIndex}">`;
        
        if (this.config.enableSelection) {
            html += `<div class="DG-cell DG-cell-checkbox">
                <input type="checkbox" class="DG-record-checkbox" 
                       data-index="${globalIndex}" ${isSelected ? 'checked' : ''}>
            </div>`;
        }
        
        for (const [fieldName, fieldConfig] of Object.entries(this.config.schema)) {
            if (isEditing) {
                html += this.renderEditableCell(record, fieldName, fieldConfig);
            } else {
                html += this.renderReadOnlyCell(record, fieldName, fieldConfig);
            }
        }
        
        html += this.renderActionCell(record, globalIndex, isEditing);
        html += '</div>';
        
        return html;
    }

    /**
     * Get global index for a record
     */
    getGlobalIndex(record) {
        const primaryKeyValue = record[this.primaryKey];
        return this.data.findIndex(r => r[this.primaryKey] === primaryKeyValue);
    }

    /**
     * Render editable cell
     */
    renderEditableCell(record, fieldName, fieldConfig) {
        const value = record[fieldName] || '';
        const css = fieldConfig.css || {};
        
        switch (fieldConfig.htmlElement) {
            case 'select':
                return `<div class="DG-cell DG-cell-editable" data-field="${fieldName}">
                    ${this.renderSelectElement(fieldName, fieldConfig, value)}
                </div>`;
                
            case 'textarea':
                return `<div class="DG-cell DG-cell-editable" data-field="${fieldName}">
                    <textarea data-field="${fieldName}" 
                             placeholder="${css.placeholder || ''}"
                             rows="${css.rows || 3}">${value}</textarea>
                </div>`;
                
            default:
                return `<div class="DG-cell DG-cell-editable" data-field="${fieldName}">
                    <input type="${fieldConfig.htmlType || 'text'}" 
                           data-field="${fieldName}"
                           value="${value}" 
                           placeholder="${css.placeholder || ''}"
                           ${fieldConfig.required ? 'required' : ''}>
                </div>`;
        }
    }

    /**
     * Render select element
     */
    renderSelectElement(fieldName, fieldConfig, selectedValue) {
        let options = fieldConfig.options || [];
        
        // Handle foreign key options
        if (fieldConfig.foreignKey && this.config.foreignKeyResolvers[fieldName]) {
            const resolver = this.config.foreignKeyResolvers[fieldName];
            options = resolver.getOptions ? resolver.getOptions() : options;
        }
        
        let html = `<select data-field="${fieldName}" ${fieldConfig.required ? 'required' : ''}>`;
        
        options.forEach(option => {
            const value = typeof option === 'object' ? option.value : option;
            const label = typeof option === 'object' ? option.label : option;
            const selected = value == selectedValue ? 'selected' : '';
            html += `<option value="${value}" ${selected}>${label}</option>`;
        });
        
        html += '</select>';
        return html;
    }

    /**
     * Render read-only cell
     */
    renderReadOnlyCell(record, fieldName, fieldConfig) {
        const displayValue = this.getFieldDisplayValue(record, fieldName, fieldConfig);
        
        return `<div class="DG-cell DG-cell-readonly" data-field="${fieldName}">
            ${this.formatDisplayValue(displayValue, fieldConfig)}
        </div>`;
    }

    /**
     * Format display value based on field type
     */
    formatDisplayValue(value, fieldConfig) {
        if (value === null || value === undefined || value === '') {
            return '';
        }
        
        switch (fieldConfig.type) {
            case 'date':
                return new Date(value).toLocaleDateString();
            case 'email':
                return `<a href="mailto:${value}">${value}</a>`;
            case 'url':
                return `<a href="${value}" target="_blank">${value}</a>`;
            case 'phone':
                return `<a href="tel:${value}">${value}</a>`;
            default:
                return value.toString();
        }
    }

    /**
     * Render action cell
     */
    renderActionCell(record, globalIndex, isEditing) {
        if (isEditing) {
            return `<div class="DG-cell DG-cell-actions">
                <button class="DG-action-btn" data-action="save" data-index="${globalIndex}">💾</button>
                <button class="DG-action-btn" data-action="cancel" data-index="${globalIndex}">❌</button>
            </div>`;
        } else {
            return `<div class="DG-cell DG-cell-actions">
                <button class="DG-action-btn" data-action="edit" data-index="${globalIndex}">✏️</button>
                <button class="DG-action-btn" data-action="delete" data-index="${globalIndex}">🗑️</button>
            </div>`;
        }
    }

    /**
     * Render form for add/edit operations
     */
    renderForm() {
        const formContainer = this.container.querySelector('.DG-form-container .row-form');
        
        let html = '<div class="DG-form-fields">';
        
        for (const [fieldName, fieldConfig] of Object.entries(this.config.schema)) {
            if (fieldConfig.primaryKey) continue; // Skip primary key in form
            
            html += `<div class="field-group">
                <label for="form-${fieldName}">${fieldConfig.displayName || fieldName}</label>
                ${this.renderFormField(fieldName, fieldConfig)}
            </div>`;
        }
        
        html += `
            </div>
            <div class="DG-form-actions">
                <button type="button" class="DG-form-save" data-action="form-save">Save</button>
                <button type="button" class="DG-form-cancel" data-action="form-cancel">Cancel</button>
            </div>
        `;
        
        formContainer.innerHTML = html;
    }

    /**
     * Render form field
     */
    renderFormField(fieldName, fieldConfig) {
        const css = fieldConfig.css || {};
        
        switch (fieldConfig.htmlElement) {
            case 'select':
                return this.renderSelectElement(fieldName, fieldConfig, '');
                
            case 'textarea':
                return `<textarea id="form-${fieldName}" 
                                 data-field="${fieldName}"
                                 placeholder="${css.placeholder || ''}"
                                 rows="${css.rows || 3}"
                                 ${fieldConfig.required ? 'required' : ''}></textarea>`;
                
            default:
                return `<input type="${fieldConfig.htmlType || 'text'}" 
                              id="form-${fieldName}"
                              data-field="${fieldName}"
                              placeholder="${css.placeholder || ''}"
                              ${fieldConfig.required ? 'required' : ''}>`;
        }
    }

    /**
     * Render search component
     */
    renderSearch() {
        if (!this.config.enableSearch) return;
        
        const searchContainer = this.container.querySelector('.DG-search-container');
        searchContainer.innerHTML = `
            <div class="DG-search">
                <input type="text" class="DG-search-input" placeholder="Search ${this.config.entityType}..." value="${this.searchTerm}">
                <button class="DG-search-clear" data-action="clear-search">Clear</button>
            </div>
        `;
    }

    /**
     * Render toggle component
     */
    renderToggle() {
        if (!this.config.enableToggle) return;
        
        const toggleContainer = this.container.querySelector('.DG-toggle-container');
        toggleContainer.innerHTML = `
            <div class="DG-toggle">
                <label class="toggle-switch">
                    <input type="checkbox" class="DG-toggle-input" ${this.viewingEnabled ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label">Show ${this.viewingEnabled ? 'Enabled' : 'Disabled'} Records</span>
            </div>
        `;
    }

    /**
     * Render pagination
     */
    renderPagination() {
        if (!this.config.enablePagination) return;
        
        const paginationContainer = this.container.querySelector('.DG-pagination-container');
        paginationContainer.innerHTML = this.renderPaginationControls();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const container = this.container;
        
        // Delegate all clicks to the container
        container.addEventListener('click', this.handleClick.bind(this));
        container.addEventListener('change', this.handleChange.bind(this));
        container.addEventListener('input', this.handleInput.bind(this));
    }

    /**
     * Handle click events
     */
    handleClick(event) {
        const action = event.target.dataset.action;
        const index = parseInt(event.target.dataset.index);
        
        switch (action) {
            case 'edit':
                this.startEdit(index);
                break;
            case 'save':
                this.saveEdit(index);
                break;
            case 'cancel':
                this.cancelEdit();
                break;
            case 'delete':
                this.deleteRecord(index);
                break;
            case 'add':
                this.showForm();
                break;
            case 'form-save':
                this.saveForm();
                break;
            case 'form-cancel':
                this.hideForm();
                break;
            case 'bulk-toggle':
                this.handleBulkToggle();
                break;
            case 'first-page':
                this.goToPage(1);
                break;
            case 'prev-page':
                this.goToPage(this.currentPage - 1);
                break;
            case 'next-page':
                this.goToPage(this.currentPage + 1);
                break;
            case 'last-page':
                this.goToPage(this.totalPages);
                break;
            case 'clear-search':
                this.clearSearch();
                break;
        }
    }

    /**
     * Handle change events
     */
    handleChange(event) {
        const action = event.target.dataset.action;
        
        if (action === 'change-page-size') {
            this.changePageSize(parseInt(event.target.value));
        } else if (event.target.classList.contains('DG-record-checkbox')) {
            this.handleRecordSelection(event);
        } else if (event.target.classList.contains('DG-master-checkbox')) {
            this.handleMasterCheckbox(event);
        } else if (event.target.classList.contains('DG-toggle-input')) {
            this.handleToggle(event);
        }
    }

    /**
     * Handle input events
     */
    handleInput(event) {
        if (event.target.classList.contains('DG-search-input')) {
            this.handleSearch(event.target.value);
        }
    }

    // ... Additional methods for CRUD operations, pagination, search, etc.
    // (These will be implemented in the next part due to length constraints)

    /**
     * Public API for external access
     */
    getData() {
        return [...this.data];
    }

    setData(data) {
        this.data = [...data];
        this.calculatePagination();
        this.render();
        this.notifyDataChange();
    }

    getSelectedRecords() {
        return Array.from(this.selectedRecords).map(index => this.data[index]);
    }

    refresh() {
        this.calculatePagination();
        this.render();
    }

    destroy() {
        const container = this.container;
        if (container) {
            container.removeEventListener('click', this.handleClick);
            container.removeEventListener('change', this.handleChange);
            container.removeEventListener('input', this.handleInput);
        }
        dgLogger.info(`DataGrid destroyed for entity: ${this.config.entityType}`);
    }

    /**
     * Notify external handlers of data changes
     */
    notifyDataChange() {
        if (this.config.onDataChange) {
            this.config.onDataChange(this.getData());
        }
    }

    /**
     * Notify external handlers of selection changes
     */
    notifySelectionChange() {
        if (this.config.onSelectionChange) {
            this.config.onSelectionChange(this.getSelectedRecords());
        }
    }
}

// Export for use
window.DataGrid = DataGrid;