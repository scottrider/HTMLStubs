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
        
        // Configuration options
        this.options = {
            debounceDelay: 300,
            minSearchLength: 0,
            placeholder: 'Search records...',
            onSearch: null, // Callback for search events
            onClear: null,  // Callback for clear events
            dataGrid: null, // DataGrid instance to search
            searchMethod: 'handleSearch', // Method name on DataGrid
            ...options
        };
        
        // Internal state
        this.searchTimeout = null;
        this.isSearching = false;
        this.lastSearchTerm = '';
        
        // Find elements
        this.input = this.element.querySelector('.DataGridSearch__input');
        this.clearButton = this.element.querySelector('.DataGridSearch__clear');
        this.container = this.element.querySelector('.DataGridSearch__container');
        
        if (!this.input) {
            throw new Error('DataGridSearch: Input element not found');
        }
        
        // Initialize
        this.init();
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
        // Input events
        this.input.addEventListener('input', this.handleInput.bind(this));
        this.input.addEventListener('keydown', this.handleKeydown.bind(this));
        this.input.addEventListener('focus', this.handleFocus.bind(this));
        this.input.addEventListener('blur', this.handleBlur.bind(this));
        
        // Clear button events
        if (this.clearButton) {
            this.clearButton.addEventListener('click', this.handleClear.bind(this));
        }
        
        // Form submission prevention
        const form = this.input.closest('form');
        if (form) {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
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
        
        // Remove event listeners
        this.input.removeEventListener('input', this.handleInput.bind(this));
        this.input.removeEventListener('keydown', this.handleKeydown.bind(this));
        this.input.removeEventListener('focus', this.handleFocus.bind(this));
        this.input.removeEventListener('blur', this.handleBlur.bind(this));
        
        if (this.clearButton) {
            this.clearButton.removeEventListener('click', this.handleClear.bind(this));
        }
        
        // Clean up references
        this.element = null;
        this.input = null;
        this.clearButton = null;
        this.container = null;
        this.options = null;
        
        console.log('DataGridSearch: Destroyed');
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
}