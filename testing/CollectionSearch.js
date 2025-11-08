/**
 * CollectionSearch - Master Level Web Standard Component
 * 
 * JavaScript functionality for CollectionSearch component.
 * General-purpose search for collections with alert-based results.
 * 
 * Features:
 * - Real-time search with debouncing
 * - Alert-based result display
 * - Customizable search logic via callbacks
 * - Clear button management
 * - Event handling and cleanup
 * - Search state management
 * - Accessibility support
 * 
 * @version 1.0.0
 * @author FormMock Development Team
 * @license MIT
 */

class CollectionSearch {
    constructor(element, options = {}) {
        // Validate element
        if (!element) {
            throw new Error('CollectionSearch: Element is required');
        }
        
        this.element = typeof element === 'string' ? document.querySelector(element) : element;
        if (!this.element) {
            throw new Error('CollectionSearch: Element not found');
        }
        
        // Configuration options
        this.options = {
            debounceDelay: 300,
            minSearchLength: 1,
            placeholder: 'Search collection...',
            collection: [], // Array of items to search
            searchFields: [], // Fields to search in (for objects)
            caseSensitive: false,
            exactMatch: false,
            onSearch: null, // Custom search function
            onResult: null, // Custom result handler
            onClear: null,  // Callback for clear events
            showCount: true,
            showNoResults: true,
            showSearching: true,
            ...options
        };
        
        // Internal state
        this.searchTimeout = null;
        this.isSearching = false;
        this.lastSearchTerm = '';
        this.lastResults = [];
        
        // Find elements
        this.input = this.element.querySelector('.CollectionSearch__input');
        this.clearButton = this.element.querySelector('.CollectionSearch__clear');
        this.container = this.element.querySelector('.CollectionSearch__container');
        this.results = this.element.querySelector('.CollectionSearch__results');
        this.loading = this.element.querySelector('.CollectionSearch__loading');
        
        if (!this.input) {
            throw new Error('CollectionSearch: Input element not found');
        }
        
        if (!this.results) {
            throw new Error('CollectionSearch: Results element not found');
        }
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set up input attributes
        if (this.options.placeholder) {
            this.input.setAttribute('placeholder', this.options.placeholder);
        }
        
        // Create loading element if it doesn't exist
        if (!this.loading) {
            this.loading = this.createLoadingElement();
            this.results.parentNode.insertBefore(this.loading, this.results);
        }
        
        // Bind event listeners
        this.bindEvents();
        
        // Set initial state
        this.updateClearButtonVisibility();
        
        // Add ARIA attributes
        this.setupAccessibility();
        
        console.log('CollectionSearch: Initialized successfully');
    }
    
    createLoadingElement() {
        const loading = document.createElement('div');
        loading.className = 'CollectionSearch__loading';
        loading.innerHTML = `
            <div class="CollectionSearch__loading-spinner"></div>
            <span>Searching...</span>
        `;
        return loading;
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
        this.input.setAttribute('aria-label', 'Search collection');
        this.input.setAttribute('role', 'searchbox');
        this.input.setAttribute('aria-describedby', this.results.id || 'search-results');
        
        if (this.clearButton) {
            this.clearButton.setAttribute('aria-label', 'Clear search');
            this.clearButton.setAttribute('tabindex', '0');
        }
        
        // Set up results area for screen readers
        this.results.setAttribute('role', 'status');
        this.results.setAttribute('aria-live', 'polite');
        this.results.setAttribute('aria-label', 'Search results');
    }
    
    handleInput(event) {
        const searchTerm = event.target.value;
        
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
        this.element.classList.add('CollectionSearch--focused');
    }
    
    handleBlur(event) {
        this.element.classList.remove('CollectionSearch--focused');
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
            this.displayAlert('info', 'Search Query Too Short', 
                `Please enter at least ${this.options.minSearchLength} characters.`);
            return;
        }
        
        // Skip if same as last search
        if (searchTerm === this.lastSearchTerm) {
            return;
        }
        
        this.lastSearchTerm = searchTerm;
        this.setSearchingState(true);
        
        console.log(`CollectionSearch: Searching for "${searchTerm}"`);
        
        try {
            let results;
            
            // Use custom search function if provided
            if (this.options.onSearch && typeof this.options.onSearch === 'function') {
                results = this.options.onSearch(searchTerm, this.options.collection, this);
            } else {
                // Default search logic
                results = this.defaultSearch(searchTerm);
            }
            
            // Handle async results
            if (results && typeof results.then === 'function') {
                results.then(data => {
                    this.handleResults(searchTerm, data);
                }).catch(error => {
                    console.error('CollectionSearch: Async search error:', error);
                    this.displayAlert('error', 'Search Error', 'An error occurred while searching.');
                }).finally(() => {
                    this.setSearchingState(false);
                });
            } else {
                this.handleResults(searchTerm, results);
                this.setSearchingState(false);
            }
            
        } catch (error) {
            console.error('CollectionSearch: Search error:', error);
            this.displayAlert('error', 'Search Error', 'An error occurred while searching.');
            this.setSearchingState(false);
        }
    }
    
    defaultSearch(searchTerm) {
        if (!searchTerm) {
            return [];
        }
        
        const collection = this.options.collection || [];
        const searchFields = this.options.searchFields || [];
        const caseSensitive = this.options.caseSensitive;
        const exactMatch = this.options.exactMatch;
        
        const normalizedTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase();
        
        return collection.filter(item => {
            // Handle string items
            if (typeof item === 'string') {
                const normalizedItem = caseSensitive ? item : item.toLowerCase();
                return exactMatch ? 
                    normalizedItem === normalizedTerm : 
                    normalizedItem.includes(normalizedTerm);
            }
            
            // Handle object items
            if (typeof item === 'object' && item !== null) {
                // If no search fields specified, search all string properties
                const fieldsToSearch = searchFields.length > 0 ? 
                    searchFields : 
                    Object.keys(item).filter(key => typeof item[key] === 'string');
                
                return fieldsToSearch.some(field => {
                    const value = item[field];
                    if (typeof value === 'string') {
                        const normalizedValue = caseSensitive ? value : value.toLowerCase();
                        return exactMatch ?
                            normalizedValue === normalizedTerm :
                            normalizedValue.includes(normalizedTerm);
                    }
                    return false;
                });
            }
            
            return false;
        });
    }
    
    handleResults(searchTerm, results) {
        this.lastResults = results || [];
        
        // Call custom result handler
        if (this.options.onResult && typeof this.options.onResult === 'function') {
            this.options.onResult(searchTerm, this.lastResults, this);
        } else {
            this.displayResults(searchTerm, this.lastResults);
        }
        
        // Dispatch custom event
        const searchEvent = new CustomEvent('collection-search', {
            detail: { searchTerm, results: this.lastResults, instance: this },
            bubbles: true
        });
        this.element.dispatchEvent(searchEvent);
    }
    
    displayResults(searchTerm, results) {
        if (!searchTerm) {
            this.clearResults();
            return;
        }
        
        if (results.length === 0) {
            if (this.options.showNoResults) {
                this.displayAlert('warning', 'No Results Found', 
                    `No items found matching "${searchTerm}".`);
            }
        } else {
            const count = results.length;
            const title = count === 1 ? '1 Result Found' : `${count} Results Found`;
            const message = this.options.showCount ? 
                `Found ${count} item${count === 1 ? '' : 's'} matching "${searchTerm}".` :
                `Items found matching "${searchTerm}".`;
            
            this.displayAlert('success', title, message);
        }
    }
    
    displayAlert(type, title, message) {
        const alertHTML = `
            <div class="CollectionSearch__alert CollectionSearch__alert--${type}">
                <div class="CollectionSearch__alert-title">${this.escapeHTML(title)}</div>
                <div class="CollectionSearch__alert-message">${this.escapeHTML(message)}</div>
            </div>
        `;
        
        this.results.innerHTML = alertHTML;
    }
    
    clearResults() {
        this.results.innerHTML = '';
    }
    
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    clear() {
        this.input.value = '';
        this.updateClearButtonVisibility();
        this.lastSearchTerm = '';
        this.lastResults = [];
        this.clearResults();
        
        // Call clear callback
        if (this.options.onClear && typeof this.options.onClear === 'function') {
            this.options.onClear(this);
        }
        
        // Dispatch clear event
        const clearEvent = new CustomEvent('collection-search-clear', {
            detail: { instance: this },
            bubbles: true
        });
        this.element.dispatchEvent(clearEvent);
        
        console.log('CollectionSearch: Search cleared');
    }
    
    setSearchingState(isSearching) {
        this.isSearching = isSearching;
        this.element.classList.toggle('CollectionSearch--searching', isSearching);
        
        if (isSearching) {
            this.input.setAttribute('aria-busy', 'true');
            if (this.options.showSearching) {
                this.clearResults();
            }
        } else {
            this.input.removeAttribute('aria-busy');
        }
    }
    
    // Public API methods
    getSearchTerm() {
        return this.input.value.trim();
    }
    
    setSearchTerm(term) {
        this.input.value = term || '';
        this.updateClearButtonVisibility();
        this.lastSearchTerm = term || '';
        if (term) {
            this.performSearchImmediate();
        } else {
            this.clearResults();
        }
    }
    
    getResults() {
        return this.lastResults;
    }
    
    setCollection(collection, searchFields = null) {
        this.options.collection = collection || [];
        if (searchFields) {
            this.options.searchFields = searchFields;
        }
        
        // Re-run search if there's a current term
        if (this.lastSearchTerm) {
            this.performSearchImmediate();
        }
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
        this.element.classList.add('CollectionSearch--disabled');
    }
    
    enable() {
        this.input.disabled = false;
        if (this.clearButton) {
            this.clearButton.disabled = false;
        }
        this.element.classList.remove('CollectionSearch--disabled');
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
        this.results = null;
        this.loading = null;
        this.options = null;
        this.lastResults = null;
        
        console.log('CollectionSearch: Destroyed');
    }
    
    // Static methods
    static initAll(selector = '.CollectionSearch', options = {}) {
        const elements = document.querySelectorAll(selector);
        const instances = [];
        
        elements.forEach(element => {
            try {
                const instance = new CollectionSearch(element, options);
                instances.push(instance);
            } catch (error) {
                console.error('CollectionSearch: Failed to initialize element:', element, error);
            }
        });
        
        console.log(`CollectionSearch: Initialized ${instances.length} instances`);
        return instances;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollectionSearch;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.CollectionSearch = CollectionSearch;
}