// Import base DataGrid and types
import { DataGrid, DataGridSource, DataGridEntity } from './datagrid.js';

// Positions-specific types
interface PositionData {
    position: string;
    company: string;
    email: string;
    cphone?: string;
    ophone?: string;
    location?: string;
    notes?: string;
}

interface PositionsDataGridElement extends HTMLElement {
    positionsData: PositionData[];
    showFilters?: boolean;
    sortBy?: keyof PositionData;
    sortDirection?: 'asc' | 'desc';
}

class PositionsDataGrid extends DataGrid implements PositionsDataGridElement {
    private _positionsData: PositionData[] = [];
    private _showFilters: boolean = false;
    private _sortBy: keyof PositionData = 'position';
    private _sortDirection: 'asc' | 'desc' = 'asc';
    private _isInitialized: boolean = false;

    constructor() {
        super();
        // Set default entity to positions
        this.entity = 'positions';
        
        // Handle page lifecycle events
        this.setupLifecycleEventHandlers();
    }

    // Setup event handlers for various lifecycle events
    private setupLifecycleEventHandlers(): void {
        // Page reload/refresh detection
        window.addEventListener('beforeunload', (event) => {
            this.onBeforePageUnload(event);
        });

        // Page visibility changes (tab switching, minimize, etc.)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onPageHidden();
            } else {
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
    
    private onBeforePageUnload(event: BeforeUnloadEvent): void {
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

    private onPageHidden(): void {
        console.log('PositionsDataGrid: Page became hidden (tab switch, minimize, etc.)');
        
        // Pause any ongoing operations
        this.pauseAutoRefresh();
        
        // Save current scroll position and filters
        this.saveViewState();
    }

    private onPageVisible(): void {
        console.log('PositionsDataGrid: Page became visible again');
        
        // Resume operations
        this.resumeAutoRefresh();
        
        // Optionally refresh data
        this.refreshDataIfStale();
        
        // Restore view state
        this.restoreViewState();
    }

    private onNavigationChange(event: PopStateEvent): void {
        console.log('PositionsDataGrid: Browser navigation detected', event.state);
        
        // Handle browser back/forward
        if (event.state && event.state.positionsGridState) {
            this.restoreFromNavigationState(event.state.positionsGridState);
        }
    }

    private onConnectionLost(): void {
        console.log('PositionsDataGrid: Internet connection lost');
        
        // Switch to offline mode
        this.showOfflineIndicator();
        
        // Cache current data locally
        this.cacheDataLocally();
    }

    private onConnectionRestored(): void {
        console.log('PositionsDataGrid: Internet connection restored');
        
        // Hide offline indicator
        this.hideOfflineIndicator();
        
        // Sync any offline changes
        this.syncOfflineChanges();
    }

    private onComponentFocus(): void {
        console.log('PositionsDataGrid: Component received focus');
        
        // Highlight the grid or show keyboard shortcuts
        this.addClass('focused');
    }

    private onComponentBlur(): void {
        console.log('PositionsDataGrid: Component lost focus');
        
        // Remove focus styling
        this.removeClass('focused');
    }

    // State management methods

    private saveStateToLocalStorage(): void {
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
        } catch (error) {
            console.warn('PositionsDataGrid: Failed to save state', error);
        }
    }

    private loadStateFromLocalStorage(): boolean {
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
        } catch (error) {
            console.warn('PositionsDataGrid: Failed to load state', error);
        }
        
        return false;
    }

    private checkForUnsavedChanges(): boolean {
        // Implement your logic to detect unsaved changes
        // For example, compare current data with last saved data
        const lastSaved = localStorage.getItem('positionsGridLastSaved');
        const currentData = JSON.stringify(this._positionsData);
        
        return lastSaved !== currentData;
    }

    private saveViewState(): void {
        const scrollTop = this.scrollTop;
        const activeFilters = this.getActiveFilters();
        
        sessionStorage.setItem('positionsGridViewState', JSON.stringify({
            scrollTop,
            activeFilters,
            timestamp: Date.now()
        }));
    }

    private restoreViewState(): void {
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
        } catch (error) {
            console.warn('PositionsDataGrid: Failed to restore view state', error);
        }
    }

    // Auto-refresh functionality
    private autoRefreshInterval?: number;

    private pauseAutoRefresh(): void {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = undefined;
        }
    }

    private resumeAutoRefresh(): void {
        // Only resume if auto-refresh was enabled
        if (this.getAttribute('auto-refresh') === 'true') {
            const interval = parseInt(this.getAttribute('refresh-interval') || '30000');
            this.autoRefreshInterval = setInterval(() => {
                this.refreshDataIfStale();
            }, interval);
        }
    }

    private refreshDataIfStale(): void {
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
    connectedCallback(): void {
        console.log('PositionsDataGrid: Component connected to DOM');
        
        // Try to restore state first
        const stateRestored = this.loadStateFromLocalStorage();
        
        if (!stateRestored) {
            // If no saved state, call parent connectedCallback
            super.connectedCallback();
        } else {
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
    disconnectedCallback(): void {
        console.log('PositionsDataGrid: Component disconnected from DOM');
        
        // Save state before disconnect
        this.saveStateToLocalStorage();
        
        // Clean up auto-refresh
        this.pauseAutoRefresh();
        
        // Remove event listeners
        this.removeEventListeners();
    }

    private removeEventListeners(): void {
        // Clean up any event listeners to prevent memory leaks
        // (The browser-level events will be cleaned up automatically,
        // but this is where you'd remove any custom listeners)
    }

    // Helper methods for the new functionality
    private getActiveFilters(): any {
        // Return current filter state
        return {
            search: (this.querySelector('.position-search') as HTMLInputElement)?.value || '',
            company: (this.querySelector('.company-filter') as HTMLSelectElement)?.value || '',
            location: (this.querySelector('.location-filter') as HTMLSelectElement)?.value || ''
        };
    }

    private applyFiltersFromState(filters: any): void {
        // Apply saved filters
        const searchInput = this.querySelector('.position-search') as HTMLInputElement;
        const companyFilter = this.querySelector('.company-filter') as HTMLSelectElement;
        const locationFilter = this.querySelector('.location-filter') as HTMLSelectElement;

        if (searchInput) searchInput.value = filters.search || '';
        if (companyFilter) companyFilter.value = filters.company || '';
        if (locationFilter) locationFilter.value = filters.location || '';
        
        this.applyFilters();
    }

    private showOfflineIndicator(): void {
        // Add visual indicator that we're offline
        this.classList.add('offline-mode');
        
        const indicator = document.createElement('div');
        indicator.className = 'offline-indicator';
        indicator.textContent = 'Offline Mode - Changes will sync when connection is restored';
        this.prepend(indicator);
    }

    private hideOfflineIndicator(): void {
        this.classList.remove('offline-mode');
        this.querySelector('.offline-indicator')?.remove();
    }

    private cacheDataLocally(): void {
        // Cache current data for offline use
        localStorage.setItem('positionsGridOfflineCache', JSON.stringify(this._positionsData));
    }

    private syncOfflineChanges(): void {
        // Sync any changes made while offline
        console.log('PositionsDataGrid: Syncing offline changes...');
        
        // Dispatch event for parent application to handle sync
        this.dispatchEvent(new CustomEvent('offline-sync-needed', {
            detail: { cachedData: this._positionsData }
        }));
    }

    private restoreFromNavigationState(state: any): void {
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
    public saveToNavigationState(): void {
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

    private addClass(className: string): void {
        this.classList.add(className);
    }

    private removeClass(className: string): void {
        this.classList.remove(className);
    }

    // Positions-specific data setter
    set positionsData(data: PositionData[]) {
        this._positionsData = data;
        this.updateSourceData();
    }

    get positionsData(): PositionData[] {
        return this._positionsData;
    }

    // Show/hide filters
    set showFilters(value: boolean) {
        this._showFilters = value;
        this.setAttribute('show-filters', value.toString());
        if (this.isConnected) {
            this.render();
        }
    }

    get showFilters(): boolean {
        return this._showFilters;
    }

    // Sort functionality
    set sortBy(field: keyof PositionData) {
        this._sortBy = field;
        this.setAttribute('sort-by', field);
        this.sortPositions();
    }

    get sortBy(): keyof PositionData {
        return this._sortBy;
    }

    set sortDirection(direction: 'asc' | 'desc') {
        this._sortDirection = direction;
        this.setAttribute('sort-direction', direction);
        this.sortPositions();
    }

    get sortDirection(): 'asc' | 'desc' {
        return this._sortDirection;
    }

    // Watch for positions-specific attribute changes
    static get observedAttributes(): string[] {
        return [...DataGrid.observedAttributes, 'show-filters', 'sort-by', 'sort-direction'];
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        super.attributeChangedCallback(name, oldValue, newValue);
        
        switch (name) {
            case 'show-filters':
                this._showFilters = newValue === 'true';
                break;
            case 'sort-by':
                if (newValue && this.isValidSortField(newValue)) {
                    this._sortBy = newValue as keyof PositionData;
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
    private updateSourceData(): void {
        const positionsSource: DataGridSource = {
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
    private sortPositions(): void {
        if (this._positionsData.length === 0) return;

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
    private isValidSortField(field: string): field is keyof PositionData {
        return ['position', 'company', 'email', 'cphone', 'ophone', 'location', 'notes'].includes(field);
    }

    // Add position-specific methods
    public addPosition(position: PositionData): void {
        this._positionsData.push(position);
        this.updateSourceData();
    }

    public removePosition(index: number): void {
        if (index >= 0 && index < this._positionsData.length) {
            this._positionsData.splice(index, 1);
            this.updateSourceData();
        }
    }

    public updatePosition(index: number, position: Partial<PositionData>): void {
        if (index >= 0 && index < this._positionsData.length) {
            this._positionsData[index] = { ...this._positionsData[index], ...position };
            this.updateSourceData();
        }
    }

    public filterPositions(filterFn: (position: PositionData) => boolean): PositionData[] {
        return this._positionsData.filter(filterFn);
    }

    public searchPositions(searchTerm: string): PositionData[] {
        const term = searchTerm.toLowerCase();
        return this._positionsData.filter(position => 
            position.position.toLowerCase().includes(term) ||
            position.company.toLowerCase().includes(term) ||
            position.email.toLowerCase().includes(term) ||
            (position.location && position.location.toLowerCase().includes(term))
        );
    }

    // Override render to add positions-specific features
    protected render(): void {
        // Call parent render first
        super.render();

        // Add positions-specific enhancements
        if (this._showFilters) {
            this.addFilterControls();
        }
        
        this.addSortControls();
    }

    private addFilterControls(): void {
        const container = this.querySelector('.data-grid-container');
        if (container) {
            const filterRow = document.createElement('div');
            filterRow.className = 'filter-controls';
            filterRow.innerHTML = `
                <div class="filter-row">
                    <input type="text" placeholder="Search positions..." class="position-search">
                    <select class="company-filter">
                        <option value="">All Companies</option>
                        ${this.getUniqueCompanies().map(company => 
                            `<option value="${company}">${company}</option>`
                        ).join('')}
                    </select>
                    <select class="location-filter">
                        <option value="">All Locations</option>
                        ${this.getUniqueLocations().map(location => 
                            `<option value="${location}">${location}</option>`
                        ).join('')}
                    </select>
                </div>
            `;
            container.insertBefore(filterRow, container.firstChild);
            
            // Add event listeners for filters
            this.attachFilterListeners();
        }
    }

    private addSortControls(): void {
        const headers = this.querySelectorAll('.header-column');
        headers.forEach((header, index) => {
            const headerElement = header as HTMLElement;
            headerElement.style.cursor = 'pointer';
            headerElement.addEventListener('click', () => {
                const fields: (keyof PositionData)[] = ['position', 'company', 'email', 'cphone', 'ophone', 'location'];
                if (fields[index]) {
                    this.sortBy = fields[index];
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                }
            });
        });
    }

    private getUniqueCompanies(): string[] {
        return [...new Set(this._positionsData.map(p => p.company))].filter(Boolean);
    }

    private getUniqueLocations(): string[] {
        return [...new Set(this._positionsData.map(p => p.location).filter(Boolean))] as string[];
    }

    private attachFilterListeners(): void {
        const searchInput = this.querySelector('.position-search') as HTMLInputElement;
        const companyFilter = this.querySelector('.company-filter') as HTMLSelectElement;
        const locationFilter = this.querySelector('.location-filter') as HTMLSelectElement;

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

    private applyFilters(): void {
        const searchInput = this.querySelector('.position-search') as HTMLInputElement;
        const companyFilter = this.querySelector('.company-filter') as HTMLSelectElement;
        const locationFilter = this.querySelector('.location-filter') as HTMLSelectElement;

        let filteredData = [...this._positionsData];

        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            filteredData = filteredData.filter(position =>
                position.position.toLowerCase().includes(searchTerm) ||
                position.company.toLowerCase().includes(searchTerm) ||
                position.email.toLowerCase().includes(searchTerm)
            );
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
export { PositionsDataGrid, PositionData };

// Augment the global HTMLElementTagNameMap for TypeScript
declare global {
    interface HTMLElementTagNameMap {
        'positions-data-grid': PositionsDataGrid;
    }
}