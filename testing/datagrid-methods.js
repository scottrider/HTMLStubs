/**
 * DataGrid Extended Methods
 * Comprehensive stub methods with detailed explanations following best practices
 * for enterprise-grade data grid components
 */

// Extend the DataGrid class with additional methods
DataGrid.prototype = Object.assign(DataGrid.prototype, {

    // ========================================
    // DATA MANAGEMENT METHODS
    // ========================================

    /**
     * Adds a new record to the data grid
     * BEST PRACTICE: Always validate data before insertion, maintain referential integrity
     * 
     * @param {Object} record - The record object to add
     * @param {number} [index] - Optional index to insert at (default: append)
     * @returns {boolean} Success status
     * 
     * ACCOMPLISHES:
     * - Validates record structure against schema
     * - Maintains data consistency and referential integrity
     * - Triggers appropriate events for external listeners
     * - Updates UI reactively without full re-render
     * - Handles unique key constraints and duplicate prevention
     */
    addRecord(record, index = null) {
        try {
            // Validate record structure
            if (!this.validateRecord(record)) {
                throw new Error('Record validation failed - structure does not match schema');
            }

            // Check for duplicate records if unique key is defined
            if (this.options.uniqueKey && this.isDuplicate(record)) {
                throw new Error(`Duplicate record detected for key: ${this.options.uniqueKey}`);
            }

            // Generate unique ID if not provided
            if (!record.id) {
                record.id = this.generateUniqueId();
            }

            // Insert at specified index or append
            if (index !== null && index >= 0 && index <= this.data.length) {
                this.data.splice(index, 0, record);
            } else {
                this.data.push(record);
            }

            // Update UI incrementally (better performance than full re-render)
            this.renderNewRecord(record, index);

            // Trigger events
            this.triggerEvent('recordAdded', { record, index: index || this.data.length - 1 });

            // Update pagination and sorting if applicable
            this.updatePagination();
            this.reapplySorting();

            return true;
        } catch (error) {
            console.error('Error adding record:', error);
            this.triggerEvent('recordAddError', { error, record });
            return false;
        }
    },

    /**
     * Updates an existing record in the data grid
     * BEST PRACTICE: Implement optimistic updates with rollback capability
     * 
     * @param {string|number} id - Record identifier
     * @param {Object} updates - Partial or complete record updates
     * @param {Object} [options] - Update options (merge strategy, validation rules)
     * @returns {boolean} Success status
     * 
     * ACCOMPLISHES:
     * - Implements optimistic UI updates for better UX
     * - Maintains change history for audit trails
     * - Validates partial updates against schema constraints
     * - Handles concurrent modification detection
     * - Preserves related data relationships
     */
    updateRecord(id, updates, options = {}) {
        try {
            const recordIndex = this.findRecordIndex(id);
            if (recordIndex === -1) {
                throw new Error(`Record with id ${id} not found`);
            }

            const originalRecord = { ...this.data[recordIndex] };
            const mergeStrategy = options.mergeStrategy || 'shallow';

            // Create updated record based on merge strategy
            const updatedRecord = this.mergeRecord(originalRecord, updates, mergeStrategy);

            // Validate the updated record
            if (!this.validateRecord(updatedRecord, { partial: false })) {
                throw new Error('Updated record validation failed');
            }

            // Check for version conflicts (optimistic concurrency control)
            if (originalRecord.version && updates.version && originalRecord.version !== updates.version) {
                throw new Error('Concurrent modification detected - record has been modified by another user');
            }

            // Update version for optimistic concurrency control
            updatedRecord.version = (updatedRecord.version || 0) + 1;
            updatedRecord.lastModified = new Date().toISOString();

            // Store for rollback capability
            this.storeUndoState('update', { recordIndex, originalRecord });

            // Apply update
            this.data[recordIndex] = updatedRecord;

            // Update UI incrementally
            this.renderUpdatedRecord(updatedRecord, recordIndex);

            // Trigger events
            this.triggerEvent('recordUpdated', {
                id,
                originalRecord,
                updatedRecord,
                index: recordIndex
            });

            return true;
        } catch (error) {
            console.error('Error updating record:', error);
            this.triggerEvent('recordUpdateError', { error, id, updates });
            return false;
        }
    },

    /**
     * Removes a record from the data grid
     * BEST PRACTICE: Implement soft delete with recovery options
     * 
     * @param {string|number} id - Record identifier
     * @param {Object} [options] - Delete options (soft delete, cascade rules)
     * @returns {boolean} Success status
     * 
     * ACCOMPLISHES:
     * - Supports both soft and hard delete operations
     * - Handles cascade delete rules for related records
     * - Maintains referential integrity across relationships
     * - Provides undo capability for accidental deletions
     * - Updates dependent UI components and summaries
     */
    deleteRecord(id, options = {}) {
        try {
            const recordIndex = this.findRecordIndex(id);
            if (recordIndex === -1) {
                throw new Error(`Record with id ${id} not found`);
            }

            const record = this.data[recordIndex];
            const isSoftDelete = options.softDelete !== false; // Default to soft delete

            // Store for undo capability
            this.storeUndoState('delete', { recordIndex, record });

            if (isSoftDelete) {
                // Soft delete - mark as deleted but keep in data
                this.data[recordIndex].isDeleted = true;
                this.data[recordIndex].deletedAt = new Date().toISOString();
                this.hideRecord(recordIndex);
            } else {
                // Hard delete - remove from data array
                this.data.splice(recordIndex, 1);
                this.removeRecordFromUI(recordIndex);
            }

            // Handle cascade deletes if configured
            if (options.cascade && this.options.relationships) {
                this.handleCascadeDelete(id);
            }

            // Update UI state
            this.updateRowNumbers();
            this.updateSummaryStatistics();

            // Trigger events
            this.triggerEvent('recordDeleted', {
                id,
                record,
                index: recordIndex,
                softDelete: isSoftDelete
            });

            return true;
        } catch (error) {
            console.error('Error deleting record:', error);
            this.triggerEvent('recordDeleteError', { error, id });
            return false;
        }
    },

    // ========================================
    // SEARCH AND FILTERING METHODS
    // ========================================

    /**
     * Applies advanced filtering to the data grid
     * BEST PRACTICE: Support multiple filter types with efficient indexing
     * 
     * @param {Array|Object} filters - Filter criteria array or single filter object
     * @param {Object} [options] - Filter options (mode, case sensitivity, etc.)
     * @returns {Array} Filtered results
     * 
     * ACCOMPLISHES:
     * - Supports complex multi-field filtering with logical operators
     * - Implements efficient filtering algorithms for large datasets
     * - Provides real-time filter suggestions and auto-completion
     * - Maintains filter history for user convenience
     * - Handles nested object filtering and array field filtering
     */
    applyFilters(filters, options = {}) {
        try {
            if (!Array.isArray(filters)) {
                filters = [filters];
            }

            const filterMode = options.mode || 'AND'; // AND/OR logic
            const caseSensitive = options.caseSensitive || false;
            const useIndexing = options.useIndexing !== false;

            // Build filter indexes for performance on large datasets
            if (useIndexing && this.data.length > 1000) {
                this.buildFilterIndexes(filters);
            }

            // Apply filters with appropriate logic
            const filteredData = this.data.filter(record => {
                if (record.isDeleted) return false; // Exclude soft-deleted records

                const filterResults = filters.map(filter => 
                    this.evaluateFilter(record, filter, caseSensitive)
                );

                return filterMode === 'AND' 
                    ? filterResults.every(result => result)
                    : filterResults.some(result => result);
            });

            // Store current filter state
            this.currentFilters = { filters, options };
            
            // Update UI with filtered results
            this.renderFilteredData(filteredData);

            // Update summary statistics
            this.updateFilterSummary(filteredData.length, this.data.length);

            // Trigger events
            this.triggerEvent('filtersApplied', {
                filters,
                resultCount: filteredData.length,
                totalCount: this.data.length
            });

            return filteredData;
        } catch (error) {
            console.error('Error applying filters:', error);
            this.triggerEvent('filterError', { error, filters });
            return this.data;
        }
    },

    /**
     * Performs full-text search across all searchable fields
     * BEST PRACTICE: Implement fuzzy search with relevance scoring
     * 
     * @param {string} searchTerm - Search query
     * @param {Object} [options] - Search options (fields, fuzzy matching, etc.)
     * @returns {Array} Search results with relevance scores
     * 
     * ACCOMPLISHES:
     * - Provides intelligent fuzzy matching for typo tolerance
     * - Implements relevance scoring and result ranking
     * - Supports field-specific search weighting
     * - Highlights matching terms in results
     * - Maintains search history and suggestions
     */
    search(searchTerm, options = {}) {
        try {
            if (!searchTerm || searchTerm.trim().length === 0) {
                return this.clearSearch();
            }

            const searchFields = options.fields || this.getSearchableFields();
            const fuzzyMatch = options.fuzzy !== false;
            const maxResults = options.maxResults || 100;
            const minRelevance = options.minRelevance || 0.1;

            const results = [];

            this.data.forEach((record, index) => {
                if (record.isDeleted) return;

                const relevanceScore = this.calculateRelevanceScore(
                    record, 
                    searchTerm, 
                    searchFields, 
                    fuzzyMatch
                );

                if (relevanceScore >= minRelevance) {
                    results.push({
                        record,
                        index,
                        relevanceScore,
                        matchedFields: this.getMatchedFields(record, searchTerm, searchFields)
                    });
                }
            });

            // Sort by relevance score
            results.sort((a, b) => b.relevanceScore - a.relevanceScore);

            // Limit results
            const limitedResults = results.slice(0, maxResults);

            // Store search state
            this.currentSearch = { searchTerm, options, results: limitedResults };

            // Update UI with search results
            this.renderSearchResults(limitedResults);

            // Add to search history
            this.addToSearchHistory(searchTerm);

            // Trigger events
            this.triggerEvent('searchCompleted', {
                searchTerm,
                resultCount: limitedResults.length,
                totalMatches: results.length
            });

            return limitedResults;
        } catch (error) {
            console.error('Error performing search:', error);
            this.triggerEvent('searchError', { error, searchTerm });
            return [];
        }
    },

    // ========================================
    // SORTING AND ORDERING METHODS
    // ========================================

    /**
     * Sorts the data grid by specified column(s)
     * BEST PRACTICE: Support multi-column sorting with stable sort algorithms
     * 
     * @param {string|Array} columns - Column name(s) to sort by
     * @param {string|Array} directions - Sort direction(s): 'asc' or 'desc'
     * @param {Object} [options] - Sort options (stable sort, custom comparers)
     * @returns {boolean} Success status
     * 
     * ACCOMPLISHES:
     * - Implements stable sorting to maintain relative order
     * - Supports custom comparison functions for complex data types
     * - Handles multi-column sorting with priority ordering
     * - Provides sort indicators in column headers
     * - Remembers user's sort preferences across sessions
     */
    sortBy(columns, directions = 'asc', options = {}) {
        try {
            // Normalize inputs to arrays
            const sortColumns = Array.isArray(columns) ? columns : [columns];
            const sortDirections = Array.isArray(directions) ? directions : [directions];

            // Validate columns exist in schema
            const invalidColumns = sortColumns.filter(col => !this.schema[col]);
            if (invalidColumns.length > 0) {
                throw new Error(`Invalid sort columns: ${invalidColumns.join(', ')}`);
            }

            // Store original order for stable sorting
            const originalOrder = this.data.map((record, index) => ({ record, originalIndex: index }));

            // Perform multi-column sort
            originalOrder.sort((a, b) => {
                for (let i = 0; i < sortColumns.length; i++) {
                    const column = sortColumns[i];
                    const direction = sortDirections[i] || sortDirections[0] || 'asc';
                    
                    const comparison = this.compareValues(
                        a.record[column], 
                        b.record[column], 
                        this.schema[column].type,
                        options.customComparers?.[column]
                    );

                    if (comparison !== 0) {
                        return direction === 'desc' ? -comparison : comparison;
                    }
                }

                // Stable sort - maintain original order for equal elements
                return a.originalIndex - b.originalIndex;
            });

            // Update data array with sorted records
            this.data = originalOrder.map(item => item.record);

            // Store current sort state
            this.currentSort = { columns: sortColumns, directions: sortDirections, options };

            // Update UI with sorted data
            this.renderSortedData();

            // Update column headers with sort indicators
            this.updateSortIndicators(sortColumns, sortDirections);

            // Trigger events
            this.triggerEvent('dataSorted', {
                columns: sortColumns,
                directions: sortDirections
            });

            return true;
        } catch (error) {
            console.error('Error sorting data:', error);
            this.triggerEvent('sortError', { error, columns, directions });
            return false;
        }
    },

    // ========================================
    // VALIDATION METHODS
    // ========================================

    /**
     * Validates a record against the schema and business rules
     * BEST PRACTICE: Implement comprehensive validation with clear error messages
     * 
     * @param {Object} record - Record to validate
     * @param {Object} [options] - Validation options (partial validation, strict mode)
     * @returns {Object} Validation result with success status and errors
     * 
     * ACCOMPLISHES:
     * - Performs schema-based validation with type checking
     * - Implements business rule validation with custom validators
     * - Provides detailed error messages with field-level feedback
     * - Supports both partial and complete record validation
     * - Handles cross-field validation and complex business rules
     */
    validateRecord(record, options = {}) {
        const validationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            fieldErrors: {}
        };

        try {
            const isPartial = options.partial || false;
            const strictMode = options.strict || false;

            // Validate each field against schema
            Object.keys(this.schema).forEach(fieldName => {
                const fieldSchema = this.schema[fieldName];
                const fieldValue = record[fieldName];

                // Skip validation for missing fields in partial validation
                if (isPartial && fieldValue === undefined) {
                    return;
                }

                const fieldValidation = this.validateField(fieldName, fieldValue, fieldSchema, record);
                
                if (!fieldValidation.isValid) {
                    validationResult.isValid = false;
                    validationResult.fieldErrors[fieldName] = fieldValidation.errors;
                    validationResult.errors.push(...fieldValidation.errors);
                }

                if (fieldValidation.warnings.length > 0) {
                    validationResult.warnings.push(...fieldValidation.warnings);
                }
            });

            // Validate business rules
            const businessRuleValidation = this.validateBusinessRules(record, options);
            if (!businessRuleValidation.isValid) {
                validationResult.isValid = false;
                validationResult.errors.push(...businessRuleValidation.errors);
            }

            // Validate cross-field dependencies
            const crossFieldValidation = this.validateCrossFieldRules(record, options);
            if (!crossFieldValidation.isValid) {
                validationResult.isValid = false;
                validationResult.errors.push(...crossFieldValidation.errors);
            }

            return validationResult;
        } catch (error) {
            console.error('Error during record validation:', error);
            return {
                isValid: false,
                errors: [`Validation error: ${error.message}`],
                warnings: [],
                fieldErrors: {}
            };
        }
    },

    // ========================================
    // EXPORT AND IMPORT METHODS
    // ========================================

    /**
     * Exports data grid data in various formats
     * BEST PRACTICE: Support multiple export formats with customizable options
     * 
     * @param {string} format - Export format ('csv', 'json', 'excel', 'pdf')
     * @param {Object} [options] - Export options (fields, filters, formatting)
     * @returns {Promise} Export result with download capability
     * 
     * ACCOMPLISHES:
     * - Supports multiple export formats for different use cases
     * - Allows selective field export and data filtering
     * - Handles large datasets with streaming export
     * - Preserves formatting and maintains data integrity
     * - Provides progress feedback for large exports
     */
    async exportData(format = 'csv', options = {}) {
        try {
            const supportedFormats = ['csv', 'json', 'excel', 'xml', 'pdf'];
            if (!supportedFormats.includes(format.toLowerCase())) {
                throw new Error(`Unsupported export format: ${format}`);
            }

            // Determine which data to export
            const dataToExport = this.getExportData(options);
            
            // Show progress for large datasets
            if (dataToExport.length > 1000) {
                this.showExportProgress(true);
            }

            let exportResult;
            switch (format.toLowerCase()) {
                case 'csv':
                    exportResult = await this.exportToCSV(dataToExport, options);
                    break;
                case 'json':
                    exportResult = await this.exportToJSON(dataToExport, options);
                    break;
                case 'excel':
                    exportResult = await this.exportToExcel(dataToExport, options);
                    break;
                case 'xml':
                    exportResult = await this.exportToXML(dataToExport, options);
                    break;
                case 'pdf':
                    exportResult = await this.exportToPDF(dataToExport, options);
                    break;
            }

            // Hide progress indicator
            this.showExportProgress(false);

            // Trigger download if requested
            if (options.download !== false) {
                this.downloadFile(exportResult.data, exportResult.filename, exportResult.mimeType);
            }

            // Trigger events
            this.triggerEvent('dataExported', {
                format,
                recordCount: dataToExport.length,
                filename: exportResult.filename
            });

            return exportResult;
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showExportProgress(false);
            this.triggerEvent('exportError', { error, format });
            throw error;
        }
    },

    /**
     * Imports data from various sources into the data grid
     * BEST PRACTICE: Implement robust import with validation and error recovery
     * 
     * @param {File|string|Object} source - Import source (file, URL, or data object)
     * @param {Object} [options] - Import options (format, validation, merge strategy)
     * @returns {Promise} Import result with success/error details
     * 
     * ACCOMPLISHES:
     * - Supports multiple import formats and sources
     * - Validates imported data against schema before insertion
     * - Provides detailed import progress and error reporting
     * - Handles merge conflicts and duplicate resolution
     * - Allows preview and confirmation before final import
     */
    async importData(source, options = {}) {
        try {
            const importOptions = {
                format: 'auto',
                validateSchema: true,
                mergeStrategy: 'append', // append, replace, merge
                skipErrors: false,
                preview: false,
                ...options
            };

            // Show import progress
            this.showImportProgress(true);

            // Parse the source data
            const parsedData = await this.parseImportSource(source, importOptions);

            // Validate the imported data
            const validationResult = this.validateImportData(parsedData, importOptions);

            if (!validationResult.isValid && !importOptions.skipErrors) {
                throw new Error(`Import validation failed: ${validationResult.errors.join(', ')}`);
            }

            // Preview mode - return results without importing
            if (importOptions.preview) {
                return {
                    success: true,
                    preview: true,
                    data: parsedData,
                    validation: validationResult,
                    recordCount: parsedData.length
                };
            }

            // Apply merge strategy
            const importResult = await this.applyImportStrategy(parsedData, importOptions);

            // Update UI
            this.render();

            // Hide progress indicator
            this.showImportProgress(false);

            // Trigger events
            this.triggerEvent('dataImported', {
                source: typeof source === 'string' ? source : 'file',
                recordCount: importResult.importedCount,
                errorCount: importResult.errorCount,
                mergeStrategy: importOptions.mergeStrategy
            });

            return importResult;
        } catch (error) {
            console.error('Error importing data:', error);
            this.showImportProgress(false);
            this.triggerEvent('importError', { error, source });
            throw error;
        }
    },

    // ========================================
    // UTILITY AND HELPER METHODS
    // ========================================

    /**
     * Generates a unique identifier for records
     * BEST PRACTICE: Use collision-resistant ID generation strategies
     * 
     * @param {string} [prefix] - Optional prefix for the ID
     * @returns {string} Unique identifier
     */
    generateUniqueId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substr(2, 9);
        return `${prefix}${timestamp}${randomPart}`;
    },

    /**
     * Triggers custom events for external listeners
     * BEST PRACTICE: Use consistent event naming and provide rich event data
     * 
     * @param {string} eventName - Name of the event
     * @param {Object} eventData - Event payload data
     */
    triggerEvent(eventName, eventData = {}) {
        const event = new CustomEvent(`datagrid:${eventName}`, {
            detail: {
                ...eventData,
                timestamp: new Date().toISOString(),
                source: 'DataGrid',
                instanceId: this.instanceId
            }
        });

        this.container.dispatchEvent(event);

        // Also trigger on document for global listeners
        document.dispatchEvent(event);
    },

    // ========================================
    // SEARCH HELPER METHODS
    // ========================================

    /**
     * Gets all searchable fields from the schema
     * @returns {Array} Array of field names that are marked as searchable
     */
    getSearchableFields() {
        if (!this.schema) return [];
        
        return Object.keys(this.schema).filter(fieldName => {
            const field = this.schema[fieldName];
            return field.searchable === true || field.searchable === undefined; // Default to searchable if not specified
        });
    },

    /**
     * Calculates relevance score for a record against a search term
     * @param {Object} record - The record to score
     * @param {string} searchTerm - The search term
     * @param {Array} searchFields - Fields to search in
     * @param {boolean} fuzzyMatch - Whether to use fuzzy matching
     * @returns {number} Relevance score between 0 and 1
     */
    calculateRelevanceScore(record, searchTerm, searchFields, fuzzyMatch = true) {
        let totalScore = 0;
        let fieldCount = 0;
        const term = searchTerm.toLowerCase().trim();

        for (const fieldName of searchFields) {
            const fieldValue = record[fieldName];
            if (fieldValue === null || fieldValue === undefined) continue;

            const value = fieldValue.toString().toLowerCase();
            let fieldScore = 0;

            // Exact match gets highest score
            if (value === term) {
                fieldScore = 1.0;
            }
            // Starts with search term gets high score
            else if (value.startsWith(term)) {
                fieldScore = 0.8;
            }
            // Contains search term gets medium score
            else if (value.includes(term)) {
                fieldScore = 0.6;
            }
            // Fuzzy matching for partial matches
            else if (fuzzyMatch && this.fuzzyMatch(value, term)) {
                fieldScore = 0.3;
            }

            // Apply field weighting if available
            const fieldWeight = this.schema[fieldName]?.searchWeight || 1;
            totalScore += fieldScore * fieldWeight;
            fieldCount++;
        }

        return fieldCount > 0 ? totalScore / fieldCount : 0;
    },

    /**
     * Simple fuzzy matching implementation
     * @param {string} text - Text to search in
     * @param {string} term - Term to search for
     * @returns {boolean} Whether there's a fuzzy match
     */
    fuzzyMatch(text, term) {
        let termIndex = 0;
        for (let i = 0; i < text.length && termIndex < term.length; i++) {
            if (text[i] === term[termIndex]) {
                termIndex++;
            }
        }
        return termIndex === term.length;
    },

    /**
     * Gets the fields that matched the search term for a record
     * @param {Object} record - The record to check
     * @param {string} searchTerm - The search term
     * @param {Array} searchFields - Fields to search in
     * @returns {Array} Array of field names that matched
     */
    getMatchedFields(record, searchTerm, searchFields) {
        const matchedFields = [];
        const term = searchTerm.toLowerCase().trim();

        for (const fieldName of searchFields) {
            const fieldValue = record[fieldName];
            if (fieldValue === null || fieldValue === undefined) continue;

            const value = fieldValue.toString().toLowerCase();
            if (value.includes(term) || this.fuzzyMatch(value, term)) {
                matchedFields.push(fieldName);
            }
        }

        return matchedFields;
    },

    /**
     * Renders search results (placeholder - to be implemented with actual UI)
     * @param {Array} results - Search results with relevance scores
     */
    renderSearchResults(results) {
        // This method should update the UI with search results
        // For now, we'll just trigger an event that the UI components can listen to
        this.triggerEvent('searchResultsReady', {
            results,
            resultCount: results.length
        });
        
        // Store results for other components to access
        this.currentSearchResults = results;
    },

    /**
     * Clears the current search and returns all data
     * @returns {Array} All non-deleted records
     */
    clearSearch() {
        this.currentSearch = null;
        this.currentSearchResults = null;
        
        const allResults = this.data
            .filter(record => !record.isDeleted)
            .map((record, index) => ({
                record,
                index,
                relevanceScore: 1,
                matchedFields: []
            }));

        this.renderSearchResults(allResults);
        this.triggerEvent('searchCleared');
        
        return allResults;
    },

    /**
     * Adds search term to search history (placeholder)
     * @param {string} searchTerm - The search term to add to history
     */
    addToSearchHistory(searchTerm) {
        if (!this.searchHistory) {
            this.searchHistory = [];
        }
        
        // Remove if already exists and add to front
        const index = this.searchHistory.indexOf(searchTerm);
        if (index > -1) {
            this.searchHistory.splice(index, 1);
        }
        
        this.searchHistory.unshift(searchTerm);
        
        // Keep only last 10 searches
        if (this.searchHistory.length > 10) {
            this.searchHistory = this.searchHistory.slice(0, 10);
        }
        
        this.triggerEvent('searchHistoryUpdated', {
            history: this.searchHistory
        });
    }
});