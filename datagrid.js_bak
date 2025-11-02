/**
 * Standalone DataGrid Component
 * Handles full viewport display with nowrap functionality
 * Last updated: 2025-10-30 - Added conditional regex validation
 * Cache buster version: Prevents regex errors with graceful fallbacks
 */
console.log('datagrid.js loaded at:', new Date().toISOString());
class DataGrid {
    constructor(containerOrOptions, options = {}) {
        // Handle different constructor patterns
        if (typeof containerOrOptions === 'string') {
            // Traditional usage: new DataGrid('#selector')
            this.container = document.querySelector(containerOrOptions);
            this.options = options;
        } else if (containerOrOptions instanceof HTMLElement) {
            // Element passed directly: new DataGrid(element)
            this.container = containerOrOptions;
            this.options = options;
        } else if (typeof containerOrOptions === 'object') {
            // Options object: new DataGrid({container: '#selector', source: data})
            this.options = containerOrOptions;
            this.container = typeof this.options.container === 'string' 
                ? document.querySelector(this.options.container)
                : this.options.container;
        }

        this.data = [];
        this.schema = {};
        this.dataSource = this.options.source || this.options.records || null;
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('DataGrid container not found');
            return;
        }

        this.setupEventListeners();
        
        // Load data from various sources
        if (this.dataSource) {
            this.loadFromSource(this.dataSource);
        } else {
            this.loadSampleData();
        }
        
        console.log('DataGrid initialized');
    }

    loadFromSource(source) {
        try {
            let dataConfig;
            
            if (typeof source === 'string') {
                // Source is a variable name - try to get it from global scope
                dataConfig = window[source] || eval(source);
            } else if (typeof source === 'object') {
                // Source is the data object itself
                dataConfig = source;
            }

            if (dataConfig && dataConfig.positions) {
                // Standard format with positions.schema and positions.data
                this.schema = dataConfig.positions.schema;
                this.data = dataConfig.positions.data;
            } else if (dataConfig && dataConfig.schema && dataConfig.data) {
                // Direct format with schema and data at root
                this.schema = dataConfig.schema;
                this.data = dataConfig.data;
            } else if (Array.isArray(dataConfig)) {
                // Just an array of data - use default schema
                this.data = dataConfig;
                this.generateDefaultSchema();
            } else {
                throw new Error('Invalid data source format');
            }
            
            this.render();
        } catch (error) {
            console.error('Error loading from source:', error);
            this.loadSampleData(); // Fallback
        }
    }

    generateDefaultSchema() {
        if (this.data.length > 0) {
            const firstRecord = this.data[0];
            this.schema = {};
            
            Object.keys(firstRecord).forEach(key => {
                this.schema[key] = {
                    type: 'string',
                    displayName: key.charAt(0).toUpperCase() + key.slice(1),
                    htmlElement: 'input',
                    htmlType: 'text',
                    css: { placeholder: `Enter ${key}` },
                    required: false
                };
            });
        }
    }

    setupEventListeners() {
        // Add click handlers for rows
        this.container.addEventListener('click', (e) => {
            const row = e.target.closest('.DataGridRow');
            if (row && !row.classList.contains('header-row')) {
                this.selectRow(row);
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.adjustLayout();
        });

        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyNavigation(e);
        });
    }

    loadSampleData() {
        try {
            // Load data from the global dataGridData variable
            if (typeof dataGridData !== 'undefined' && dataGridData.positions) {
                // Extract schema and data from the positions entity
                this.schema = dataGridData.positions.schema;
                this.data = dataGridData.positions.data;
            } else {
                throw new Error('dataGridData not found or invalid structure');
            }
            
            this.render();
        } catch (error) {
            console.error('Error loading data:', error);
            
            // Fallback to empty data structure
            this.schema = {};
            this.data = [];
            this.render();
        }
    }

    render() {
        const rows = this.container.querySelectorAll('.DataGridRow:not(:first-child)');
        rows.forEach(row => row.remove());

        this.data.forEach((item, index) => {
            const row = this.createRow(item, index);
            this.container.appendChild(row);
        });
    }

    createRow(data, index) {
        const row = document.createElement('div');
        row.className = 'DataGridRow';
        row.dataset.index = index;

        // Get columns from schema if available, otherwise from data
        const columns = Object.keys(this.schema).length > 0 
            ? Object.keys(this.schema)
            : (this.data.length > 0 ? Object.keys(this.data[0]) : []);
            
        columns.forEach(column => {
            const cell = document.createElement('div');
            cell.className = 'DataGridCell';
            
            // Get schema information for this column
            const fieldSchema = this.schema[column];
            
            if (fieldSchema && fieldSchema.htmlElement) {
                // Create the appropriate HTML element based on schema
                const element = document.createElement(fieldSchema.htmlElement);
                
                // Set element type if specified
                if (fieldSchema.htmlType) {
                    element.type = fieldSchema.htmlType;
                }
                
                // Set HTML attributes from schema
                if (fieldSchema.css) {
                    Object.entries(fieldSchema.css).forEach(([attr, value]) => {
                        try {
                            // Skip empty or undefined values
                            if (value === null || value === undefined || value === '') {
                                return;
                            }
                            
                            // For pattern attribute, validate the regex before setting
                            if (attr === 'pattern') {
                                try {
                                    new RegExp(value);
                                    element.setAttribute(attr, value);
                                } catch (regexError) {
                                    console.warn(`Invalid regex pattern for ${column}: ${value}`, regexError);
                                    // Skip invalid patterns instead of breaking
                                }
                            } else {
                                // Set other attributes normally
                                element.setAttribute(attr, value);
                            }
                        } catch (error) {
                            console.warn(`Error setting attribute ${attr}:`, error);
                        }
                    });
                }
                
                // Set required attribute if field is required (only for input elements)
                if (fieldSchema.required && fieldSchema.htmlElement === 'input') {
                    element.required = true;
                }
                
                // Set the content based on element type
                if (fieldSchema.htmlElement === 'label') {
                    // For labels, set textContent instead of value
                    element.textContent = data[column] || '';
                } else {
                    // For inputs, set value and add change listener
                    element.value = data[column] || '';
                    
                    // Add event listener for value changes
                    element.addEventListener('change', (e) => {
                        data[column] = e.target.value;
                    });
                }
                
                cell.appendChild(element);
            } else {
                // Fallback to text content for columns without schema
                cell.textContent = data[column] || '';
                cell.title = data[column] || ''; // Tooltip for full text
            }
            
            row.appendChild(cell);
        });

        return row;
    }

    selectRow(row) {
        // Remove previous selection
        this.container.querySelectorAll('.DataGridRow.selected').forEach(r => {
            r.classList.remove('selected');
        });

        // Add selection to clicked row
        row.classList.add('selected');
        
        const index = parseInt(row.dataset.index);
        const selectedData = this.data[index];
        
        console.log('Row selected:', selectedData);
        this.onRowSelect(selectedData, index);
    }

    onRowSelect(data, index) {
        // Override this method for custom selection handling
        console.log('Selected item:', data);
    }

    handleKeyNavigation(e) {
        const selectedRow = this.container.querySelector('.DataGridRow.selected');
        if (!selectedRow) return;

        const allRows = Array.from(this.container.querySelectorAll('.DataGridRow:not(:first-child)'));
        const currentIndex = allRows.indexOf(selectedRow);

        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    this.selectRow(allRows[currentIndex - 1]);
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < allRows.length - 1) {
                    this.selectRow(allRows[currentIndex + 1]);
                }
                break;
        }
    }

    adjustLayout() {
        // Handle any layout adjustments on resize
        console.log('Layout adjusted for viewport:', window.innerWidth, 'x', window.innerHeight);
    }

    addData(newData) {
        this.data.push(newData);
        this.render();
    }

    removeData(index) {
        if (index >= 0 && index < this.data.length) {
            this.data.splice(index, 1);
            this.render();
        }
    }

    updateData(indexOrData, newData) {
        // Support replacing the entire dataset when an array is provided
        if (Array.isArray(indexOrData)) {
            this.data = indexOrData.map(record => ({ ...record }));
            this.render();
            return;
        }

        const index = indexOrData;

        if (typeof index === 'number' && index >= 0 && index < this.data.length) {
            this.data[index] = { ...this.data[index], ...newData };
            this.render();
        }
    }

    getData() {
        return [...this.data];
    }
}

// Add selection styling
const style = document.createElement('style');
style.textContent = `
    .DataGridRow.selected {
        background-color: #3498db !important;
        color: white;
    }
    
    .DataGridRow.selected:hover {
        background-color: #2980b9 !important;
    }
`;
document.head.appendChild(style);

// Custom HTML Element Support
class DataGridElement extends HTMLElement {
    constructor() {
        super();
        this.dataGrid = null;
    }

    connectedCallback() {
        // Create the basic structure
        this.innerHTML = `
            <div class="DataGrid">
                <div class="DataGridRow">
                    <!-- Headers will be generated dynamically -->
                </div>
            </div>
        `;

        // Get attributes
        const source = this.getAttribute('source');
        const records = this.getAttribute('records');
        
        // Initialize DataGrid
        const options = {};
        if (source) options.source = source;
        if (records) options.records = records;
        
        this.dataGrid = new DataGrid(this.querySelector('.DataGrid'), options);
    }

    disconnectedCallback() {
        if (this.dataGrid) {
            // Cleanup if needed
            this.dataGrid = null;
        }
    }

    // Allow programmatic data updates
    setData(data) {
        if (this.dataGrid) {
            this.dataGrid.loadFromSource(data);
        }
    }

    getData() {
        return this.dataGrid ? this.dataGrid.exportData() : [];
    }
}

// Register the custom element
if (!customElements.get('data-grid')) {
    customElements.define('data-grid', DataGridElement);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataGrid, DataGridElement };
}

// Global access
window.DataGrid = DataGrid;
window.DataGridElement = DataGridElement;