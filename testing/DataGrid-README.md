# DataGrid Component Usage Guide

The DataGrid component can be used in multiple ways to fit different development patterns and preferences.

## Installation

Include the required files in your HTML:

```html
<link rel="stylesheet" href="datagrid.css">
<script src="positions-data.js"></script> <!-- Optional: for default data -->
<script src="datagrid.js"></script>
```

## Usage Methods

### Method 1: Custom HTML Element

Use as a custom HTML element with attributes:

```html
<data-grid source="dataGridData" records="data"></data-grid>
```

**Attributes:**
- `source`: Name of global variable containing data
- `records`: Alternative attribute name for data source

### Method 2: Traditional JavaScript Constructor

```javascript
// Basic usage with default data
const grid = new DataGrid('#container');

// With selector string
const grid = new DataGrid('#myGrid');

// With DOM element
const element = document.getElementById('myGrid');
const grid = new DataGrid(element);
```

### Method 3: Constructor with Options Object

```javascript
const grid = new DataGrid({
    container: '#myGrid',
    source: myDataObject
});

// Or with records
const grid = new DataGrid({
    container: '#myGrid',
    records: myDataArray
});
```

### Method 4: Programmatic Data Loading

```javascript
const grid = new DataGrid('#container');

// Load different data later
grid.loadFromSource(newDataObject);
```

## Data Format Options

### Standard Format (Recommended)

```javascript
const data = {
    positions: {
        schema: {
            fieldName: {
                type: 'string|email|phone|date|number',
                displayName: 'Display Name',
                htmlElement: 'input|label',
                htmlType: 'text|email|tel|date|number',
                css: { /* HTML attributes */ },
                required: true|false
            }
        },
        data: [
            { fieldName: 'value', ... },
            // ... more records
        ]
    }
};
```

### Simple Format

```javascript
const data = {
    schema: { /* schema definition */ },
    data: [ /* array of records */ ]
};
```

### Array Only (Auto-generates schema)

```javascript
const data = [
    { name: 'John', age: 30 },
    { name: 'Jane', age: 25 }
];
```

## Schema Field Types

- **string**: Text input with optional placeholder and maxlength
- **email**: Email input with validation pattern
- **phone**: Tel input with phone number pattern
- **date**: Date input with min/max constraints
- **number**: Number input with min/max constraints

## HTML Element Types

- **input**: Creates interactive form inputs
- **label**: Creates read-only display labels

## Examples

See `DataGrid-Examples.html` for working examples of all usage methods.

## API Methods

### DataGrid Instance Methods

- `loadFromSource(data)`: Load data from object or variable
- `render()`: Re-render the grid
- `exportData()`: Get current data as array
- `selectRow(row)`: Programmatically select a row

### Custom Element Methods

- `setData(data)`: Update data programmatically
- `getData()`: Get current data

## Browser Compatibility

- Modern browsers with ES6 support
- Custom Elements v1 support for `<data-grid>` element
- No external dependencies required