/**
 * DataGrid Components - Universal DataGrid, DataGridSearch, and DataGridPaginator
 * Consolidated DataGrid components for the JobSearch Management System
 */

/**
 * Apply dimensions to DataGrid CSS custom properties
 */
function applyDataGridDimensions(schema) {
    const dataGridElement = document.querySelector('.DataGrid');
    
    if (!dataGridElement) {
        console.warn('DataGrid element not found for CSS dimension application');
        return;
    }
    
    // Map field names to CSS custom property prefixes
    const fieldToCSSMap = {
        'id': '--id',
        'title': '--title',
        'position': '--position',
        'companyId': '--company', 
        'email': '--email',
        'cphone': '--cphone',
        'ophone': '--ophone', 
        'icontact': '--icontact',
        'lcontact': '--lcontact'
    };
    
    // Apply dimensions from schema to CSS custom properties
    Object.entries(schema).forEach(([fieldName, fieldConfig]) => {
        const cssPrefix = fieldToCSSMap[fieldName];
        if (cssPrefix && fieldConfig.css) {
            // Apply width if defined
            if (fieldConfig.css.width) {
                dataGridElement.style.setProperty(
                    `${cssPrefix}-width`, 
                    fieldConfig.css.width
                );
            }
            
            // Apply min-width if defined
            if (fieldConfig.css.minWidth) {
                dataGridElement.style.setProperty(
                    `${cssPrefix}-min-width`, 
                    fieldConfig.css.minWidth
                );
            }
            
            // Apply max-width if defined
            if (fieldConfig.css.maxWidth) {
                dataGridElement.style.setProperty(
                    `${cssPrefix}-max-width`, 
                    fieldConfig.css.maxWidth
                );
            }
        }
    });
    
    console.log('DataGrid CSS dimensions applied from schema');
}

/**
 * DataGridSearch - Master Level Web Standard Component
 * 
 * JavaScript functionality for DataGridSearch component.
 * Integrates with DataGrid components for real-time search functionality.
 * 
 * Features:
 * - Real-time search with debouncing
 * - DataGrid integration via callbacks
 * - Clear button management
 * - Event handling and cleanup
 * - Search state management
 * - Accessibility support
 * 
 * @version 1.0.0
 * @author FormMock Development Team
 * @license MIT
 */

class DataGridSearch {
    constructor(element, options = {}) {
        // Validate element
        if (!element) {
            throw new Error('DataGridSearch: Element is required');
        }
        
        this.element = typeof element === 'string' ? document.querySelector(element) : element;
        if (!this.element) {
            throw new Error('DataGridSearch: Element not found');
        }
        
        // Configuration options with validation
        this.options = {
            debounceDelay: Math.max(100, Math.min(1000, options.debounceDelay || 300)),
            minSearchLength: Math.max(0, options.minSearchLength || 0),
            placeholder: options.placeholder || 'Search records...',
            onSearch: typeof options.onSearch === 'function' ? options.onSearch : null,
            onClear: typeof options.onClear === 'function' ? options.onClear : null,
            dataGrid: options.dataGrid || null,
            searchMethod: options.searchMethod || 'handleSearch'
        };
        
        // Get logger reference
        this.logger = window.DataGridNamespace?.logger || {
            debug: () => {}, info: console.info, warn: console.warn, error: console.error
        };
        
        // Internal state
        this.searchTimeout = null;
        this.isSearching = false;
        this.lastSearchTerm = '';
        
        // Bind event handlers once to prevent memory leaks
        this.boundHandleInput = this.handleInput.bind(this);
        this.boundHandleKeydown = this.handleKeydown.bind(this);
        this.boundHandleFocus = this.handleFocus.bind(this);
        this.boundHandleBlur = this.handleBlur.bind(this);
        this.boundHandleClear = this.handleClear.bind(this);
        
        // Find elements
        this.input = this.element.querySelector('.DataGridSearch__input');
        this.clearButton = this.element.querySelector('.DataGridSearch__clear');
        this.container = this.element.querySelector('.DataGridSearch__container');
        
        if (!this.input) {
            this.logger.warn('Input element not found, creating default structure');
            this.createDefaultStructure();
            // Re-query after creating structure
            this.input = this.element.querySelector('.DataGridSearch__input');
            this.clearButton = this.element.querySelector('.DataGridSearch__clear');
            this.container = this.element.querySelector('.DataGridSearch__container');
            
            if (!this.input) {
                throw new Error('DataGridSearch: Unable to create or find input element');
            }
        }
        
        // Initialize
        this.init();
    }
    
    createDefaultStructure() {
        // Create default DataGridSearch structure if missing
        const defaultHTML = `
            <div class="DataGridSearch">
                <label class="DataGridSearch__label">Search:</label>
                <div class="DataGridSearch__container">
                    <input type="text" class="DataGridSearch__input" placeholder="Search records..." />
                    <button type="button" class="DataGridSearch__clear" aria-label="Clear search">×</button>
                </div>
            </div>
        `;
        
        // If element is empty or doesn't have the right structure, replace it
        if (!this.element.innerHTML.trim() || !this.element.querySelector('.DataGridSearch__input')) {
            this.element.innerHTML = defaultHTML;
        }
    }
    
    init() {
        // Set up input attributes
        if (this.options.placeholder) {
            this.input.setAttribute('placeholder', this.options.placeholder);
        }
        
        // Bind event listeners
        this.bindEvents();
        
        // Set initial state
        this.updateClearButtonVisibility();
        
        // Add ARIA attributes
        this.setupAccessibility();
        
        console.log('DataGridSearch: Initialized successfully');
    }
    
    bindEvents() {
        // Input events using bound references
        this.input.addEventListener('input', this.boundHandleInput);
        this.input.addEventListener('keydown', this.boundHandleKeydown);
        this.input.addEventListener('focus', this.boundHandleFocus);
        this.input.addEventListener('blur', this.boundHandleBlur);
        
        // Clear button events
        if (this.clearButton) {
            this.clearButton.addEventListener('click', this.boundHandleClear);
        }
        
        // Form submission prevention
        const form = this.input.closest('form');
        if (form) {
            this.boundHandleFormSubmit = this.handleFormSubmit.bind(this);
            form.addEventListener('submit', this.boundHandleFormSubmit);
            this.form = form; // Store reference for cleanup
        }
    }
    
    setupAccessibility() {
        // Add ARIA attributes
        this.input.setAttribute('aria-label', 'Search records');
        this.input.setAttribute('role', 'searchbox');
        
        if (this.clearButton) {
            this.clearButton.setAttribute('aria-label', 'Clear search');
            this.clearButton.setAttribute('tabindex', '0');
        }
    }
    
    handleInput(event) {
        const searchTerm = event.target.value.trim();
        
        // Update clear button visibility
        this.updateClearButtonVisibility();
        
        // Clear existing timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Set up debounced search
        this.searchTimeout = setTimeout(() => {
            this.performSearch(searchTerm);
        }, this.options.debounceDelay);
    }
    
    handleKeydown(event) {
        // Handle Enter key
        if (event.key === 'Enter') {
            event.preventDefault();
            this.performSearchImmediate();
        }
        
        // Handle Escape key
        if (event.key === 'Escape') {
            this.clear();
            this.input.blur();
        }
    }
    
    handleFocus(event) {
        this.element.classList.add('DataGridSearch--focused');
    }
    
    handleBlur(event) {
        this.element.classList.remove('DataGridSearch--focused');
    }
    
    handleClear(event) {
        event.preventDefault();
        this.clear();
        this.input.focus();
    }
    
    handleFormSubmit(event) {
        event.preventDefault();
        this.performSearchImmediate();
    }
    
    updateClearButtonVisibility() {
        const hasContent = this.input.value.trim() !== '';
        
        if (this.container) {
            this.container.classList.toggle('has-content', hasContent);
        }
        
        if (this.clearButton) {
            this.clearButton.style.display = hasContent ? 'flex' : 'none';
        }
    }
    
    performSearchImmediate() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        const searchTerm = this.input.value.trim();
        this.performSearch(searchTerm);
    }
    
    performSearch(searchTerm) {
        // Skip if search term is too short
        if (searchTerm.length > 0 && searchTerm.length < this.options.minSearchLength) {
            return;
        }
        
        // Skip if same as last search
        if (searchTerm === this.lastSearchTerm) {
            return;
        }
        
        this.lastSearchTerm = searchTerm;
        this.setSearchingState(true);
        
        console.log(`DataGridSearch: Searching for "${searchTerm}"`);
        
        try {
            // Call DataGrid search method if configured
            if (this.options.dataGrid && this.options.searchMethod) {
                if (typeof this.options.dataGrid[this.options.searchMethod] === 'function') {
                    this.options.dataGrid[this.options.searchMethod](searchTerm);
                }
            }
            
            // Call custom search callback
            if (this.options.onSearch && typeof this.options.onSearch === 'function') {
                this.options.onSearch(searchTerm, this);
            }
            
            // Dispatch custom event
            const searchEvent = new CustomEvent('datagrid-search', {
                detail: { searchTerm, instance: this },
                bubbles: true
            });
            this.element.dispatchEvent(searchEvent);
            
        } catch (error) {
            console.error('DataGridSearch: Search error:', error);
            this.setErrorState(true);
        } finally {
            this.setSearchingState(false);
        }
    }
    
    clear() {
        this.input.value = '';
        this.updateClearButtonVisibility();
        this.lastSearchTerm = '';
        
        // Call clear callback
        if (this.options.onClear && typeof this.options.onClear === 'function') {
            this.options.onClear(this);
        }
        
        // Perform empty search to reset results
        this.performSearch('');
        
        // Dispatch clear event
        const clearEvent = new CustomEvent('datagrid-search-clear', {
            detail: { instance: this },
            bubbles: true
        });
        this.element.dispatchEvent(clearEvent);
        
        console.log('DataGridSearch: Search cleared');
    }
    
    setSearchingState(isSearching) {
        this.isSearching = isSearching;
        this.element.classList.toggle('DataGridSearch--searching', isSearching);
        
        if (isSearching) {
            this.input.setAttribute('aria-busy', 'true');
        } else {
            this.input.removeAttribute('aria-busy');
        }
    }
    
    setErrorState(hasError) {
        this.element.classList.toggle('DataGridSearch--error', hasError);
    }
    
    setNoResultsState(hasNoResults) {
        this.element.classList.toggle('DataGridSearch--no-results', hasNoResults);
    }
    
    // Public API methods
    getSearchTerm() {
        return this.input.value.trim();
    }
    
    setSearchTerm(term) {
        this.input.value = term || '';
        this.updateClearButtonVisibility();
        this.lastSearchTerm = term || '';
    }
    
    focus() {
        this.input.focus();
    }
    
    blur() {
        this.input.blur();
    }
    
    disable() {
        this.input.disabled = true;
        if (this.clearButton) {
            this.clearButton.disabled = true;
        }
        this.element.classList.add('DataGridSearch--disabled');
    }
    
    enable() {
        this.input.disabled = false;
        if (this.clearButton) {
            this.clearButton.disabled = false;
        }
        this.element.classList.remove('DataGridSearch--disabled');
    }
    
    destroy() {
        // Clear timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Remove event listeners safely using stored references
        if (this.input) {
            this.input.removeEventListener('input', this.boundHandleInput);
            this.input.removeEventListener('keydown', this.boundHandleKeydown);
            this.input.removeEventListener('focus', this.boundHandleFocus);
            this.input.removeEventListener('blur', this.boundHandleBlur);
        }
        
        if (this.clearButton) {
            this.clearButton.removeEventListener('click', this.boundHandleClear);
        }
        
        if (this.form && this.boundHandleFormSubmit) {
            this.form.removeEventListener('submit', this.boundHandleFormSubmit);
        }
        
        // Clean up references
        this.element = null;
        this.input = null;
        this.clearButton = null;
        this.container = null;
        this.options = null;
        
        window.DataGridNamespace?.logger.debug('DataGridSearch destroyed');
    }
    
    // Static methods
    static initAll(selector = '.DataGridSearch', options = {}) {
        const elements = document.querySelectorAll(selector);
        const instances = [];
        
        elements.forEach(element => {
            try {
                const instance = new DataGridSearch(element, options);
                instances.push(instance);
            } catch (error) {
                console.error('DataGridSearch: Failed to initialize element:', element, error);
            }
        });
        
        console.log(`DataGridSearch: Initialized ${instances.length} instances`);
        return instances;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataGridSearch;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.DataGridSearch = DataGridSearch;
    window.applyDataGridDimensions = applyDataGridDimensions;
}