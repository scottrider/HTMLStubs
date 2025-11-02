// Integration example: How to apply EditMechanism to existing PositionsDataGrid
// This demonstrates the loosely coupled design approach

import { EditMechanism, EditMode } from './editmechanism.js';

// Function to apply editing capabilities to any existing grid
export function applyEditMechanism(gridElement: HTMLElement, sourceData: any): EditMechanism {
    
    // Configure the edit mechanism
    const editConfig = {
        targetGrid: gridElement,
        defaultMode: 'readonly' as EditMode,
        
        // Validation callback
        onValidate: (field: string, value: any, schema: any): boolean => {
            if (schema.required && (!value || value.trim() === '')) {
                alert(`${schema.displayName || field} is required`);
                return false;
            }
            return true;
        },
        
        // Save callback
        onRowSave: (rowIndex: number, data: any): void => {
            console.log('Row saved:', { rowIndex, data });
            
            // Update the source data
            if (sourceData && sourceData.positions && sourceData.positions.data[rowIndex]) {
                Object.assign(sourceData.positions.data[rowIndex], data);
            }
            
            // Dispatch event for external handling
            gridElement.dispatchEvent(new CustomEvent('row-data-updated', {
                detail: { rowIndex, data },
                bubbles: true
            }));
        },
        
        // Field edit callback
        onFieldEdit: (field: any): void => {
            console.log('Field being edited:', field);
        }
    };
    
    // Create and configure the edit mechanism
    const editMechanism = new EditMechanism(editConfig);
    
    // Integrate with the grid's data structure
    editMechanism.integratWithGridData(
        // Schema provider
        () => sourceData?.positions?.schema || {},
        
        // Field names provider
        () => {
            if (sourceData?.positions?.schema) {
                return Object.keys(sourceData.positions.schema).filter(fieldName => {
                    const field = sourceData.positions.schema[fieldName];
                    return field.visible !== false;
                });
            }
            return [];
        }
    );
    
    return editMechanism;
}

// Usage example for existing PositionsDataGrid
export function enableEditingOnPositionsGrid(): void {
    // Wait for the grid to be ready
    setTimeout(() => {
        const grid = document.getElementById('testGrid');
        
        if (grid && (window as any).dataGridData) {
            console.log('Applying EditMechanism to existing PositionsDataGrid...');
            
            // Apply the edit mechanism without modifying the grid
            const editMechanism = applyEditMechanism(grid, (window as any).dataGridData);
            
            // Optional: Store reference for external control
            (window as any).gridEditMechanism = editMechanism;
            
            console.log('EditMechanism applied. Use gridEditMechanism.enableEditing() to start editing.');
        }
    }, 200);
}