// Import base DataGrid and types
import { DataGrid } from './datagrid.js';
class PositionsDataGrid extends DataGrid {
    constructor() {
        super();
        this._positionsData = [];
        this._showFilters = false;
        this._sortBy = 'position';
        this._sortDirection = 'asc';
        this._isInitialized = false;
        // Set default entity to positions
        this.entity = 'positions';
        // Handle page lifecycle events
        this.setupLifecycleEventHandlers();
    }
    // Setup event handlers for various lifecycle events
    setupLifecycleEventHandlers() {
        // Page reload/refresh detection
        window.addEventListener('beforeunload', (event) => {
            this.onBeforePageUnload(event);
        });
        // Page visibility changes (tab switching, minimize, etc.)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onPageHidden();
            }
            else {
                this.onPageVisible();
            }
        });
        // Browser back/forward navigation
        window.addEventListener('popstate', (event) => {
            this.onNavigationChange(event);
        });
        // Online/offline status changes
        window.addEventListener('online', () => {
            this.onConnectionRestored();
        });
        window.addEventListener('offline', () => {
            this.onConnectionLost();
        });
        // Focus events (when user clicks into/out of component)
        this.addEventListener('focus', () => {
            this.onComponentFocus();
        });
        this.addEventListener('blur', () => {
            this.onComponentBlur();
        });
    }
    // Custom lifecycle event handlers - you control what happens!
    onBeforePageUnload(event) {
        console.log('PositionsDataGrid: Page is about to reload/close');
        // Save current state before reload
        this.saveStateToLocalStorage();
        // Optional: Warn user if they have unsaved changes
        const hasUnsavedChanges = this.checkForUnsavedChanges();
        if (hasUnsavedChanges) {
            event.preventDefault();
            event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }
    onPageHidden() {
        console.log('PositionsDataGrid: Page became hidden (tab switch, minimize, etc.)');
        // Pause any ongoing operations
        this.pauseAutoRefresh();
        // Save current scroll position and filters
        this.saveViewState();
    }
    onPageVisible() {
        console.log('PositionsDataGrid: Page became visible again');
        // Resume operations
        this.resumeAutoRefresh();
        // Optionally refresh data
        this.refreshDataIfStale();
        // Restore view state
        this.restoreViewState();
    }
    onNavigationChange(event) {
        console.log('PositionsDataGrid: Browser navigation detected', event.state);
        // Handle browser back/forward
        if (event.state && event.state.positionsGridState) {
            this.restoreFromNavigationState(event.state.positionsGridState);
        }
    }
    onConnectionLost() {
        console.log('PositionsDataGrid: Internet connection lost');
        // Switch to offline mode
        this.showOfflineIndicator();
        // Cache current data locally
        this.cacheDataLocally();
    }
    onConnectionRestored() {
        console.log('PositionsDataGrid: Internet connection restored');
        // Hide offline indicator
        this.hideOfflineIndicator();
        // Sync any offline changes
        this.syncOfflineChanges();
    }
    onComponentFocus() {
        console.log('PositionsDataGrid: Component received focus');
        // Highlight the grid or show keyboard shortcuts
        this.addClass('focused');
    }
    onComponentBlur() {
        console.log('PositionsDataGrid: Component lost focus');
        // Remove focus styling
        this.removeClass('focused');
    }
    // State management methods
    saveStateToLocalStorage() {
        const state = {
            positionsData: this._positionsData,
            sortBy: this._sortBy,
            sortDirection: this._sortDirection,
            showFilters: this._showFilters,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem('positionsGridState', JSON.stringify(state));
            console.log('PositionsDataGrid: State saved to localStorage');
        }
        catch (error) {
            console.warn('PositionsDataGrid: Failed to save state', error);
        }
    }
    loadStateFromLocalStorage() {
        try {
            const savedState = localStorage.getItem('positionsGridState');
            if (savedState) {
                const state = JSON.parse(savedState);
                // Check if state is not too old (e.g., 24 hours)
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
                if (Date.now() - state.timestamp < maxAge) {
                    this._positionsData = state.positionsData || [];
                    this._sortBy = state.sortBy || 'position';
                    this._sortDirection = state.sortDirection || 'asc';
                    this._showFilters = state.showFilters || false;
                    console.log('PositionsDataGrid: State restored from localStorage');
                    return true;
                }
            }
        }
        catch (error) {
            console.warn('PositionsDataGrid: Failed to load state', error);
        }
        return false;
    }
    checkForUnsavedChanges() {
        // Implement your logic to detect unsaved changes
        // For example, compare current data with last saved data
        const lastSaved = localStorage.getItem('positionsGridLastSaved');
        const currentData = JSON.stringify(this._positionsData);
        return lastSaved !== currentData;
    }
    saveViewState() {
        const scrollTop = this.scrollTop;
        const activeFilters = this.getActiveFilters();
        sessionStorage.setItem('positionsGridViewState', JSON.stringify({
            scrollTop,
            activeFilters,
            timestamp: Date.now()
        }));
    }
    restoreViewState() {
        try {
            const viewState = sessionStorage.getItem('positionsGridViewState');
            if (viewState) {
                const state = JSON.parse(viewState);
                // Restore scroll position
                this.scrollTop = state.scrollTop || 0;
                // Restore filters
                if (state.activeFilters) {
                    this.applyFiltersFromState(state.activeFilters);
                }
            }
        }
        catch (error) {
            console.warn('PositionsDataGrid: Failed to restore view state', error);
        }
    }
    pauseAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = undefined;
        }
    }
    resumeAutoRefresh() {
        // Only resume if auto-refresh was enabled
        if (this.getAttribute('auto-refresh') === 'true') {
            const interval = parseInt(this.getAttribute('refresh-interval') || '30000');
            this.autoRefreshInterval = setInterval(() => {
                this.refreshDataIfStale();
            }, interval);
        }
    }
    refreshDataIfStale() {
        // Check if data needs refreshing based on your criteria
        console.log('PositionsDataGrid: Checking if data refresh is needed');
        // Example: refresh if data is older than 5 minutes
        const lastUpdate = this.getAttribute('last-update');
        if (lastUpdate) {
            const lastUpdateTime = parseInt(lastUpdate);
            const fiveMinutes = 5 * 60 * 1000;
            if (Date.now() - lastUpdateTime > fiveMinutes) {
                this.dispatchEvent(new CustomEvent('data-refresh-needed', {
                    detail: { reason: 'stale-data', lastUpdate: lastUpdateTime }
                }));
            }
        }
    }
    // Override connectedCallback to handle initial load
    connectedCallback() {
        console.log('PositionsDataGrid: Component connected to DOM');
        // Try to restore state first
        const stateRestored = this.loadStateFromLocalStorage();
        if (!stateRestored) {
            // If no saved state, call parent connectedCallback
            super.connectedCallback();
        }
        else {
            // If state was restored, update the display
            this.updateSourceData();
        }
        // Set up auto-refresh if enabled
        this.resumeAutoRefresh();
        this._isInitialized = true;
        // Dispatch custom event that component is ready
        this.dispatchEvent(new CustomEvent('positions-grid-ready', {
            detail: { restored: stateRestored }
        }));
    }
    // Override disconnectedCallback to clean up
    disconnectedCallback() {
        console.log('PositionsDataGrid: Component disconnected from DOM');
        // Save state before disconnect
        this.saveStateToLocalStorage();
        // Clean up auto-refresh
        this.pauseAutoRefresh();
        // Remove event listeners
        this.removeEventListeners();
    }
    removeEventListeners() {
        // Clean up any event listeners to prevent memory leaks
        // (The browser-level events will be cleaned up automatically,
        // but this is where you'd remove any custom listeners)
    }
    // Helper methods for the new functionality
    getActiveFilters() {
        // Return current filter state
        return {
            search: this.querySelector('.position-search')?.value || '',
            company: this.querySelector('.company-filter')?.value || '',
            location: this.querySelector('.location-filter')?.value || ''
        };
    }
    applyFiltersFromState(filters) {
        // Apply saved filters
        const searchInput = this.querySelector('.position-search');
        const companyFilter = this.querySelector('.company-filter');
        const locationFilter = this.querySelector('.location-filter');
        if (searchInput)
            searchInput.value = filters.search || '';
        if (companyFilter)
            companyFilter.value = filters.company || '';
        if (locationFilter)
            locationFilter.value = filters.location || '';
        this.applyFilters();
    }
    showOfflineIndicator() {
        // Add visual indicator that we're offline
        this.classList.add('offline-mode');
        const indicator = document.createElement('div');
        indicator.className = 'offline-indicator';
        indicator.textContent = 'Offline Mode - Changes will sync when connection is restored';
        this.prepend(indicator);
    }
    hideOfflineIndicator() {
        this.classList.remove('offline-mode');
        this.querySelector('.offline-indicator')?.remove();
    }
    cacheDataLocally() {
        // Cache current data for offline use
        localStorage.setItem('positionsGridOfflineCache', JSON.stringify(this._positionsData));
    }
    syncOfflineChanges() {
        // Sync any changes made while offline
        console.log('PositionsDataGrid: Syncing offline changes...');
        // Dispatch event for parent application to handle sync
        this.dispatchEvent(new CustomEvent('offline-sync-needed', {
            detail: { cachedData: this._positionsData }
        }));
    }
    restoreFromNavigationState(state) {
        console.log('PositionsDataGrid: Restoring from navigation state', state);
        // Restore component state from browser history
        if (state.positionsData) {
            this._positionsData = state.positionsData;
        }
        if (state.sortBy) {
            this._sortBy = state.sortBy;
        }
        if (state.sortDirection) {
            this._sortDirection = state.sortDirection;
        }
        if (state.showFilters !== undefined) {
            this._showFilters = state.showFilters;
        }
        // Update the display
        this.updateSourceData();
    }
    // Method to save state to browser history
    saveToNavigationState() {
        const state = {
            positionsGridState: {
                positionsData: this._positionsData,
                sortBy: this._sortBy,
                sortDirection: this._sortDirection,
                showFilters: this._showFilters
            }
        };
        // Push state to browser history
        history.pushState(state, '', window.location.href);
    }
    addClass(className) {
        this.classList.add(className);
    }
    removeClass(className) {
        this.classList.remove(className);
    }
    // Positions-specific data setter
    set positionsData(data) {
        this._positionsData = data;
        this.updateSourceData();
    }
    get positionsData() {
        return this._positionsData;
    }
    // Show/hide filters
    set showFilters(value) {
        this._showFilters = value;
        this.setAttribute('show-filters', value.toString());
        if (this.isConnected) {
            this.render();
        }
    }
    get showFilters() {
        return this._showFilters;
    }
    // Sort functionality
    set sortBy(field) {
        this._sortBy = field;
        this.setAttribute('sort-by', field);
        this.sortPositions();
    }
    get sortBy() {
        return this._sortBy;
    }
    set sortDirection(direction) {
        this._sortDirection = direction;
        this.setAttribute('sort-direction', direction);
        this.sortPositions();
    }
    get sortDirection() {
        return this._sortDirection;
    }
    // Watch for positions-specific attribute changes
    static get observedAttributes() {
        return [...DataGrid.observedAttributes, 'show-filters', 'sort-by', 'sort-direction'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case 'show-filters':
                this._showFilters = newValue === 'true';
                break;
            case 'sort-by':
                if (newValue && this.isValidSortField(newValue)) {
                    this._sortBy = newValue;
                }
                break;
            case 'sort-direction':
                if (newValue === 'asc' || newValue === 'desc') {
                    this._sortDirection = newValue;
                }
                break;
        }
    }
    // Convert positions data to DataGrid format
    updateSourceData() {
        const positionsSource = {
            positions: {
                schema: {
                    position: {
                        type: "string",
                        displayName: "Position",
                        htmlElement: "input",
                        htmlType: "text",
                        required: true,
                        searchable: true
                    },
                    company: {
                        type: "string",
                        displayName: "Company",
                        htmlElement: "input",
                        htmlType: "text",
                        required: true,
                        searchable: true
                    },
                    email: {
                        type: "email",
                        displayName: "Email",
                        htmlElement: "input",
                        htmlType: "email",
                        required: true,
                        searchable: true
                    },
                    cphone: {
                        type: "phone",
                        displayName: "Cell Phone",
                        htmlElement: "input",
                        htmlType: "tel",
                        required: false,
                        searchable: true
                    },
                    ophone: {
                        type: "phone",
                        displayName: "Office Phone",
                        htmlElement: "input",
                        htmlType: "tel",
                        required: false,
                        searchable: true
                    },
                    location: {
                        type: "string",
                        displayName: "Location",
                        htmlElement: "input",
                        htmlType: "text",
                        required: false,
                        searchable: true
                    },
                    notes: {
                        type: "text",
                        displayName: "Notes",
                        htmlElement: "textarea",
                        required: false,
                        searchable: false
                    }
                },
                data: this._positionsData
            }
        };
        this.sourceData = positionsSource;
    }
    // Sort positions by specified field
    sortPositions() {
        if (this._positionsData.length === 0)
            return;
        const sortedData = [...this._positionsData].sort((a, b) => {
            const aVal = a[this._sortBy] || '';
            const bVal = b[this._sortBy] || '';
            const comparison = aVal.toString().localeCompare(bVal.toString());
            return this._sortDirection === 'asc' ? comparison : -comparison;
        });
        this._positionsData = sortedData;
        this.updateSourceData();
    }
    // Validate sort field
    isValidSortField(field) {
        return ['position', 'company', 'email', 'cphone', 'ophone', 'location', 'notes'].includes(field);
    }
    // Add position-specific methods
    addPosition(position) {
        this._positionsData.push(position);
        this.updateSourceData();
    }
    removePosition(index) {
        if (index >= 0 && index < this._positionsData.length) {
            this._positionsData.splice(index, 1);
            this.updateSourceData();
        }
    }
    updatePosition(index, position) {
        if (index >= 0 && index < this._positionsData.length) {
            this._positionsData[index] = { ...this._positionsData[index], ...position };
            this.updateSourceData();
        }
    }
    filterPositions(filterFn) {
        return this._positionsData.filter(filterFn);
    }
    searchPositions(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this._positionsData.filter(position => position.position.toLowerCase().includes(term) ||
            position.company.toLowerCase().includes(term) ||
            position.email.toLowerCase().includes(term) ||
            (position.location && position.location.toLowerCase().includes(term)));
    }
    // Override render to add positions-specific features
    render() {
        // Call parent render first
        super.render();
        // Add positions-specific enhancements
        if (this._showFilters) {
            this.addFilterControls();
        }
        this.addSortControls();
    }
    addFilterControls() {
        const container = this.querySelector('.data-grid-container');
        if (container) {
            const filterRow = document.createElement('div');
            filterRow.className = 'filter-controls';
            filterRow.innerHTML = `
                <div class="filter-row">
                    <input type="text" placeholder="Search positions..." class="position-search">
                    <select class="company-filter">
                        <option value="">All Companies</option>
                        ${this.getUniqueCompanies().map(company => `<option value="${company}">${company}</option>`).join('')}
                    </select>
                    <select class="location-filter">
                        <option value="">All Locations</option>
                        ${this.getUniqueLocations().map(location => `<option value="${location}">${location}</option>`).join('')}
                    </select>
                </div>
            `;
            container.insertBefore(filterRow, container.firstChild);
            // Add event listeners for filters
            this.attachFilterListeners();
        }
    }
    addSortControls() {
        const headers = this.querySelectorAll('.header-column');
        headers.forEach((header, index) => {
            const headerElement = header;
            headerElement.style.cursor = 'pointer';
            headerElement.addEventListener('click', () => {
                const fields = ['position', 'company', 'email', 'cphone', 'ophone', 'location'];
                if (fields[index]) {
                    this.sortBy = fields[index];
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                }
            });
        });
    }
    getUniqueCompanies() {
        return [...new Set(this._positionsData.map(p => p.company))].filter(Boolean);
    }
    getUniqueLocations() {
        return [...new Set(this._positionsData.map(p => p.location).filter(Boolean))];
    }
    attachFilterListeners() {
        const searchInput = this.querySelector('.position-search');
        const companyFilter = this.querySelector('.company-filter');
        const locationFilter = this.querySelector('.location-filter');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
        if (companyFilter) {
            companyFilter.addEventListener('change', () => this.applyFilters());
        }
        if (locationFilter) {
            locationFilter.addEventListener('change', () => this.applyFilters());
        }
    }
    applyFilters() {
        const searchInput = this.querySelector('.position-search');
        const companyFilter = this.querySelector('.company-filter');
        const locationFilter = this.querySelector('.location-filter');
        let filteredData = [...this._positionsData];
        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            filteredData = filteredData.filter(position => position.position.toLowerCase().includes(searchTerm) ||
                position.company.toLowerCase().includes(searchTerm) ||
                position.email.toLowerCase().includes(searchTerm));
        }
        if (companyFilter && companyFilter.value) {
            filteredData = filteredData.filter(position => position.company === companyFilter.value);
        }
        if (locationFilter && locationFilter.value) {
            filteredData = filteredData.filter(position => position.location === locationFilter.value);
        }
        // Update display with filtered data
        const tempData = this._positionsData;
        this._positionsData = filteredData;
        this.updateSourceData();
        this._positionsData = tempData; // Restore original data
    }
}
// Register the custom element
customElements.define("positions-data-grid", PositionsDataGrid);
// Export for use in other files
export { PositionsDataGrid };
