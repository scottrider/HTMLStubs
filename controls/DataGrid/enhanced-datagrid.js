/**
 * Enhanced DataGrid Control
 * Extends BaseControl with comprehensive logging integration and enterprise features
 * Follows HTML Controls Library best practices and patterns
 */

class DataGridControl extends BaseControl {
    constructor(options = {}) {
        super({
            // DataGrid-specific defaults
            editable: true,
            sortable: true,
            filterable: true,
            searchable: true,
            responsive: true,
            accessibility: true,
            virtualization: false,
            pageSize: 20,
            autoSave: false,
            validationMode: 'realtime',
            ...options
        });

        // DataGrid-specific properties
        this.data = [];
        this.schema = {};
        this.filteredData = [];
        this.sortedData = [];
        this.selectedRows = new Set();
        this.currentPage = 1;
        this.totalPages = 1;
        this.searchTerm = '';
        this.activeFilters = [];
        this.sortConfig = null;

        // State management
        this.isLoading = false;
        this.hasUnsavedChanges = false;
        this.validationErrors = new Map();
        this.showDisabledRecords = false; // Track checkbox state

        // Comprehensive Performance & UX Metrics - Best Practices
        this.renderMetrics = {
            lastRenderTime: 0,
            averageRenderTime: 0,
            renderCount: 0,
            maxRenderTime: 0,
            minRenderTime: Infinity
        };

        this.userInteractionMetrics = {
            pageNavigations: 0,
            pageSizeChanges: 0,
            searchOperations: 0,
            filterOperations: 0,
            recordModifications: 0,
            lastInteractionTime: null,
            averageInteractionResponse: 0
        };

        this.dataQualityMetrics = {
            totalRecords: 0,
            validRecords: 0,
            duplicateRecords: 0,
            incompleteRecords: 0,
            validationErrors: 0,
            dataLoadTime: 0
        };

        this.accessibilityMetrics = {
            keyboardNavigations: 0,
            screenReaderInteractions: 0,
            focusEvents: 0,
            ariaAnnouncements: 0
        };

        this.usabilityMetrics = {
            averageTaskCompletionTime: 0,
            userErrorRate: 0,
            helpRequestsCount: 0,
            undoOperations: 0,
            sessionDuration: Date.now()
        };

        this.logger.info('DataGrid control created', {
            id: this.id,
            options: this.options
        });
    }

    // ========================================
    // LIFECYCLE METHODS (Override BaseControl)
    // ========================================

    init() {
        this.logger.info('Initializing DataGrid', { id: this.id });
        
        // Call parent initialization
        super.init();

        const timer = this.startPerformanceTimer('datagrid_init');

        try {
            // Initialize data source
            this.initializeDataSource();
            
            // Set up DataGrid-specific event listeners
            this.setupDataGridEventListeners();
            
            // Initialize drag and drop if enabled
            if (this.options.dragAndDrop) {
                this.initializeDragAndDrop();
            }
            
            // Load initial data
            this.loadData();

            this.logger.info('DataGrid initialized successfully', {
                id: this.id,
                dataCount: this.data.length,
                schemaFields: Object.keys(this.schema).length
            });

        } catch (error) {
            this.logger.error('DataGrid initialization failed', {
                id: this.id,
                error: error.message,
                stack: error.stack
            });
            throw error;
        } finally {
            this.endPerformanceTimer(timer);
        }

        return this;
    }

    render() {
        this.logger.debug('Rendering DataGrid', { 
            id: this.id, 
            dataCount: this.data.length 
        });

        const timer = this.startPerformanceTimer('datagrid_render');
        const renderStartTime = performance.now();

        try {
            // Call parent render
            super.render();

            // Clear existing content but preserve container structure
            this.container.innerHTML = '';
            
            // Ensure container has proper DataGrid class
            if (!this.container.classList.contains('DataGrid')) {
                this.container.classList.add('DataGrid');
            }
            
            // Add border to main DataGrid container
            this.container.style.border = '1px solid rgb(69, 69, 69)';
            this.container.style.borderRadius = '4px';

            // Create loading indicator if needed
            if (this.isLoading) {
                this.renderLoadingState();
                return this;
            }

            // Create main grid container
            const gridContainer = document.createElement('div');
            gridContainer.className = 'datagrid-content';
            gridContainer.setAttribute('role', 'grid');
            gridContainer.setAttribute('aria-label', this.getAriaLabel());
            
            // Temporarily set container to grid container for rendering
            const originalContainer = this.container;
            this.container = gridContainer;

            // Create header
            this.renderHeader();

            // Create data rows
            this.renderDataRows();
            
            // Debug: Log what was rendered
            console.log('DataGrid render debug:', {
                dataCount: this.data.length,
                visibleDataCount: this.getVisibleData().length,
                gridContainerChildren: gridContainer.children.length,
                hasHeader: gridContainer.querySelector('.DataGridHeader') !== null,
                hasRows: gridContainer.querySelectorAll('.DataGridRow').length
            });
            
            // Restore original container
            this.container = originalContainer;
            
            // Add grid container to main container
            this.container.appendChild(gridContainer);

            // Create footer with pagination (always render)
            this.renderFooter();

            // Update performance metrics
            const renderTime = performance.now() - renderStartTime;
            this.updateRenderMetrics(renderTime);

            this.logger.debug('DataGrid render completed', {
                id: this.id,
                renderTime: `${renderTime.toFixed(2)}ms`,
                rowsRendered: this.getVisibleData().length
            });

            // Trigger rendered event
            this.trigger('datagrid:rendered', {
                id: this.id,
                renderTime,
                rowsRendered: this.getVisibleData().length
            });

        } catch (error) {
            this.logger.error('DataGrid render failed', {
                id: this.id,
                error: error.message,
                stack: error.stack
            });
            this.handleError(error, { operation: 'render' });
        } finally {
            this.endPerformanceTimer(timer);
        }

        return this;
    }

    destroy() {
        this.logger.info('Destroying DataGrid', { id: this.id });

        try {
            // Clean up DataGrid-specific resources
            this.cleanupDataGridResources();
            
            // Call parent destroy
            super.destroy();

            this.logger.info('DataGrid destroyed successfully', { id: this.id });

        } catch (error) {
            this.logger.error('DataGrid destruction failed', {
                id: this.id,
                error: error.message
            });
        }
    }

    // ========================================
    // DATA MANAGEMENT
    // ========================================

    /**
     * Initialize data source
     */
    initializeDataSource() {
        const timer = this.startPerformanceTimer('data_source_init');

        try {
            if (this.options.source) {
                this.loadFromSource(this.options.source);
            } else if (this.options.data) {
                this.setData(this.options.data, this.options.schema);
            } else {
                // Load default sample data
                this.loadSampleData();
            }

            this.logger.debug('Data source initialized', {
                id: this.id,
                recordCount: this.data.length,
                hasSchema: Object.keys(this.schema).length > 0
            });

        } catch (error) {
            this.logger.error('Data source initialization failed', {
                id: this.id,
                error: error.message
            });
            throw error;
        } finally {
            this.endPerformanceTimer(timer);
        }
    }

    /**
     * Set data with optional schema
     */
    setData(data, schema = null) {
        this.logger.info('Setting DataGrid data', {
            id: this.id,
            recordCount: Array.isArray(data) ? data.length : 0,
            hasSchema: !!schema
        });

        const timer = this.startPerformanceTimer('set_data');

        try {
            // Validate data
            if (!Array.isArray(data)) {
                throw new Error('Data must be an array');
            }

            // Set data
            this.data = [...data];
            
            // Store original data for filtering if this is the initial data load
            if (!this.originalData || this.originalData.length === 0) {
                this.originalData = [...data];
                console.log('DEBUG: Original data stored:', {
                    count: this.originalData.length,
                    sampleRecord: this.originalData[0],
                    disabledCount: this.originalData.filter(r => r.isDisabled === true).length
                });
                
                // Filter to show only enabled records initially
                this.data = this.originalData.filter(record => record.isDisabled !== true);
                console.log('DEBUG: Initial data filtered to enabled only:', {
                    enabledCount: this.data.length,
                    totalCount: this.originalData.length
                });
            }

            // Set or generate schema - FORCE provided schema usage
            if (schema && Object.keys(schema).length > 0) {
                this.schema = { ...schema };
                console.log('Using provided schema with displayNames:', this.schema);
                
                // Validate that all data fields have schema entries
                if (this.data.length > 0) {
                    const dataKeys = Object.keys(this.data[0]);
                    const missingKeys = dataKeys.filter(key => !this.schema[key]);
                    if (missingKeys.length > 0) {
                        console.warn('Data fields missing from schema:', missingKeys);
                        // Add missing fields to schema with auto-generated displayNames
                        missingKeys.forEach(key => {
                            this.schema[key] = {
                                type: 'string',
                                displayName: this.formatDisplayName(key),
                                htmlElement: 'input',
                                htmlType: 'text',
                                required: false
                            };
                        });
                    }
                }
            } else {
                console.log('No schema provided, generating from data');
                this.generateSchemaFromData();
            }

            // Reset derived data arrays and update through proper pipeline
            this.selectedRows.clear();
            this.currentPage = 1;
            this.hasUnsavedChanges = false;

            // Update data quality metrics - Best Practice
            this.updateDataQualityMetrics();

            // Update derived data through proper pipeline (filtering, sorting)
            this.updateDerivedData();

            // Calculate pagination
            this.calculatePagination();

            // Trigger data changed event
            this.trigger('datagrid:dataChanged', {
                id: this.id,
                recordCount: this.data.length,
                hasSchema: Object.keys(this.schema).length > 0
            });

            this.logger.debug('Data set successfully', {
                id: this.id,
                recordCount: this.data.length,
                schemaFields: Object.keys(this.schema).length
            });

        } catch (error) {
            this.logger.error('Failed to set data', {
                id: this.id,
                error: error.message
            });
            throw error;
        } finally {
            this.endPerformanceTimer(timer);
        }
    }

    /**
     * Update existing data and re-render
     */
    updateData(newData) {
        this.setData(newData);
        this.render();
        return this;
    }

    /**
     * Filter data by disabled status
     */
    filterByDisabledStatus(showDisabled) {
        if (!this.originalData) {
            // Store original data on first filter
            this.originalData = [...this.data];
        }

        // Update state
        this.showDisabledRecords = showDisabled;

        console.log('DEBUG: FilterByDisabledStatus called with:', { 
            showDisabled,
            originalDataLength: this.originalData?.length,
            currentDataLength: this.data?.length,
            sampleOriginalRecord: this.originalData?.[0],
            sampleCurrentRecord: this.data?.[0]
        });

        // Count disabled records in original data
        const disabledCount = this.originalData.filter(record => record.isDisabled === true).length;
        const enabledCount = this.originalData.filter(record => record.isDisabled !== true).length;
        
        console.log('DEBUG: Data analysis:', {
            totalRecords: this.originalData.length,
            disabledRecords: disabledCount,
            enabledRecords: enabledCount,
            disabledSample: this.originalData.find(record => record.isDisabled === true),
            enabledSample: this.originalData.find(record => record.isDisabled !== true)
        });

        let filteredData;
        if (showDisabled) {
            // Show disabled records - PRESERVE original data structure
            filteredData = this.originalData.filter(record => record.isDisabled === true);
        } else {
            // Show enabled records - PRESERVE original data structure  
            filteredData = this.originalData.filter(record => record.isDisabled !== true);
        }

        console.log('DataGrid filter applied:', { 
            showDisabled, 
            totalRecords: this.originalData.length,
            filteredCount: filteredData.length,
            sampleFilteredRecord: filteredData[0]
        });

        // Update data without full re-render to preserve footer state
        this.data = filteredData;
        this.updateDerivedData();
        this.renderDataContent(); // Only re-render data, not the entire grid
        
        return this;
    }

    /**
     * Render only the data content and update pagination without destroying footer
     * This preserves event listeners and checkbox state in the footer
     */
    renderDataContent() {
        this.logger.debug('Rendering data content only', { 
            id: this.id, 
            dataCount: this.data.length 
        });

        // Clear existing data rows (but keep header and footer)
        const dataRows = this.container.querySelectorAll('.DataGridRow');
        dataRows.forEach(row => row.remove());

        // Re-render data rows
        this.renderDataRows();

        // Update pagination info in existing footer without destroying it
        this.updatePaginationInfo();
    }

    /**
     * Update pagination information in the existing footer
     */
    updatePaginationInfo() {
        const paginationInfo = this.getPaginationInfo();
        
        // Update page info
        const pageMetric = this.container.querySelector('.metric-row .metric-value');
        if (pageMetric) {
            pageMetric.textContent = `${this.currentPage} of ${this.totalPages}`;
        }

        // Update pagination buttons
        const paginationButtons = this.container.querySelector('.pagination-buttons');
        if (paginationButtons) {
            const isEnabled = this.options.pagination;
            const isEmpty = paginationInfo.total === 0;
            paginationButtons.innerHTML = this.renderPaginationButtons(isEnabled, isEmpty);
            
            // Re-attach event listeners to new pagination buttons
            this.setupFooterEventListeners();
        }

        // Update page size dropdown if the visible count changed
        const pageSizeSelect = this.container.querySelector(`#pageSize_${this.id}`);
        if (pageSizeSelect) {
            pageSizeSelect.value = this.options.pageSize;
        }
    }

    /**
     * Add a new record
     */
    addRecord(record, index = null) {
        this.logger.debug('Adding record to DataGrid', {
            id: this.id,
            record,
            index
        });

        const timer = this.startPerformanceTimer('add_record');

        try {
            // Validate record
            const validation = this.validateRecord(record);
            if (!validation.isValid) {
                this.logger.warn('Record validation failed', {
                    id: this.id,
                    errors: validation.errors
                });
                
                if (this.options.validationMode === 'strict') {
                    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                }
            }

            // Generate ID if not provided
            if (!record.id) {
                record.id = this.generateRecordId();
            }

            // Add to data
            if (index !== null && index >= 0 && index <= this.data.length) {
                this.data.splice(index, 0, record);
            } else {
                this.data.push(record);
                index = this.data.length - 1;
            }

            // Update derived data
            this.updateDerivedData();
            this.hasUnsavedChanges = true;

            // Trigger events
            this.trigger('datagrid:recordAdded', {
                id: this.id,
                record,
                index,
                totalRecords: this.data.length
            });

            this.logger.info('Record added successfully', {
                id: this.id,
                recordId: record.id,
                index,
                totalRecords: this.data.length
            });

            // Auto-save if enabled
            if (this.options.autoSave) {
                this.saveChanges();
            }

            return true;

        } catch (error) {
            this.logger.error('Failed to add record', {
                id: this.id,
                error: error.message,
                record
            });
            this.handleError(error, { operation: 'addRecord', record });
            return false;
        } finally {
            this.endPerformanceTimer(timer);
        }
    }

    /**
     * Update an existing record
     */
    updateRecord(recordId, updates) {
        this.logger.debug('Updating record in DataGrid', {
            id: this.id,
            recordId,
            updates
        });

        const timer = this.startPerformanceTimer('update_record');

        try {
            // Find record
            const recordIndex = this.data.findIndex(r => r.id === recordId);
            if (recordIndex === -1) {
                throw new Error(`Record not found: ${recordId}`);
            }

            const originalRecord = { ...this.data[recordIndex] };
            const updatedRecord = { ...originalRecord, ...updates };

            // Validate updated record
            const validation = this.validateRecord(updatedRecord);
            if (!validation.isValid) {
                this.logger.warn('Updated record validation failed', {
                    id: this.id,
                    recordId,
                    errors: validation.errors
                });
                
                if (this.options.validationMode === 'strict') {
                    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                }
            }

            // Update record
            this.data[recordIndex] = updatedRecord;
            this.updateDerivedData();
            this.hasUnsavedChanges = true;

            // Trigger events
            this.trigger('datagrid:recordUpdated', {
                id: this.id,
                recordId,
                originalRecord,
                updatedRecord,
                index: recordIndex
            });

            this.logger.info('Record updated successfully', {
                id: this.id,
                recordId,
                changedFields: Object.keys(updates)
            });

            // Auto-save if enabled
            if (this.options.autoSave) {
                this.saveChanges();
            }

            return true;

        } catch (error) {
            this.logger.error('Failed to update record', {
                id: this.id,
                error: error.message,
                recordId,
                updates
            });
            this.handleError(error, { operation: 'updateRecord', recordId, updates });
            return false;
        } finally {
            this.endPerformanceTimer(timer);
        }
    }

    /**
     * Delete a record
     */
    deleteRecord(recordId, softDelete = true) {
        this.logger.debug('Deleting record from DataGrid', {
            id: this.id,
            recordId,
            softDelete
        });

        const timer = this.startPerformanceTimer('delete_record');

        try {
            // Find record
            const recordIndex = this.data.findIndex(r => r.id === recordId);
            if (recordIndex === -1) {
                throw new Error(`Record not found: ${recordId}`);
            }

            const record = this.data[recordIndex];

            if (softDelete) {
                // Soft delete
                this.data[recordIndex] = {
                    ...record,
                    isDeleted: true,
                    deletedAt: new Date().toISOString()
                };
            } else {
                // Hard delete
                this.data.splice(recordIndex, 1);
            }

            this.updateDerivedData();
            this.hasUnsavedChanges = true;

            // Trigger events
            this.trigger('datagrid:recordDeleted', {
                id: this.id,
                recordId,
                record,
                index: recordIndex,
                softDelete
            });

            this.logger.info('Record deleted successfully', {
                id: this.id,
                recordId,
                softDelete,
                remainingRecords: this.data.filter(r => !r.isDeleted).length
            });

            // Auto-save if enabled
            if (this.options.autoSave) {
                this.saveChanges();
            }

            return true;

        } catch (error) {
            this.logger.error('Failed to delete record', {
                id: this.id,
                error: error.message,
                recordId
            });
            this.handleError(error, { operation: 'deleteRecord', recordId });
            return false;
        } finally {
            this.endPerformanceTimer(timer);
        }
    }

    // ========================================
    // SEARCH AND FILTERING
    // ========================================

    /**
     * Apply search filter
     */
    search(searchTerm) {
        this.logger.debug('Applying search to DataGrid', {
            id: this.id,
            searchTerm
        });

        const timer = this.startPerformanceTimer('search');

        try {
            this.searchTerm = searchTerm;

            if (!searchTerm || searchTerm.trim().length === 0) {
                this.filteredData = [...this.data];
            } else {
                this.filteredData = this.data.filter(record => {
                    return this.searchInRecord(record, searchTerm);
                });
            }

            this.updateDerivedData();
            this.currentPage = 1; // Reset to first page

            // Trigger search event
            this.trigger('datagrid:searchApplied', {
                id: this.id,
                searchTerm,
                resultCount: this.filteredData.length,
                totalRecords: this.data.length
            });

            this.logger.info('Search applied successfully', {
                id: this.id,
                searchTerm,
                resultCount: this.filteredData.length,
                totalRecords: this.data.length
            });

        } catch (error) {
            this.logger.error('Search failed', {
                id: this.id,
                error: error.message,
                searchTerm
            });
            this.handleError(error, { operation: 'search', searchTerm });
        } finally {
            this.endPerformanceTimer(timer);
        }
    }

    /**
     * Apply filters to data
     */
    applyFilters(filters) {
        this.logger.debug('Applying filters to DataGrid', {
            id: this.id,
            filters
        });

        const timer = this.startPerformanceTimer('apply_filters');

        try {
            this.activeFilters = filters;
            
            this.filteredData = this.data.filter(record => {
                return this.evaluateFilters(record, filters);
            });

            this.updateDerivedData();
            this.currentPage = 1; // Reset to first page

            // Trigger filter event
            this.trigger('datagrid:filtersApplied', {
                id: this.id,
                filters,
                resultCount: this.filteredData.length,
                totalRecords: this.data.length
            });

            this.logger.info('Filters applied successfully', {
                id: this.id,
                filterCount: filters.length,
                resultCount: this.filteredData.length,
                totalRecords: this.data.length
            });

        } catch (error) {
            this.logger.error('Filter application failed', {
                id: this.id,
                error: error.message,
                filters
            });
            this.handleError(error, { operation: 'applyFilters', filters });
        } finally {
            this.endPerformanceTimer(timer);
        }
    }

    // ========================================
    // ACCESSIBILITY OVERRIDES
    // ========================================

    getAriaRole() {
        return 'grid';
    }

    getAriaLabel() {
        return `Data grid with ${this.data.length} records`;
    }

    isInteractive() {
        return true;
    }

    handleKeyDown(event) {
        // DataGrid-specific keyboard handling
        switch (event.key) {
            case 'ArrowUp':
                this.navigateUp();
                event.preventDefault();
                break;
            case 'ArrowDown':
                this.navigateDown();
                event.preventDefault();
                break;
            case 'ArrowLeft':
                this.navigateLeft();
                event.preventDefault();
                break;
            case 'ArrowRight':
                this.navigateRight();
                event.preventDefault();
                break;
            case 'Space':
                this.toggleRowSelection();
                event.preventDefault();
                break;
            case 'Delete':
                this.deleteSelectedRows();
                event.preventDefault();
                break;
            default:
                // Call parent handler for common keys
                super.handleKeyDown(event);
        }
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    /**
     * Generate schema from data
     */
    generateSchemaFromData() {
        if (this.data.length === 0) return;

        const firstRecord = this.data[0];
        this.schema = {};

        Object.keys(firstRecord).forEach(key => {
            const value = firstRecord[key];
            this.schema[key] = {
                type: this.inferDataType(value),
                displayName: this.formatDisplayName(key),
                htmlElement: 'input',
                htmlType: this.inferHtmlType(value),
                css: { placeholder: `Enter ${key}` },
                required: false
            };
        });
    }

    /**
     * Update derived data arrays
     */
    updateDerivedData() {
        // Apply search and filters
        let workingData = [...this.data];

        // Apply search if present
        if (this.searchTerm) {
            workingData = workingData.filter(record => 
                this.searchInRecord(record, this.searchTerm)
            );
        }

        // Apply filters if present
        if (this.activeFilters.length > 0) {
            workingData = workingData.filter(record =>
                this.evaluateFilters(record, this.activeFilters)
            );
        }

        this.filteredData = workingData;

        // Apply sorting
        if (this.sortConfig) {
            this.sortedData = this.applySorting(this.filteredData, this.sortConfig);
        } else {
            this.sortedData = [...this.filteredData];
        }

        // Recalculate pagination
        this.calculatePagination();
    }

    /**
     * Update comprehensive performance metrics - Best Practices Implementation
     */
    updateRenderMetrics(renderTime) {
        this.renderMetrics.lastRenderTime = renderTime;
        this.renderMetrics.renderCount++;
        
        // Track min/max for performance analysis
        this.renderMetrics.maxRenderTime = Math.max(this.renderMetrics.maxRenderTime, renderTime);
        this.renderMetrics.minRenderTime = Math.min(this.renderMetrics.minRenderTime, renderTime);
        
        // Calculate moving average
        const alpha = 0.1; // Smoothing factor
        this.renderMetrics.averageRenderTime = 
            this.renderMetrics.averageRenderTime * (1 - alpha) + renderTime * alpha;

        // Performance threshold alerts - Best Practice
        if (renderTime > 100) {
            this.logger.warn('Slow render detected', {
                id: this.id,
                renderTime: renderTime.toFixed(2),
                threshold: 100,
                recordCount: this.getVisibleData().length,
                recommendation: 'Consider enabling virtualization or reducing page size'
            });
        }

        // Log performance milestone achievements
        if (this.renderMetrics.renderCount % 10 === 0) {
            this.logger.info('Performance milestone', {
                id: this.id,
                renders: this.renderMetrics.renderCount,
                avgRenderTime: this.renderMetrics.averageRenderTime.toFixed(2),
                maxRenderTime: this.renderMetrics.maxRenderTime.toFixed(2),
                minRenderTime: this.renderMetrics.minRenderTime.toFixed(2),
                performanceGrade: this.getPerformanceGrade()
            });
        }
    }

    /**
     * Calculate performance grade based on metrics
     */
    getPerformanceGrade() {
        const avgTime = this.renderMetrics.averageRenderTime;
        if (avgTime < 16) return 'A+'; // 60fps
        if (avgTime < 33) return 'A';  // 30fps
        if (avgTime < 50) return 'B';  // Good
        if (avgTime < 100) return 'C'; // Acceptable
        return 'D'; // Needs optimization
    }

    /**
     * Track user interaction metrics
     */
    trackUserInteraction(interactionType, startTime = null) {
        const interactionTime = Date.now();
        this.userInteractionMetrics.lastInteractionTime = interactionTime;
        
        // Calculate response time if start time provided
        if (startTime) {
            const responseTime = interactionTime - startTime;
            const alpha = 0.2;
            this.userInteractionMetrics.averageInteractionResponse = 
                this.userInteractionMetrics.averageInteractionResponse * (1 - alpha) + responseTime * alpha;
        }

        // Increment specific interaction counters
        switch (interactionType) {
            case 'pageNavigation':
                this.userInteractionMetrics.pageNavigations++;
                break;
            case 'pageSizeChange':
                this.userInteractionMetrics.pageSizeChanges++;
                break;
            case 'search':
                this.userInteractionMetrics.searchOperations++;
                break;
            case 'filter':
                this.userInteractionMetrics.filterOperations++;
                break;
            case 'recordModification':
                this.userInteractionMetrics.recordModifications++;
                break;
        }

        // Log interaction patterns for UX analysis
        if (this.userInteractionMetrics.pageNavigations % 5 === 0 && this.userInteractionMetrics.pageNavigations > 0) {
            this.logger.debug('User interaction pattern', {
                id: this.id,
                totalInteractions: this.getTotalInteractions(),
                averageResponseTime: this.userInteractionMetrics.averageInteractionResponse.toFixed(2),
                navigationPattern: 'frequent-pagination',
                recommendation: this.getUXRecommendation()
            });
        }
    }

    /**
     * Get total user interactions
     */
    getTotalInteractions() {
        const metrics = this.userInteractionMetrics;
        return metrics.pageNavigations + metrics.pageSizeChanges + 
               metrics.searchOperations + metrics.filterOperations + 
               metrics.recordModifications;
    }

    /**
     * Provide UX recommendations based on usage patterns
     */
    getUXRecommendation() {
        const metrics = this.userInteractionMetrics;
        
        if (metrics.pageNavigations > 10 && metrics.pageSizeChanges === 0) {
            return 'Consider increasing default page size - user navigates pages frequently';
        }
        
        if (metrics.searchOperations > metrics.filterOperations * 3) {
            return 'Consider improving filter UI - user prefers search over filters';
        }
        
        if (this.userInteractionMetrics.averageInteractionResponse > 500) {
            return 'Response time high - consider performance optimization';
        }
        
        return 'Usage patterns normal';
    }

    /**
     * Track data quality metrics
     */
    updateDataQualityMetrics() {
        const startTime = performance.now();
        
        this.dataQualityMetrics.totalRecords = this.data.length;
        this.dataQualityMetrics.validRecords = 0;
        this.dataQualityMetrics.duplicateRecords = 0;
        this.dataQualityMetrics.incompleteRecords = 0;
        
        const seenIds = new Set();
        
        this.data.forEach(record => {
            // Check for duplicates
            if (seenIds.has(record.id)) {
                this.dataQualityMetrics.duplicateRecords++;
            } else {
                seenIds.add(record.id);
            }
            
            // Check for completeness
            const requiredFields = Object.keys(this.schema).filter(key => 
                this.schema[key].required);
            const isComplete = requiredFields.every(field => 
                record[field] !== null && record[field] !== undefined && record[field] !== '');
            
            if (isComplete) {
                this.dataQualityMetrics.validRecords++;
            } else {
                this.dataQualityMetrics.incompleteRecords++;
            }
        });
        
        this.dataQualityMetrics.dataLoadTime = performance.now() - startTime;
        
        // Log data quality insights
        const qualityScore = this.dataQualityMetrics.totalRecords > 0 ? 
            (this.dataQualityMetrics.validRecords / this.dataQualityMetrics.totalRecords) * 100 : 100;
            
        this.logger.info('Data quality analysis', {
            id: this.id,
            totalRecords: this.dataQualityMetrics.totalRecords,
            qualityScore: qualityScore.toFixed(1) + '%',
            duplicates: this.dataQualityMetrics.duplicateRecords,
            incomplete: this.dataQualityMetrics.incompleteRecords,
            analysisTime: this.dataQualityMetrics.dataLoadTime.toFixed(2) + 'ms'
        });
    }

    /**
     * Get current visible data based on pagination
     */
    getVisibleData() {
        if (!this.options.pagination) {
            return this.sortedData;
        }

        const startIndex = (this.currentPage - 1) * this.options.pageSize;
        const endIndex = startIndex + this.options.pageSize;
        return this.sortedData.slice(startIndex, endIndex);
    }

    /**
     * Clean up DataGrid-specific resources with comprehensive metrics logging
     */
    cleanupDataGridResources() {
        // Log final session metrics before cleanup
        const sessionDuration = (Date.now() - this.usabilityMetrics.sessionDuration) / 1000;
        
        this.logger.info('DataGrid session summary', {
            id: this.id,
            sessionDuration: `${sessionDuration.toFixed(1)}s`,
            renderMetrics: {
                totalRenders: this.renderMetrics.renderCount,
                averageRenderTime: this.renderMetrics.averageRenderTime.toFixed(2),
                performanceGrade: this.getPerformanceGrade()
            },
            userMetrics: {
                totalInteractions: this.getTotalInteractions(),
                pageNavigations: this.userInteractionMetrics.pageNavigations,
                pageSizeChanges: this.userInteractionMetrics.pageSizeChanges,
                searchOperations: this.userInteractionMetrics.searchOperations,
                filterOperations: this.userInteractionMetrics.filterOperations,
                recordModifications: this.userInteractionMetrics.recordModifications,
                userErrorRate: this.usabilityMetrics.userErrorRate,
                uxRecommendation: this.getUXRecommendation()
            },
            dataQuality: {
                totalRecords: this.dataQualityMetrics.totalRecords,
                qualityScore: this.dataQualityMetrics.totalRecords > 0 ? 
                    ((this.dataQualityMetrics.validRecords / this.dataQualityMetrics.totalRecords) * 100).toFixed(1) + '%' : 'N/A',
                duplicates: this.dataQualityMetrics.duplicateRecords,
                incomplete: this.dataQualityMetrics.incompleteRecords
            }
        });

        // Clear data arrays
        this.data = [];
        this.filteredData = [];
        this.sortedData = [];
        this.selectedRows.clear();
        
        // Clear validation errors
        this.validationErrors.clear();
        
        // Reset all metrics
        this.renderMetrics = {
            lastRenderTime: 0,
            averageRenderTime: 0,
            renderCount: 0,
            maxRenderTime: 0,
            minRenderTime: Infinity
        };

        this.userInteractionMetrics = {
            pageNavigations: 0,
            pageSizeChanges: 0,
            searchOperations: 0,
            filterOperations: 0,
            recordModifications: 0,
            lastInteractionTime: null,
            averageInteractionResponse: 0
        };

        this.dataQualityMetrics = {
            totalRecords: 0,
            validRecords: 0,
            duplicateRecords: 0,
            incompleteRecords: 0,
            validationErrors: 0,
            dataLoadTime: 0
        };

        this.accessibilityMetrics = {
            keyboardNavigations: 0,
            screenReaderInteractions: 0,
            focusEvents: 0,
            ariaAnnouncements: 0
        };

        this.usabilityMetrics = {
            averageTaskCompletionTime: 0,
            userErrorRate: 0,
            helpRequestsCount: 0,
            undoOperations: 0,
            sessionDuration: Date.now()
        };

        this.logger.debug('DataGrid resources and comprehensive metrics cleaned up', { id: this.id });
    }

    // ========================================
    // PLACEHOLDER METHODS (To be implemented)
    // ========================================

    setupDataGridEventListeners() {
        // Implement DataGrid-specific event listeners
    }

    loadData() {
        // Data loading is handled by initializeDataSource()
        // This method can be used for external data loading operations
        // Only load sample data if no data was provided in options
        if (this.data.length === 0 && !this.options.data) {
            this.logger.warn('No data loaded and no data provided in options, attempting to load sample data', { id: this.id });
            this.loadSampleData();
        } else {
            this.logger.debug('Data already loaded, skipping sample data load', { 
                id: this.id, 
                recordCount: this.data.length,
                hasOptionsData: !!this.options.data
            });
        }
    }

    loadFromSource(source) {
        // Implement source data loading
    }

    loadSampleData() {
        // Only load sample data if no data was provided via options
        if (this.options.data && this.options.data.length > 0) {
            this.logger.debug('Data provided via options, skipping sample data load', { id: this.id });
            return;
        }
        
        // Load default sample data
        if (typeof dataGridData !== 'undefined') {
            this.logger.info('Loading sample data from dataGridData', { id: this.id });
            this.setData(dataGridData.positions.data, dataGridData.positions.schema);
        } else {
            this.logger.warn('Sample data (dataGridData) not available', { id: this.id });
        }
    }

    renderLoadingState() {
        // Implement loading state rendering
    }

    renderHeader() {
        if (!this.schema || Object.keys(this.schema).length === 0) {
            this.logger.warn('No schema available for header rendering', { id: this.id });
            return;
        }

        // Create a proper header row with DataGridHeader class
        const headerRow = document.createElement('div');
        headerRow.className = 'DataGridRow DataGridHeader';
        headerRow.setAttribute('role', 'row');
        
        // Create header cells based on schema, filtering out non-visible fields
        Object.keys(this.schema).forEach(fieldName => {
            const field = this.schema[fieldName];
            
            // Skip fields marked as not visible
            if (field.visible === false) {
                return;
            }
            
            const displayName = field.displayName || fieldName;
            
            const headerCell = document.createElement('div');
            headerCell.className = 'DataGridCell';
            headerCell.setAttribute('role', 'columnheader');
            headerCell.textContent = displayName;
            headerCell.style.fontWeight = '600';
            headerCell.style.backgroundColor = 'rgb(69, 69, 69)';
            headerCell.style.color = 'white';
            headerRow.appendChild(headerCell);
        });
        
        this.container.appendChild(headerRow);
        
        const visibleFields = Object.keys(this.schema).filter(key => this.schema[key].visible !== false);
        this.logger.debug('Header rendered with displayNames, respecting visibility', {
            id: this.id,
            totalFields: Object.keys(this.schema).length,
            visibleFields: visibleFields.length,
            hiddenFields: Object.keys(this.schema).length - visibleFields.length,
            columns: visibleFields.map(key => ({
                field: key,
                displayName: this.schema[key].displayName || key
            }))
        });
    }

    renderDataRows() {
        const visibleData = this.getVisibleData();
        
        console.log('renderDataRows debug:', {
            totalData: this.data.length,
            filteredData: this.filteredData.length,
            sortedData: this.sortedData.length,
            visibleData: visibleData.length,
            currentPage: this.currentPage,
            pageSize: this.options.pageSize,
            schemaKeys: Object.keys(this.schema)
        });
        
        if (visibleData.length === 0) {
            console.log('No visible data, rendering empty state');
            this.renderEmptyState();
            return;
        }

        visibleData.forEach((record, index) => {
            const dataRow = document.createElement('div');
            dataRow.className = 'DataGridRow';
            dataRow.setAttribute('role', 'row');
            dataRow.setAttribute('data-record-id', record.id || index);
            
            // Add row selection capability
            if (this.selectedRows.has(record.id || index)) {
                dataRow.classList.add('selected');
            }
            
            // Create data cells based on schema, filtering out non-visible fields
            Object.keys(this.schema).forEach(fieldName => {
                const field = this.schema[fieldName];
                
                // Skip fields marked as not visible
                if (field.visible === false) {
                    return;
                }
                
                const dataCell = document.createElement('div');
                dataCell.className = 'DataGridCell';
                dataCell.setAttribute('role', 'gridcell');
                
                const value = record[fieldName];
                dataCell.textContent = this.formatCellValue(value, this.schema[fieldName]);
                
                // Add click handler for editing if enabled
                if (this.options.editable) {
                    dataCell.addEventListener('click', () => {
                        this.handleCellEdit(record.id || index, fieldName, dataCell);
                    });
                    dataCell.style.cursor = 'pointer';
                    dataCell.title = 'Click to edit';
                }
                
                dataRow.appendChild(dataCell);
            });
            
            // Add row click handler
            dataRow.addEventListener('click', (event) => {
                if (!event.target.closest('.DataGridCell')) {
                    this.handleRowSelection(record.id || index);
                }
            });
            
            this.container.appendChild(dataRow);
        });
        
        this.logger.debug('Data rows rendered', {
            id: this.id,
            rowCount: visibleData.length,
            totalRecords: this.data.length
        });
    }

    renderEmptyState() {
        const emptyRow = document.createElement('div');
        emptyRow.className = 'DataGridRow empty-state';
        emptyRow.style.textAlign = 'center';
        emptyRow.style.padding = '40px 20px';
        emptyRow.style.color = '#6c757d';
        emptyRow.style.fontStyle = 'italic';
        
        const emptyCell = document.createElement('div');
        emptyCell.className = 'DataGridCell';
        emptyCell.style.gridColumn = '1 / -1';
        emptyCell.textContent = this.searchTerm ? 
            `No records found matching "${this.searchTerm}"` : 
            'No data available';
        
        emptyRow.appendChild(emptyCell);
        this.container.appendChild(emptyRow);
    }

    formatCellValue(value, fieldSchema) {
        if (value === null || value === undefined) {
            return '';
        }
        
        switch (fieldSchema?.type) {
            case 'date':
                return new Date(value).toLocaleDateString();
            case 'email':
                return value;
            case 'phone':
                return value;
            case 'number':
                return typeof value === 'number' ? value.toLocaleString() : value;
            case 'boolean':
                return value ? '✓' : '✗';
            default:
                return String(value);
        }
    }

    handleCellEdit(recordId, fieldName, cellElement) {
        this.logger.debug('Cell edit initiated', {
            id: this.id,
            recordId,
            fieldName
        });
        
        // Simple implementation - could be enhanced with inline editing
        const currentValue = cellElement.textContent;
        const newValue = prompt(`Edit ${fieldName}:`, currentValue);
        
        if (newValue !== null && newValue !== currentValue) {
            const updates = { [fieldName]: newValue };
            this.updateRecord(recordId, updates);
        }
    }

    handleRowSelection(recordId) {
        if (this.selectedRows.has(recordId)) {
            this.selectedRows.delete(recordId);
        } else {
            this.selectedRows.add(recordId);
        }
        
        // Re-render to show selection changes
        this.render();
        
        this.trigger('datagrid:selectionChanged', {
            id: this.id,
            selectedRows: Array.from(this.selectedRows),
            selectionCount: this.selectedRows.size
        });
    }

    renderFooter() {
        // Always render footer with pagination controls - best practice for consistent UX
        const paginationInfo = this.getPaginationInfo();
        const isEnabled = this.options.pagination;
        const isEmpty = paginationInfo.total === 0;
        
        // Calculate performance metrics
        const avgRenderTime = this.renderMetrics.averageRenderTime;
        const performanceStatus = avgRenderTime < 50 ? 'excellent' : avgRenderTime < 100 ? 'good' : 'needs-optimization';
        
        // Define metric configuration - simplified to three distinct columns
        const metricsConfig = {
            left: [
                { type: 'page', html: `<span class="metric-row"><span class="metric-label">Page:</span><span class="metric-value">${this.currentPage} of ${this.totalPages}</span></span>` },
                { type: 'filter', html: `<div style="margin-left: 10px; display: flex; align-items: center;"><input type="checkbox" id="showDisabledFilter_${this.id}" ${this.showDisabledRecords ? 'checked' : ''} style="margin-right: 8px;"><label for="showDisabledFilter_${this.id}" style="color: white; font-size: 12px; cursor: pointer;">Show disabled records</label></div>` }
            ],
            middle: [
                { type: 'controls', html: `<div class="combined-controls"><div class="pagination-buttons">${this.renderPaginationButtons(isEnabled, isEmpty)}</div><div class="control-row"><label for="pageSize_${this.id}" class="control-label">Per page:</label><select id="pageSize_${this.id}" class="page-size-select" aria-label="Number of items per page" ${!isEnabled ? 'disabled title="Enable pagination to use this control"' : ''}>${this.getPageSizeOptions().map(size => `<option value="${size}" ${size === this.options.pageSize ? 'selected' : ''}>${size}</option>`).join('')}</select></div></div>` }
            ],
            right: [
                // Right column intentionally empty - all other metrics removed
            ]
        };
        
        const footerHtml = `
            <div class="datagrid-footer ${!isEnabled ? 'pagination-disabled' : ''} ${isEmpty ? 'empty-data' : ''}" 
                 role="navigation" aria-label="Pagination and Data Information">
                
                <!-- Three-Area Metrics Layout with Configurable Placement -->
                <div class="metrics-columns">
                    <div class="metrics-area left">
                        ${metricsConfig.left.map(metric => metric.html).join('')}
                    </div>
                    
                    <div class="metrics-area middle">
                        ${metricsConfig.middle.map(metric => metric.html).join('')}
                    </div>
                    
                    <div class="metrics-area right">
                        ${metricsConfig.right.map(metric => metric.html).join('')}
                    </div>
                </div>
            </div>
        `;

        // Append footer to container
        const footerElement = document.createElement('div');
        footerElement.innerHTML = footerHtml;
        const footer = footerElement.firstElementChild;
        
        // Force the styling directly to ensure it shows up
        footer.style.cssText += `
            background: rgb(69, 69, 69) !important;
            color: white !important;
            border: none !important;
            border-radius: 4px !important;
            margin-top: 8px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            display: flex !important;
        `;
        
        // Also ensure the metrics-columns container is properly styled
        const metricsColumns = footer.querySelector('.metrics-columns');
        if (metricsColumns) {
            metricsColumns.style.cssText += `
                display: flex !important;
                width: 100% !important;
                justify-content: space-between !important;
                align-items: center !important;
            `;
        }
        
        // Force the combined controls to display side by side
        const combinedControls = footer.querySelector('.combined-controls');
        if (combinedControls) {
            combinedControls.style.cssText += `
                display: flex !important;
                align-items: center !important;
                gap: 16px !important;
                justify-content: center !important;
                flex-wrap: nowrap !important;
            `;
        }
        
        // Force styling for all three metrics areas
        const leftArea = footer.querySelector('.metrics-area.left');
        if (leftArea) {
            leftArea.style.cssText += `
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                flex: 1 1 33.333% !important;
                min-width: 0 !important;
                padding: 8px 12px !important;
                min-height: 30px !important;
                border-right: 1px solid rgb(69, 69, 69) !important;
                background: transparent !important;
                color: white !important;
            `;
        }
        
        const middleArea = footer.querySelector('.metrics-area.middle');
        if (middleArea) {
            middleArea.style.cssText += `
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                flex: 1 1 33.333% !important;
                min-width: 0 !important;
                padding: 8px 12px !important;
                min-height: 30px !important;
                border-right: 1px solid rgb(69, 69, 69) !important;
                background: transparent !important;
                color: white !important;
                flex-wrap: nowrap !important;
            `;
        }
        
        const rightArea = footer.querySelector('.metrics-area.right');
        if (rightArea) {
            rightArea.style.cssText += `
                display: flex !important;
                align-items: center !important;
                justify-content: flex-end !important;
                flex: 1 1 33.333% !important;
                min-width: 0 !important;
                padding: 8px 12px !important;
                min-height: 30px !important;
                background: transparent !important;
                color: white !important;
            `;
        }
        
        this.container.appendChild(footer);

        // Set up footer event listeners
        this.setupFooterEventListeners();

        // Log detailed footer metrics
        this.logger.debug('Footer rendered with comprehensive metrics', {
            id: this.id,
            paginationEnabled: isEnabled,
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            pageSize: this.options.pageSize,
            totalRecords: paginationInfo.total,
            visibleRecords: paginationInfo.end - paginationInfo.start + 1,
            performanceStatus,
            avgRenderTime: avgRenderTime.toFixed(2),
            hasFilters: this.activeFilters.length > 0,
            hasSearch: !!this.searchTerm,
            selectedCount: this.selectedRows.size,
            hasUnsavedChanges: this.hasUnsavedChanges
        });
    }

    validateRecord(record) {
        // Implement record validation
        return { isValid: true, errors: [] };
    }

    generateRecordId() {
        return `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    searchInRecord(record, searchTerm) {
        // Implement record search logic
        return true;
    }

    evaluateFilters(record, filters) {
        // Implement filter evaluation logic
        return true;
    }

    calculatePagination() {
        if (this.options.pagination) {
            const totalRecords = this.sortedData.length;
            this.totalPages = Math.ceil(totalRecords / this.options.pageSize);
            
            // Ensure current page is valid
            if (this.currentPage > this.totalPages) {
                this.currentPage = Math.max(1, this.totalPages);
            }
            
            // Update pagination state
            this.paginationState = {
                currentPage: this.currentPage,
                totalPages: this.totalPages,
                pageSize: this.options.pageSize,
                totalRecords,
                hasNextPage: this.currentPage < this.totalPages,
                hasPreviousPage: this.currentPage > 1,
                startRecord: ((this.currentPage - 1) * this.options.pageSize) + 1,
                endRecord: Math.min(this.currentPage * this.options.pageSize, totalRecords)
            };

            this.logger.debug('Pagination calculated', {
                id: this.id,
                ...this.paginationState
            });
        }
    }

    applySorting(data, sortConfig) {
        // Implement sorting logic
        return data;
    }

    inferDataType(value) {
        if (typeof value === 'number') return 'number';
        if (value instanceof Date) return 'date';
        if (typeof value === 'boolean') return 'boolean';
        return 'string';
    }

    inferHtmlType(value) {
        if (typeof value === 'number') return 'number';
        if (value instanceof Date) return 'date';
        return 'text';
    }

    formatDisplayName(key) {
        return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    }

    // ========================================
    // PAGINATION METHODS
    // ========================================

    /**
     * Go to specific page
     */
    goToPage(pageNumber) {
        const interactionStart = Date.now();
        
        this.logger.debug('Navigating to page', {
            id: this.id,
            fromPage: this.currentPage,
            toPage: pageNumber
        });

        const timer = this.startPerformanceTimer('pagination_navigate');

        try {
            // Validate page number
            if (pageNumber < 1 || pageNumber > this.totalPages) {
                this.usabilityMetrics.userErrorRate++;
                throw new Error(`Invalid page number: ${pageNumber}. Valid range: 1-${this.totalPages}`);
            }

            const oldPage = this.currentPage;
            this.currentPage = pageNumber;
            
            // Recalculate pagination state
            this.calculatePagination();
            
            // Track user interaction
            this.trackUserInteraction('pageNavigation', interactionStart);
            
            // Trigger page change event with enhanced metrics
            this.trigger('datagrid:pageChanged', {
                id: this.id,
                oldPage,
                newPage: this.currentPage,
                totalPages: this.totalPages,
                paginationState: this.paginationState,
                userMetrics: {
                    totalNavigations: this.userInteractionMetrics.pageNavigations,
                    responseTime: Date.now() - interactionStart,
                    navigationDirection: pageNumber > oldPage ? 'forward' : 'backward',
                    jumpSize: Math.abs(pageNumber - oldPage)
                }
            });

            this.logger.info('Page navigation completed', {
                id: this.id,
                currentPage: this.currentPage,
                totalPages: this.totalPages,
                navigationPattern: this.analyzeNavigationPattern(oldPage, pageNumber),
                totalNavigations: this.userInteractionMetrics.pageNavigations
            });

            // Re-render to show new page
            this.render();

            return true;

        } catch (error) {
            this.logger.error('Page navigation failed', {
                id: this.id,
                error: error.message,
                requestedPage: pageNumber,
                userErrorCount: this.usabilityMetrics.userErrorRate
            });
            this.handleError(error, { operation: 'goToPage', pageNumber });
            return false;
        } finally {
            this.endPerformanceTimer(timer);
        }
    }

    /**
     * Analyze navigation patterns for UX insights
     */
    analyzeNavigationPattern(fromPage, toPage) {
        const jump = Math.abs(toPage - fromPage);
        const direction = toPage > fromPage ? 'forward' : 'backward';
        
        if (jump === 1) return `sequential_${direction}`;
        if (jump <= 3) return `short_jump_${direction}`;
        if (jump <= 10) return `medium_jump_${direction}`;
        return `long_jump_${direction}`;
    }

    /**
     * Go to next page
     */
    nextPage() {
        if (this.currentPage < this.totalPages) {
            return this.goToPage(this.currentPage + 1);
        }
        
        this.logger.debug('Next page requested but already on last page', {
            id: this.id,
            currentPage: this.currentPage,
            totalPages: this.totalPages
        });
        return false;
    }

    /**
     * Go to previous page
     */
    previousPage() {
        if (this.currentPage > 1) {
            return this.goToPage(this.currentPage - 1);
        }
        
        this.logger.debug('Previous page requested but already on first page', {
            id: this.id,
            currentPage: this.currentPage
        });
        return false;
    }

    /**
     * Go to first page
     */
    firstPage() {
        return this.goToPage(1);
    }

    /**
     * Go to last page
     */
    lastPage() {
        return this.goToPage(this.totalPages);
    }

    /**
     * Change page size with comprehensive tracking
     */
    setPageSize(newPageSize) {
        const interactionStart = Date.now();
        
        this.logger.debug('Changing page size', {
            id: this.id,
            oldPageSize: this.options.pageSize,
            newPageSize
        });

        const timer = this.startPerformanceTimer('set_page_size');

        try {
            // Validate page size
            if (newPageSize < 1) {
                this.usabilityMetrics.userErrorRate++;
                throw new Error('Page size must be greater than 0');
            }
            
            if (newPageSize > 20) {
                this.usabilityMetrics.userErrorRate++;
                throw new Error('Page size cannot exceed 20 records');
            }

            const oldPageSize = this.options.pageSize;
            this.options.pageSize = newPageSize;

            // Calculate what the current page should be to maintain position
            const currentFirstRecord = ((this.currentPage - 1) * oldPageSize) + 1;
            const newPage = Math.ceil(currentFirstRecord / newPageSize);
            
            this.currentPage = newPage;
            this.calculatePagination();

            // Track user interaction
            this.trackUserInteraction('pageSizeChange', interactionStart);
            
            // Analyze page size preference patterns
            const pageSizePattern = this.analyzePageSizePattern(oldPageSize, newPageSize);

            // Trigger page size change event with enhanced metrics
            this.trigger('datagrid:pageSizeChanged', {
                id: this.id,
                oldPageSize,
                newPageSize,
                currentPage: this.currentPage,
                totalPages: this.totalPages,
                userMetrics: {
                    totalPageSizeChanges: this.userInteractionMetrics.pageSizeChanges,
                    responseTime: Date.now() - interactionStart,
                    sizeChangePattern: pageSizePattern,
                    preferenceAnalysis: this.getPageSizePreference()
                }
            });

            this.logger.info('Page size changed successfully', {
                id: this.id,
                oldPageSize,
                newPageSize,
                currentPage: this.currentPage,
                totalPages: this.totalPages,
                pattern: pageSizePattern,
                totalChanges: this.userInteractionMetrics.pageSizeChanges
            });

            // Re-render with new page size
            this.render();

            return true;

        } catch (error) {
            this.logger.error('Page size change failed', {
                id: this.id,
                error: error.message,
                requestedPageSize: newPageSize,
                userErrorCount: this.usabilityMetrics.userErrorRate
            });
            this.handleError(error, { operation: 'setPageSize', newPageSize });
            return false;
        } finally {
            this.endPerformanceTimer(timer);
        }
    }

    /**
     * Analyze page size change patterns
     */
    analyzePageSizePattern(oldSize, newSize) {
        if (newSize > oldSize * 2) return 'dramatic_increase';
        if (newSize > oldSize) return 'increase';
        if (newSize < oldSize / 2) return 'dramatic_decrease';
        if (newSize < oldSize) return 'decrease';
        return 'no_change';
    }

    /**
     * Get user's page size preferences based on history
     */
    getPageSizePreference() {
        const currentSize = this.options.pageSize;
        const totalRecords = this.data.length;
        const ratio = totalRecords / currentSize;
        
        if (ratio < 2) return 'prefers_all_data_visible';
        if (ratio < 5) return 'prefers_large_pages';
        if (ratio < 20) return 'prefers_medium_pages';
        return 'prefers_small_pages';
    }

    /**
     * Get pagination information
     */
    getPaginationInfo() {
        if (!this.options.pagination) {
            return {
                start: 1,
                end: this.sortedData.length,
                total: this.sortedData.length,
                currentPage: 1,
                totalPages: 1
            };
        }

        const total = this.sortedData.length;
        const start = total === 0 ? 0 : ((this.currentPage - 1) * this.options.pageSize) + 1;
        const end = Math.min(this.currentPage * this.options.pageSize, total);

        return {
            start,
            end,
            total,
            currentPage: this.currentPage,
            totalPages: this.totalPages
        };
    }

    /**
     * Get available page size options
     * Maximum display limit is 20 records per page
     */
    getPageSizeOptions() {
        const defaultOptions = [5, 10, 15, 20];
        
        console.log('DEBUG: getPageSizeOptions called, defaultOptions:', defaultOptions);
        
        if (this.options.pageSizeOptions) {
            console.log('DEBUG: Using custom pageSizeOptions:', this.options.pageSizeOptions);
            return this.options.pageSizeOptions;
        }
        
        // Ensure current page size is included but capped at 20
        if (!defaultOptions.includes(this.options.pageSize) && this.options.pageSize <= 20) {
            defaultOptions.push(this.options.pageSize);
            defaultOptions.sort((a, b) => a - b);
        }
        
        console.log('DEBUG: Final page size options:', defaultOptions);
        return defaultOptions;
    }

    /**
     * Render pagination buttons - Always visible for consistent UX
     */
    renderPaginationButtons(isEnabled = true, isEmpty = false) {
        const current = this.currentPage;
        const total = this.totalPages;
        const maxButtons = 7; // Maximum number of page buttons to show
        
        // Show minimal controls when disabled or empty
        if (!isEnabled || isEmpty || total <= 1) {
            return `
                <div class="pagination-buttons ${!isEnabled ? 'disabled' : ''} ${isEmpty ? 'empty' : ''}">
                    <button type="button" class="pagination-btn first-page" disabled 
                            aria-label="Go to first page" title="${!isEnabled ? 'Pagination disabled' : 'No pagination needed'}">
                        <span aria-hidden="true">«</span>
                    </button>
                    <button type="button" class="pagination-btn prev-page" disabled 
                            aria-label="Go to previous page" title="${!isEnabled ? 'Pagination disabled' : 'No previous page'}">
                        <span aria-hidden="true">‹</span>
                    </button>
                    <span class="pagination-status">
                        ${isEmpty ? 'No data' : !isEnabled ? 'Pagination off' : `Page 1 of 1`}
                    </span>
                    <button type="button" class="pagination-btn next-page" disabled 
                            aria-label="Go to next page" title="${!isEnabled ? 'Pagination disabled' : 'No next page'}">
                        <span aria-hidden="true">›</span>
                    </button>
                    <button type="button" class="pagination-btn last-page" disabled 
                            aria-label="Go to last page" title="${!isEnabled ? 'Pagination disabled' : 'No pagination needed'}">
                        <span aria-hidden="true">»</span>
                    </button>
                </div>
            `;
        }
        
        let buttons = [];

        // First page button
        buttons.push(`
            <button type="button" class="pagination-btn first-page" 
                    ${current === 1 ? 'disabled' : ''} 
                    data-page="1" aria-label="Go to first page">
                <span aria-hidden="true">«</span>
            </button>
        `);

        // Previous page button
        buttons.push(`
            <button type="button" class="pagination-btn prev-page" 
                    ${current === 1 ? 'disabled' : ''} 
                    data-page="${current - 1}" aria-label="Go to previous page">
                <span aria-hidden="true">‹</span>
            </button>
        `);

        // Page number buttons
        const pageButtons = this.calculatePageButtons(current, total, maxButtons);
        buttons.push(...pageButtons);

        // Next page button
        buttons.push(`
            <button type="button" class="pagination-btn next-page" 
                    ${current === total ? 'disabled' : ''} 
                    data-page="${current + 1}" aria-label="Go to next page">
                <span aria-hidden="true">›</span>
            </button>
        `);

        // Last page button
        buttons.push(`
            <button type="button" class="pagination-btn last-page" 
                    ${current === total ? 'disabled' : ''} 
                    data-page="${total}" aria-label="Go to last page">
                <span aria-hidden="true">»</span>
            </button>
        `);

        return `<div class="pagination-buttons" role="navigation" aria-label="Pagination Navigation">
            ${buttons.join('')}
        </div>`;
    }

    /**
     * Calculate which page buttons to show
     */
    calculatePageButtons(current, total, maxButtons) {
        const buttons = [];
        const pageButtonCount = maxButtons - 4; // Exclude first, prev, next, last buttons
        
        if (total <= pageButtonCount) {
            // Show all pages if total is small
            for (let i = 1; i <= total; i++) {
                buttons.push(this.createPageButton(i, i === current));
            }
        } else {
            // Calculate range around current page
            let start = Math.max(1, current - Math.floor(pageButtonCount / 2));
            let end = Math.min(total, start + pageButtonCount - 1);
            
            // Adjust start if we're near the end
            if (end - start + 1 < pageButtonCount) {
                start = Math.max(1, end - pageButtonCount + 1);
            }
            
            // Add ellipsis before if needed
            if (start > 1) {
                buttons.push(this.createPageButton(1, false));
                if (start > 2) {
                    buttons.push('<span class="pagination-ellipsis" aria-hidden="true">…</span>');
                }
            }
            
            // Add page buttons
            for (let i = start; i <= end; i++) {
                buttons.push(this.createPageButton(i, i === current));
            }
            
            // Add ellipsis after if needed
            if (end < total) {
                if (end < total - 1) {
                    buttons.push('<span class="pagination-ellipsis" aria-hidden="true">…</span>');
                }
                buttons.push(this.createPageButton(total, false));
            }
        }
        
        return buttons;
    }

    /**
     * Create a page button
     */
    createPageButton(pageNumber, isCurrent) {
        return `
            <button type="button" 
                    class="pagination-btn page-number ${isCurrent ? 'current' : ''}" 
                    data-page="${pageNumber}" 
                    ${isCurrent ? 'aria-current="page"' : ''}
                    aria-label="Go to page ${pageNumber}">
                ${pageNumber}
            </button>
        `;
    }

    /**
     * Set up footer event listeners
     */
    setupFooterEventListeners() {
        const footer = this.container.querySelector('.datagrid-footer');
        if (!footer) return;

        // Page size selector
        const pageSizeSelect = footer.querySelector('.page-size-select');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (event) => {
                const newPageSize = parseInt(event.target.value, 10);
                this.setPageSize(newPageSize);
            });
        }

        // Pagination buttons
        const paginationButtons = footer.querySelector('.pagination-buttons');
        if (paginationButtons) {
            paginationButtons.addEventListener('click', (event) => {
                const button = event.target.closest('.pagination-btn');
                if (!button || button.disabled) return;

                const pageNumber = parseInt(button.dataset.page, 10);
                if (!isNaN(pageNumber)) {
                    this.goToPage(pageNumber);
                }
            });
        }

        // Show disabled records filter checkbox
        const showDisabledCheckbox = footer.querySelector(`#showDisabledFilter_${this.id}`);
        if (showDisabledCheckbox) {
            showDisabledCheckbox.addEventListener('change', (event) => {
                const showDisabled = event.target.checked;
                this.filterByDisabledStatus(showDisabled);
            });
        }

        this.logger.debug('Footer event listeners set up', { id: this.id });
    }

    // Navigation methods
    navigateUp() { /* Implement */ }
    navigateDown() { /* Implement */ }
    navigateLeft() { /* Implement */ }
    navigateRight() { /* Implement */ }
    toggleRowSelection() { /* Implement */ }
    deleteSelectedRows() { /* Implement */ }
    saveChanges() { /* Implement */ }
    initializeDragAndDrop() { /* Implement */ }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataGridControl;
} else if (typeof window !== 'undefined') {
    window.DataGridControl = DataGridControl;
}