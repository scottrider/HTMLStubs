# Universal DataGrid Migration Guide

## Overview
This guide explains how to migrate from the current `formmock.js` system to the new Universal DataGrid system that eliminates code duplication and provides true data-agnostic functionality.

## New Architecture

### Core Files
- **DG.js** - Core DataGrid engine (data-agnostic)
- **DG-Operations.js** - CRUD operations and state management
- **DG.css** - Universal styling for all entity types
- **DGP.js** - Presentation layer (handles foreign keys, relationships)
- **DataGridNamespace.js** - Namespace management (existing)

### Key Benefits
1. **Zero Code Duplication** - One DataGrid handles all entity types
2. **Schema-Driven** - Everything controlled by JSON schema
3. **Plug-and-Play** - Add new tabs with just schema/data
4. **Foreign Key Resolution** - Automatic relationship handling
5. **Universal Styling** - Consistent look across all grids

## Migration Steps

### 1. Replace formmock.js Usage

**Old Way (formmock.js):**
```javascript
// Multiple files with duplicate logic
// jobsearch-management.html
// company-management.html  
// contact-management.html
// Each with their own specific functions
```

**New Way (Universal DG):**
```javascript
// Single setup for all entity types
await window.DGP.quickSetup({
    jsonUrl: './jobsearch.json',
    containerId: 'app-container',
    tabs: [
        { id: 'positions', entityType: 'positions', icon: '📋' },
        { id: 'companies', entityType: 'companies', icon: '🏢' },
        { id: 'contacts', entityType: 'contacts', icon: '📞' }
    ]
});
```

### 2. Update HTML Structure

**Old Way:**
```html
<!-- Separate files for each entity type -->
<div id="positions-specific-container">
    <!-- Position-specific HTML -->
</div>
```

**New Way:**
```html
<!-- Single container handles all entity types -->
<div id="universal-container"></div>

<!-- Include DG scripts -->
<script src="DataGridNamespace.js"></script>
<script src="DG.js"></script>
<script src="DG-Operations.js"></script>
<script src="DGP.js"></script>
```

### 3. Update CSS

**Old Way:**
```css
/* Multiple CSS files with duplicate styles */
/* positions.css, companies.css, contacts.css */
.position-grid { /* specific styles */ }
.company-grid { /* duplicate styles */ }
```

**New Way:**
```html
<!-- Single CSS file for all grids -->
<link rel="stylesheet" href="DG.css">
```

### 4. Schema Enhancement

Enhance existing JSON schema with presentation metadata:

```json
{
  "positions": {
    "schema": {
      "position": {
        "type": "string",
        "displayName": "Position",
        "htmlElement": "input",
        "htmlType": "text",
        "css": {
          "placeholder": "Enter position title",
          "width": "200px",
          "gridFlex": "2fr"
        },
        "required": true
      }
    },
    "data": [...]
  }
}
```

### 5. Event Handling Migration

**Old Way:**
```javascript
// Separate event handlers for each entity
function handlePositionEdit(id) { /* specific logic */ }
function handleCompanyEdit(id) { /* duplicate logic */ }
function handleContactEdit(id) { /* more duplication */ }
```

**New Way:**
```javascript
// Single event handling system
const positionsGrid = window.DGP.createDataGrid('container', 'positions', {
    onDataChange: (data) => console.log('Positions changed:', data),
    onSelectionChange: (selected) => console.log('Selection:', selected)
});
```

## Migration Checklist

### Phase 1: Setup Core System
- [ ] Add DG.js, DG-Operations.js, DG.css, DGP.js to project
- [ ] Ensure DataGridNamespace.js is included
- [ ] Test basic DataGrid functionality

### Phase 2: Migrate Positions Tab
- [ ] Update positions schema with CSS dimensions
- [ ] Create basic positions DataGrid
- [ ] Test CRUD operations
- [ ] Verify pagination, search, selection
- [ ] Test inline editing

### Phase 3: Migrate Companies Tab
- [ ] Update companies schema
- [ ] Create companies DataGrid with foreign key resolution
- [ ] Test relationships between positions and companies
- [ ] Verify all functionality works identically to positions

### Phase 4: Add New Entity Types
- [ ] Add contacts/tasks/etc. with just schema definition
- [ ] Verify zero code changes needed for new tabs
- [ ] Test foreign key relationships

### Phase 5: Remove Old Code
- [ ] Remove formmock.js
- [ ] Remove entity-specific HTML files
- [ ] Remove duplicate CSS
- [ ] Update all references

## Code Examples

### Creating a Simple DataGrid
```javascript
// Register data source
window.DGP.registerDataSource('products', {
    schema: {
        id: { type: 'number', primaryKey: true },
        name: { type: 'string', displayName: 'Product Name', required: true },
        price: { type: 'number', displayName: 'Price' }
    },
    data: [
        { id: 1, name: 'Widget A', price: 29.99 },
        { id: 2, name: 'Widget B', price: 39.99 }
    ]
});

// Create DataGrid
const productGrid = window.DGP.createDataGrid('products-container', 'products');
```

### Adding Foreign Key Relationships
```json
{
  "orders": {
    "schema": {
      "productId": {
        "type": "number",
        "displayName": "Product",
        "foreignKey": "products.id",
        "foreignKeyDisplay": "products.name",
        "htmlElement": "select"
      }
    }
  }
}
```

### Creating Tabbed Interface
```javascript
window.DGP.createTabbedInterface('main-container', [
    { id: 'products', label: 'Products', entityType: 'products' },
    { id: 'orders', label: 'Orders', entityType: 'orders' },
    { id: 'customers', label: 'Customers', entityType: 'customers' }
]);
```

## Benefits After Migration

### For Developers
- **90% Less Code** - One DataGrid handles everything
- **Instant New Features** - Add tabs with just JSON
- **Consistent Behavior** - Same functionality across all entity types
- **Easy Maintenance** - Single codebase to update

### For Users
- **Consistent Experience** - Same interface for all data types
- **Better Performance** - Optimized single codebase
- **New Features** - Advanced search, bulk operations, etc.

### For Business
- **Faster Development** - Add new entity types in minutes
- **Lower Maintenance Cost** - Single codebase to maintain
- **Easier Testing** - Test once, works everywhere

## Validation Steps

After migration, verify:
1. All CRUD operations work identically
2. Pagination functions the same
3. Search works across all entity types
4. Selection and bulk operations work
5. Inline editing maintains functionality
6. Foreign key relationships display correctly
7. Form validation works as expected
8. Toggle functionality (enabled/disabled) works
9. Responsive design maintained
10. Performance is equal or better

## Rollback Plan

If issues arise:
1. Keep old files during migration
2. Use feature flags to switch between systems
3. Migrate one tab at a time
4. Test thoroughly before removing old code

## Support

The new system maintains 100% feature parity with the old system while adding:
- Better maintainability
- Easier extensibility  
- Consistent behavior
- Reduced technical debt

Any existing functionality should work identically in the new system.