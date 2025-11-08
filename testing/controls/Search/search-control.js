/**
 * SearchControl - Reusable search component with filtering capabilities
 * Extends BaseControl for consistent architecture
 */
class SearchControl extends BaseControl {
    constructor(options = {}) {
        super({
            type: 'SearchControl',
            ...options
        });

        // Search-specific options
        this.options = {
            placeholder: 'Search...',
            width: '300px',
            debounceMs: 300,
            clearButtonVisible: true,
            caseSensitive: false,
            showResultCount: false,
            autoFocus: false,
            ...options
        };

        // Search state
        this.searchTerm = '';
        this.isSearching = false;
        this.searchResults = [];
        this.totalResults = 0;

        // Event handlers
        this.onSearchCallback = null;
        this.onClearCallback = null;
        this.debounceTimeout = null;
    }

    /**
     * Initialize the search control
     */
    init() {
        super.init();
        
        this.logger.debug('Initializing SearchControl', {
            id: this.id,
            options: this.options
        });

        return this;
    }

    /**
     * Render the search control
     */
    render() {
        if (!this.isInitialized) {
            this.logger.warn('Attempting to render uninitialized SearchControl', { id: this.id });
            return this;
        }

        super.render();

        const searchHtml = `
            <div class="search-control" id="${this.id}" role="search" aria-label="Search control">
                <div class="search-input-container" style="position: relative; display: flex; align-items: center;">
                    <input 
                        type="text" 
                        id="searchInput_${this.id}" 
                        class="search-input"
                        placeholder="${this.options.placeholder}" 
                        value="${this.searchTerm}" 
                        style="
                            padding: 8px 30px 8px 12px; 
                            border: 1px solid #ccc; 
                            border-radius: 4px; 
                            font-size: 14px; 
                            width: ${this.options.width}; 
                            outline: none;
                            box-sizing: border-box;
                        "
                        aria-label="Search input"
                        ${this.options.autoFocus ? 'autofocus' : ''}
                    >
                    <button 
                        id="clearSearch_${this.id}" 
                        class="search-clear-button"
                        style="
                            position: absolute; 
                            right: 8px; 
                            padding: 4px 6px; 
                            border: none; 
                            border-radius: 2px; 
                            background: transparent; 
                            cursor: pointer; 
                            font-size: 16px; 
                            color: #666; 
                            display: ${this.searchTerm ? 'block' : 'none'};
                        " 
                        title="Clear search"
                        aria-label="Clear search"
                    >✕</button>
                </div>
                ${this.options.showResultCount ? `
                    <div class="search-results-count" style="
                        font-size: 12px; 
                        color: #666; 
                        margin-top: 4px;
                        display: ${this.searchTerm ? 'block' : 'none'};
                    ">
                        <span id="resultCount_${this.id}">
                            ${this.totalResults} result${this.totalResults !== 1 ? 's' : ''} found
                        </span>
                    </div>
                ` : ''}
            </div>
        `;

        this.container.innerHTML = searchHtml;
        this.setupEventListeners();

        this.logger.debug('SearchControl rendered', { 
            id: this.id,
            searchTerm: this.searchTerm 
        });

        return this;
    }

    /**
     * Set up event listeners for search functionality
     */
    setupEventListeners() {
        const searchInput = this.container.querySelector(`#searchInput_${this.id}`);
        const clearButton = this.container.querySelector(`#clearSearch_${this.id}`);

        if (searchInput) {
            // Search input with debouncing
            searchInput.addEventListener('input', (event) => {
                clearTimeout(this.debounceTimeout);
                
                this.debounceTimeout = setTimeout(() => {
                    const searchTerm = event.target.value;
                    this.performSearch(searchTerm);
                }, this.options.debounceMs);
            });

            // Handle Enter key
            searchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    clearTimeout(this.debounceTimeout);
                    const searchTerm = event.target.value;
                    this.performSearch(searchTerm);
                }
            });
        }

        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        this.logger.debug('SearchControl event listeners set up', { id: this.id });
    }

    /**
     * Perform search operation
     */
    performSearch(searchTerm) {
        this.searchTerm = searchTerm;
        this.isSearching = true;

        this.logger.debug('Performing search', { 
            id: this.id, 
            searchTerm: searchTerm 
        });

        // Update UI state
        this.updateClearButtonVisibility();
        this.updateResultCount();

        // Trigger search event
        this.trigger('search', {
            searchTerm: searchTerm,
            isEmpty: !searchTerm || searchTerm.trim().length === 0
        });

        // Call external search callback if provided
        if (this.onSearchCallback && typeof this.onSearchCallback === 'function') {
            this.onSearchCallback(searchTerm);
        }

        this.isSearching = false;
    }

    /**
     * Clear search and reset
     */
    clearSearch() {
        this.logger.debug('Clearing search', { id: this.id });

        this.searchTerm = '';
        this.searchResults = [];
        this.totalResults = 0;

        // Clear input field
        const searchInput = this.container.querySelector(`#searchInput_${this.id}`);
        if (searchInput) {
            searchInput.value = '';
        }

        // Update UI
        this.updateClearButtonVisibility();
        this.updateResultCount();

        // Trigger clear event
        this.trigger('clear', {
            searchTerm: ''
        });

        // Call external clear callback if provided
        if (this.onClearCallback && typeof this.onClearCallback === 'function') {
            this.onClearCallback();
        }

        // Focus back to input
        if (searchInput) {
            searchInput.focus();
        }
    }

    /**
     * Update clear button visibility
     */
    updateClearButtonVisibility() {
        const clearButton = this.container.querySelector(`#clearSearch_${this.id}`);
        if (clearButton) {
            clearButton.style.display = this.searchTerm ? 'block' : 'none';
        }
    }

    /**
     * Update result count display
     */
    updateResultCount() {
        if (this.options.showResultCount) {
            const resultCount = this.container.querySelector(`#resultCount_${this.id}`);
            const countContainer = this.container.querySelector('.search-results-count');
            
            if (resultCount && countContainer) {
                resultCount.textContent = `${this.totalResults} result${this.totalResults !== 1 ? 's' : ''} found`;
                countContainer.style.display = this.searchTerm ? 'block' : 'none';
            }
        }
    }

    /**
     * Set search results and update count
     */
    setResults(results) {
        this.searchResults = results || [];
        this.totalResults = this.searchResults.length;
        this.updateResultCount();
        
        this.logger.debug('Search results updated', { 
            id: this.id, 
            resultCount: this.totalResults 
        });
    }

    /**
     * Set search callback function
     */
    onSearch(callback) {
        this.onSearchCallback = callback;
        return this;
    }

    /**
     * Set clear callback function
     */
    onClear(callback) {
        this.onClearCallback = callback;
        return this;
    }

    /**
     * Get current search term
     */
    getSearchTerm() {
        return this.searchTerm;
    }

    /**
     * Set search term programmatically
     */
    setSearchTerm(searchTerm) {
        this.searchTerm = searchTerm || '';
        
        // Update input field
        const searchInput = this.container.querySelector(`#searchInput_${this.id}`);
        if (searchInput) {
            searchInput.value = this.searchTerm;
        }
        
        this.updateClearButtonVisibility();
        this.performSearch(this.searchTerm);
        
        return this;
    }

    /**
     * Focus the search input
     */
    focus() {
        const searchInput = this.container.querySelector(`#searchInput_${this.id}`);
        if (searchInput) {
            searchInput.focus();
        }
        return this;
    }

    /**
     * Enable/disable the search control
     */
    setEnabled(enabled) {
        const searchInput = this.container.querySelector(`#searchInput_${this.id}`);
        const clearButton = this.container.querySelector(`#clearSearch_${this.id}`);
        
        if (searchInput) {
            searchInput.disabled = !enabled;
        }
        if (clearButton) {
            clearButton.disabled = !enabled;
        }
        
        return this;
    }

    /**
     * Destroy the search control
     */
    destroy() {
        clearTimeout(this.debounceTimeout);
        this.onSearchCallback = null;
        this.onClearCallback = null;
        
        super.destroy();
        
        this.logger.debug('SearchControl destroyed', { id: this.id });
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchControl;
}