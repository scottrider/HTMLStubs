# Schema-Driven CSS Dimensions Implementation

## Overview
Migrated hardcoded width and height values from CSS files to JSON schema definitions, enabling dynamic control of DataGrid and form field dimensions through schema configuration.

## Schema Structure

### Enhanced CSS Properties in Schema
Each field in the schema can now include dimensional information in the `css` object:

```json
{
  "fieldName": {
    "type": "string",
    "displayName": "Field Display Name",
    "htmlElement": "input",
    "htmlType": "text",
    "css": {
      "placeholder": "placeholder text",
      "width": "200px",           // Field width
      "height": "40px",          // Field height (for textareas, etc.)
      "minWidth": "150px",       // Minimum width
      "maxWidth": "300px",       // Maximum width
      "minHeight": "30px",       // Minimum height
      "maxHeight": "100px",      // Maximum height
      "gridFlex": "2fr"          // DataGrid flex value
    },
    "required": true
  }
}
```

### Supported CSS Properties
- **width**: Sets element width
- **height**: Sets element height (useful for textareas)
- **minWidth/maxWidth**: Responsive width constraints
- **minHeight/maxHeight**: Responsive height constraints
- **gridFlex**: CSS Grid flex value for DataGrid columns

## Implementation Details

### 1. DataGrid CSS Custom Properties
The `datagrid.css` file now uses CSS custom properties that are dynamically set from schema:

```css
.DataGrid {
  /* Schema-driven custom properties */
  --position-width: 200px;
  --position-grid-flex: 2fr;
  --company-width: 150px;
  --company-grid-flex: 1.5fr;
  /* ... */
}

.DataGridRow {
  grid-template-columns: 
    minmax(var(--position-width), var(--position-grid-flex))
    minmax(var(--company-width), var(--company-grid-flex))
    /* ... */;
}
```

### 2. JavaScript Functions

#### `applySchemaCSSDimensions()`
Main function that applies dimensions from schema to both DataGrid and row-form elements.

#### `applyDataGridDimensions(schema)`
Applies dimensions specifically to DataGrid CSS custom properties.

#### `applyRowFormDimensions(schema)`
Applies dimensions to individual form field elements with `data-field` attributes.

#### `refreshSchemaCSSDimensions()`
Utility function to refresh all dimensions (useful when schema changes).

#### `getFieldCSSDimensions(fieldName, entityType)`
Gets CSS properties for a specific field from the schema.

### 3. Integration Points

#### Data Loading
Dimensions are applied automatically when `loadJobSearchData()` loads the JSON schema:

```javascript
async function loadJobSearchData() {
  // ... load data
  applySchemaCSSDimensions(); // Apply dimensions from schema
  // ... rest of loading
}
```

## Current Schema Mappings

### Positions Schema
- **position**: 200px width, 2fr grid flex
- **companyId**: 150px width, 1.5fr grid flex  
- **email**: 200px width, 2fr grid flex
- **cphone**: 120px width, 1fr grid flex
- **ophone**: 120px width, 1fr grid flex
- **icontact**: 140px width, 1.2fr grid flex
- **lcontact**: 140px width, 1.2fr grid flex

### Companies Schema
- **name**: 200px width, 150px min-width
- **industry**: 180px width, 120px min-width
- **size**: 160px width, 140px min-width
- **location**: 180px width, 120px min-width
- **website**: 220px width, 160px min-width
- **notes**: 300px width × 80px height, with minimums

## Benefits

1. **Centralized Configuration**: All dimensional information is now in the schema
2. **Dynamic Updates**: Dimensions can be changed without CSS modifications
3. **Consistency**: Both DataGrid and form fields use the same dimensional rules
4. **Maintainability**: Single source of truth for field dimensions
5. **Flexibility**: Easy to add new dimensional properties as needed

## Usage Examples

### Changing Field Width
```json
{
  "email": {
    "css": {
      "width": "250px",    // Changed from 200px
      "gridFlex": "2.5fr"  // Changed from 2fr
    }
  }
}
```

### Adding Height to Text Fields
```json
{
  "notes": {
    "css": {
      "height": "120px",     // Increased height
      "minHeight": "80px"    // Set minimum
    }
  }
}
```

## Files Modified

1. **jobsearch.json**: Enhanced schema with CSS dimensional properties
2. **datagrid.css**: Converted to CSS custom properties
3. **formmock.js**: Added dimension application functions
4. **SCHEMA_CSS_MIGRATION.md**: This documentation file

## Future Enhancements

- Support for responsive breakpoints in schema
- Font size and typography dimensions
- Border and spacing dimensional controls
- Validation for CSS unit values
- Schema editor UI for visual dimension adjustment