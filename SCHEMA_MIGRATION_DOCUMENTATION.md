# Schema Migration Strategy - displayType/editType Implementation

## Overview

This document outlines the migration from the legacy `htmlElement`/`htmlType` schema format to the new `displayType`/`editType` format, which provides better separation of concerns between display and edit modes.

## Migration Strategy

### 1. Backward Compatibility

The system maintains full backward compatibility with existing schemas:

- **Legacy Format**: `htmlElement` + `htmlType` + `css`
- **New Format**: `displayType` + `editType` with embedded CSS
- **Mixed Format**: Both can coexist during transition

### 2. Auto-Migration Functions

```javascript
// Converts legacy format on-the-fly
function migrateLegacyFieldConfig(fieldConfig)

// Gets appropriate config for display/edit mode
function getFieldTypeConfig(fieldConfig, mode)
```

### 3. Fallback Logic

- If `displayType` missing → Use `editType`
- If `editType` missing → Use `displayType`
- If both missing → Convert legacy format

## Required Field Logic

### Field-Level Requirements

```javascript
"required": true  // At the field level (recommended)
```

### Type-Level Requirements (Future)

```javascript
"displayType": {
    "type": "input-text",
    "required": false  // Read-only mode requirement
},
"editType": {
    "type": "input-text", 
    "required": true   // Edit mode requirement
}
```

### Validation Functions

```javascript
// Check if field is required in specific mode
isFieldRequired(fieldConfig, mode)

// Get missing required fields for a record
getMissingRequiredFields(record, mode)

// Validate entire record
validateRecord(record, mode)
```

## Validation Rules

### CSS-Based Validation

Validation rules are embedded in the CSS configuration:

```javascript
"css": {
    "minlength": "3",      // Minimum length
    "maxlength": "100",    // Maximum length
    "min": "0",            // Minimum value (numbers/dates)
    "max": "1000",         // Maximum value (numbers/dates)
    "pattern": "^[A-Za-z]+$", // Regex pattern
    "placeholder": "Enter text"
}
```

### Validation Types

1. **Required Fields**: Must have non-empty value
2. **Length Validation**: String min/max length
3. **Range Validation**: Numeric/date min/max values
4. **Pattern Validation**: Regex pattern matching
5. **Type Validation**: Email, URL, telephone format

### Error Handling

```javascript
// Validate single field
const errors = validateFieldValue(fieldName, value, fieldConfig, mode);

// Display errors to user
if (errors.length > 0) {
    alert(`Validation errors:\\n${errors.join('\\n')}`);
}
```

## Element Type Mapping

### Input Elements

| Legacy Format | New Format | Description |
|---------------|------------|-------------|
| `htmlElement: "input"`, `htmlType: "text"` | `type: "input-text"` | Text input |
| `htmlElement: "input"`, `htmlType: "email"` | `type: "input-email"` | Email input |
| `htmlElement: "input"`, `htmlType: "date"` | `type: "input-date"` | Date picker |
| `htmlElement: "input"`, `htmlType: "tel"` | `type: "input-tel"` | Phone input |
| `htmlElement: "input"`, `htmlType: "url"` | `type: "input-url"` | URL input |
| `htmlElement: "input"`, `htmlType: "hidden"` | `type: "input-hidden"` | Hidden input |

### Other Elements

| Legacy Format | New Format | Description |
|---------------|------------|-------------|
| `htmlElement: "select"` | `type: "select"` | Dropdown list |
| `htmlElement: "textarea"` | `type: "textarea"` | Multi-line text |
| `htmlElement: "label"` | `type: "label"` | Read-only label |

## Example Conversions

### Legacy Schema
```javascript
"position": {
    "type": "string",
    "displayName": "Position",
    "htmlElement": "input",
    "htmlType": "text", 
    "css": {
        "placeholder": "Enter position title",
        "maxlength": "100",
        "width": "200px"
    },
    "required": true
}
```

### New Schema
```javascript
"position": {
    "type": "string",
    "displayName": "Position",
    "displayType": {
        "type": "input-text",
        "css": {
            "placeholder": "Enter position title",
            "maxlength": "100", 
            "width": "200px"
        }
    },
    "editType": {
        "type": "input-text",
        "css": {
            "placeholder": "Enter position title",
            "maxlength": "100",
            "width": "200px"
        }
    },
    "required": true
}
```

### Mixed Mode Example (Computed Field)
```javascript
"email": {
    "type": "computed",
    "displayName": "Email",
    "displayType": {
        "type": "label",
        "css": { "width": "200px" }
    },
    "editType": {
        "type": "label", // Still read-only in edit
        "css": { "width": "200px" }
    },
    "computed": true,
    "computedFrom": "contacts.email",
    "computedKey": "contactId"
}
```

## Implementation Status

### ✅ Completed
- [ ] Migration helper functions
- [ ] Backward compatibility layer
- [ ] Field type resolution
- [ ] Validation system
- [ ] Required field logic
- [ ] HTML rendering updates

### 🔄 In Progress
- [ ] Testing and validation
- [ ] Error handling improvements
- [ ] Documentation completion

### 📋 Todo
- [ ] Complete schema conversion for all entities
- [ ] Performance optimization
- [ ] User interface updates
- [ ] Full test coverage

## Testing

Use the `schema-migration-test.html` file to test:

1. **Migration Functions**: Legacy → New format conversion
2. **Validation Rules**: Field validation and error reporting  
3. **Rendering**: HTML generation with new schema

## Benefits

1. **Clear Separation**: Different behavior for display vs edit
2. **Enhanced Control**: Mode-specific CSS and validation
3. **Better UX**: Optimized for each interaction mode
4. **Maintainable**: Cleaner, more explicit configuration
5. **Extensible**: Easy to add new field types and behaviors