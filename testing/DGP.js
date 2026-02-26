/**
 * DataGrid Presentation Layer (DGP.js)
 * Handles specific data presentation, foreign key resolution, and entity-specific logic
 * Works with any data source and schema configuration
 */

// Create logger instance
const dgpLogger = window.DataGridNamespace?.logger || {
    debug: () => {},
    info: console.info.bind(console, '[DGP]:'),
    warn: console.warn.bind(console, '[DGP]:'),
    error: console.error.bind(console, '[DGP]:')
};

/**
 * DataGrid Presentation Manager
 * Manages multiple DataGrid instances and their data sources
 */
class DataGridPresentation {
    constructor() {
        this.dataGrids = new Map();
        this.dataSources = new Map();
        this.foreignKeyResolvers = new Map();
        
        dgpLogger.info('DataGrid Presentation Manager initialized');
    }

    /**
     * Register a data source with its schema
     */
    registerDataSource(entityType, config) {
        this.dataSources.set(entityType, {
            schema: config.schema,
            data: config.data || [],
            relationships: config.relationships || {},
            validation: config.validation || {},
            displayOptions: config.displayOptions || {}
        });
        
        // Setup foreign key resolvers for this entity
        this.setupForeignKeyResolvers(entityType, config);
        
        dgpLogger.info(`Data source registered: ${entityType}`);
    }

    /**
     * Setup foreign key resolvers for an entity
     */
    setupForeignKeyResolvers(entityType, config) {
        const resolvers = {};
        
        Object.entries(config.schema).forEach(([fieldName, fieldConfig]) => {
            if (fieldConfig.foreignKey) {
                const [refEntity, refField] = fieldConfig.foreignKey.split('.');
                const displayField = fieldConfig.foreignKeyDisplay?.split('.')[1] || refField;
                
                resolvers[fieldName] = (value) => {
                    const refDataSource = this.dataSources.get(refEntity);
                    if (!refDataSource) return value;
                    
                    const refRecord = refDataSource.data.find(record => record[refField] == value);
                    return refRecord ? refRecord[displayField] : value;
                };
                
                // Add options getter for selects
                resolvers[fieldName].getOptions = () => {
                    const refDataSource = this.dataSources.get(refEntity);
                    if (!refDataSource) return [];
                    
                    return [
                        { value: '', label: '' },
                        ...refDataSource.data.map(record => ({
                            value: record[refField],
                            label: record[displayField]
                        }))
                    ];
                };
            }
        });
        
        this.foreignKeyResolvers.set(entityType, resolvers);
    }

    /**
     * Create a DataGrid instance for an entity
     */
    createDataGrid(containerId, entityType, options = {}) {
        const dataSource = this.dataSources.get(entityType);
        if (!dataSource) {
            throw new Error(`Data source '${entityType}' not registered`);
        }

        const config = {
            containerId,
            entityType,
            schema: dataSource.schema,
            data: dataSource.data,
            foreignKeyResolvers: this.foreignKeyResolvers.get(entityType) || {},
            onDataChange: (newData) => this.handleDataChange(entityType, newData),
            onSelectionChange: (selectedRecords) => this.handleSelectionChange(entityType, selectedRecords),
            ...options
        };

        const dataGrid = new DataGrid(config);
        this.dataGrids.set(containerId, dataGrid);
        
        dgpLogger.info(`DataGrid created: ${entityType} in container ${containerId}`);
        return dataGrid;
    }

    /**
     * Handle data changes from DataGrid
     */
    handleDataChange(entityType, newData) {
        const dataSource = this.dataSources.get(entityType);
        if (dataSource) {
            dataSource.data = newData;
            dgpLogger.debug(`Data updated for entity: ${entityType}`);
        }
    }

    /**
     * Handle selection changes from DataGrid
     */
    handleSelectionChange(entityType, selectedRecords) {
        dgpLogger.debug(`Selection changed for ${entityType}: ${selectedRecords.length} records`);
    }

    /**
     * Get DataGrid instance by container ID
     */
    getDataGrid(containerId) {
        return this.dataGrids.get(containerId);
    }

    /**
     * Get data source
     */
    getDataSource(entityType) {
        return this.dataSources.get(entityType);
    }

    /**
     * Update data for an entity and refresh associated DataGrids
     */
    updateData(entityType, newData) {
        const dataSource = this.dataSources.get(entityType);
        if (!dataSource) {
            dgpLogger.warn(`Cannot update data: entity '${entityType}' not registered`);
            return;
        }

        dataSource.data = newData;
        
        // Update foreign key resolvers if this entity is referenced by others
        this.refreshForeignKeyResolvers();
        
        // Refresh all DataGrids that use this entity
        this.dataGrids.forEach((dataGrid, containerId) => {
            if (dataGrid.config.entityType === entityType) {
                dataGrid.setData(newData);
            }
        });
        
        dgpLogger.info(`Data updated and DataGrids refreshed for entity: ${entityType}`);
    }

    /**
     * Refresh foreign key resolvers after data changes
     */
    refreshForeignKeyResolvers() {
        this.dataSources.forEach((dataSource, entityType) => {
            const config = { schema: dataSource.schema };
            this.setupForeignKeyResolvers(entityType, config);
        });
    }

    /**
     * Destroy a DataGrid instance
     */
    destroyDataGrid(containerId) {
        const dataGrid = this.dataGrids.get(containerId);
        if (dataGrid) {
            dataGrid.destroy();
            this.dataGrids.delete(containerId);
            dgpLogger.info(`DataGrid destroyed: ${containerId}`);
        }
    }

    /**
     * Destroy all DataGrid instances
     */
    destroyAll() {
        this.dataGrids.forEach((dataGrid, containerId) => {
            dataGrid.destroy();
        });
        this.dataGrids.clear();
        dgpLogger.info('All DataGrids destroyed');
    }

    /**
     * Load data from JSON and setup DataGrids
     */
    async loadFromJSON(jsonUrl) {
        try {
            const response = await fetch(jsonUrl);
            const jsonData = await response.json();
            
            // Process each entity in the JSON
            Object.entries(jsonData).forEach(([rootKey, rootData]) => {
                if (typeof rootData === 'object' && rootData !== null) {
                    Object.entries(rootData).forEach(([entityType, entityData]) => {
                        if (entityData.schema && entityData.data) {
                            this.registerDataSource(entityType, {
                                schema: entityData.schema,
                                data: entityData.data,
                                relationships: entityData.relationships || {},
                                validation: entityData.validation || {},
                                displayOptions: entityData.displayOptions || {}
                            });
                        }
                    });
                }
            });
            
            dgpLogger.info(`Data loaded from JSON: ${jsonUrl}`);
            return true;
        } catch (error) {
            dgpLogger.error('Failed to load JSON data:', error);
            throw error;
        }
    }

    /**
     * Export data as JSON
     */
    exportToJSON() {
        const exportData = {};
        
        this.dataSources.forEach((dataSource, entityType) => {
            if (!exportData.data) exportData.data = {};
            
            exportData.data[entityType] = {
                schema: dataSource.schema,
                data: dataSource.data,
                relationships: dataSource.relationships,
                validation: dataSource.validation,
                displayOptions: dataSource.displayOptions
            };
        });
        
        return exportData;
    }

    /**
     * Create a tab-based interface with multiple DataGrids
     */
    createTabbedInterface(containerId, tabConfigs) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container '${containerId}' not found`);
        }

        // Create tab structure
        const tabNavigation = document.createElement('nav');
        tabNavigation.className = 'tab-navigation';

        const mainContent = document.createElement('main');
        mainContent.className = 'main-content';

        let activeTabSet = false;

        tabConfigs.forEach((tabConfig, index) => {
            const { id, label, entityType, icon, options } = tabConfig;
            
            // Create tab button
            const tabButton = document.createElement('button');
            tabButton.className = `tab-button ${!activeTabSet ? 'active' : ''}`;
            tabButton.dataset.tab = id;
            tabButton.innerHTML = `
                ${icon ? `<span class="tab-icon">${icon}</span>` : ''}
                <span class="tab-label">${label}</span>
            `;
            tabButton.addEventListener('click', () => this.switchTab(containerId, id));
            tabNavigation.appendChild(tabButton);

            // Create tab panel
            const tabPanel = document.createElement('div');
            // tabPanel.id = `${id}-panel`;
            tabPanel.id = `main-content-panel`;
            tabPanel.className = `tab-panel ${!activeTabSet ? 'active' : ''}`;
            
            // Create DataGrid container within the panel
            const dgContainer = document.createElement('div');
            dgContainer.id = `${id}-datagrid`;
            dgContainer.className = 'datagrid-container';
            tabPanel.appendChild(dgContainer);
            
            mainContent.appendChild(tabPanel);

            // Create DataGrid for this tab
            if (entityType) {
                try {
                    this.createDataGrid(`${id}-datagrid`, entityType, options || {});
                } catch (error) {
                    dgpLogger.error(`Failed to create DataGrid for tab ${id}:`, error);
                }
            }

            if (!activeTabSet) activeTabSet = true;
        });

        container.innerHTML = '';
        container.appendChild(tabNavigation);
        container.appendChild(mainContent);

        dgpLogger.info(`Tabbed interface created with ${tabConfigs.length} tabs`);
    }

    /**
     * Switch active tab
     */
    switchTab(containerId, tabId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Update tab buttons
        const tabButtons = container.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            if (button.dataset.tab === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Update tab panels
        const tabPanels = container.querySelectorAll('.tab-panel');
        // tabPanels.forEach(panel => {
        //     if (panel.id === `${tabId}-panel`) {
        //         panel.classList.add('active');
        //     } else {
        //         panel.classList.remove('active');
        //     }
        // });

        dgpLogger.debug(`Switched to tab: ${tabId}`);
    }

    /**
     * Quick setup method for common scenarios
     */
    async quickSetup(config) {
        const {
            jsonUrl,
            containerId,
            tabs,
            defaultOptions = {}
        } = config;

        try {
            // Load data from JSON
            if (jsonUrl) {
                await this.loadFromJSON(jsonUrl);
            }

            // Create tabbed interface if tabs are specified
            if (tabs && tabs.length > 0) {
                const tabConfigs = tabs.map(tab => ({
                    id: tab.id || tab.entityType,
                    label: tab.label || tab.entityType,
                    entityType: tab.entityType,
                    icon: tab.icon,
                    options: { ...defaultOptions, ...tab.options }
                }));

                this.createTabbedInterface(containerId, tabConfigs);
            }

            dgpLogger.info('Quick setup completed successfully');
            return true;
        } catch (error) {
            dgpLogger.error('Quick setup failed:', error);
            throw error;
        }
    }
}

// Create global instance
window.DataGridPresentation = DataGridPresentation;
window.DGP = new DataGridPresentation();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataGrid, DataGridPresentation };
}