import { DataGrid } from './datagrid.js';
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
declare class PositionsDataGrid extends DataGrid implements PositionsDataGridElement {
    private _positionsData;
    private _showFilters;
    private _sortBy;
    private _sortDirection;
    private _isInitialized;
    constructor();
    private setupLifecycleEventHandlers;
    private onBeforePageUnload;
    private onPageHidden;
    private onPageVisible;
    private onNavigationChange;
    private onConnectionLost;
    private onConnectionRestored;
    private onComponentFocus;
    private onComponentBlur;
    private saveStateToLocalStorage;
    private loadStateFromLocalStorage;
    private checkForUnsavedChanges;
    private saveViewState;
    private restoreViewState;
    private autoRefreshInterval?;
    private pauseAutoRefresh;
    private resumeAutoRefresh;
    private refreshDataIfStale;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private removeEventListeners;
    private getActiveFilters;
    private applyFiltersFromState;
    private showOfflineIndicator;
    private hideOfflineIndicator;
    private cacheDataLocally;
    private syncOfflineChanges;
    private restoreFromNavigationState;
    saveToNavigationState(): void;
    private addClass;
    private removeClass;
    set positionsData(data: PositionData[]);
    get positionsData(): PositionData[];
    set showFilters(value: boolean);
    get showFilters(): boolean;
    set sortBy(field: keyof PositionData);
    get sortBy(): keyof PositionData;
    set sortDirection(direction: 'asc' | 'desc');
    get sortDirection(): 'asc' | 'desc';
    static get observedAttributes(): string[];
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    private updateSourceData;
    private sortPositions;
    private isValidSortField;
    addPosition(position: PositionData): void;
    removePosition(index: number): void;
    updatePosition(index: number, position: Partial<PositionData>): void;
    filterPositions(filterFn: (position: PositionData) => boolean): PositionData[];
    searchPositions(searchTerm: string): PositionData[];
    protected render(): void;
    private addFilterControls;
    private addSortControls;
    private getUniqueCompanies;
    private getUniqueLocations;
    private attachFilterListeners;
    private applyFilters;
}
export { PositionsDataGrid, PositionData };
declare global {
    interface HTMLElementTagNameMap {
        'positions-data-grid': PositionsDataGrid;
    }
}
