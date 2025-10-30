# HTML Controls Library - Enterprise Architecture

A comprehensive, enterprise-grade library of HTML controls built with best practices for logging, performance monitoring, accessibility, and maintainability.

## 🏗️ Architecture Overview

### Foundation Components
- **BaseControl**: Foundation class providing lifecycle management, event handling, and accessibility
- **HTMLControlsLogger**: Enterprise logging solution with multiple transports and performance monitoring
- **HTMLControlsLibrary**: Central coordination and management for all controls

### Control Library
- **DataGrid**: Advanced data grid with CRUD operations, filtering, sorting, and pagination
- **FormBuilder**: Dynamic form generation with validation and schema support
- **Modal**: Accessible modal dialogs with flexible content and animations
- **Navigation**: Responsive navigation components with breadcrumbs and menus
- **Notification**: Toast notifications and alert system with auto-dismiss

## 📁 Directory Structure

```
HTMLStubs/
├── lib/                              # Core library components
│   ├── logging.js                    # Enterprise logging solution
│   ├── base-control.js               # Foundation control class
│   └── library-manager.js            # Central control manager
├── controls/                         # Individual controls
│   ├── TemplateControl.js            # Template for new controls
│   ├── DataGrid/                     # Enhanced data grid control
│   │   ├── enhanced-datagrid.js      # Main enhanced implementation
│   │   ├── datagrid.js               # Original implementation
│   │   ├── datagrid.css              # Styling
│   │   ├── datagrid-methods.js       # Utility methods
│   │   ├── positions-data.js         # Sample data
│   │   └── Enhanced-DataGrid-Agent.md # Documentation
│   ├── FormBuilder/                  # Form building control
│   │   └── FormBuilderControl.js     # Main implementation
│   ├── Modal/                        # Modal dialog control
│   │   └── ModalControl.js           # Main implementation
│   ├── Navigation/                   # Navigation control
│   │   └── NavigationControl.js      # Main implementation
│   └── Notification/                 # Notification control
│       └── NotificationControl.js    # Main implementation
└── docs/                             # Documentation
    └── README.md                     # This file
```

## 🚀 Quick Start

### 1. Basic Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Controls Library Demo</title>
    <link rel="stylesheet" href="controls/DataGrid/datagrid.css">
</head>
<body>
    <!-- Load core library -->
    <script src="lib/logging.js"></script>
    <script src="lib/base-control.js"></script>
    <script src="lib/library-manager.js"></script>
    
    <!-- Load specific controls -->
    <script src="controls/DataGrid/enhanced-datagrid.js"></script>
    
    <div id="myDataGrid"></div>
    
    <script>
        // Initialize the library
        const libraryManager = new HTMLControlsLibrary();
        
        // Create a DataGrid
        const dataGrid = new DataGridControl({
            container: '#myDataGrid',
            data: [
                { id: 1, name: 'John Doe', email: 'john@example.com' },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
            ],
            editable: true,
            sortable: true,
            filterable: true
        });
        
        // Initialize and render
        dataGrid.init().render();
    </script>
</body>
</html>
```

### 2. Enterprise Setup with Logging

```javascript
// Configure enterprise logging
const logger = new HTMLControlsLogger({
    level: 'debug',
    transports: [
        new ConsoleTransport({ level: 'info' }),
        new FileTransport({ 
            level: 'error', 
            filename: 'errors.log' 
        }),
        new RemoteTransport({ 
            level: 'warn',
            endpoint: '/api/logs'
        })
    ]
});

// Create library manager with custom logger
const libraryManager = new HTMLControlsLibrary({
    logger: logger,
    performance: true,
    errorHandling: 'graceful'
});

// Register controls
libraryManager.registerControl('DataGrid', DataGridControl);
libraryManager.registerControl('Modal', ModalControl);

// Create controls through manager
const dataGrid = libraryManager.createControl('DataGrid', {
    container: '#enterpriseGrid',
    data: myData,
    autoSave: true,
    validationMode: 'strict'
});
```

## 🎯 Control Usage Examples

### DataGrid Control

```javascript
// Create enhanced DataGrid
const dataGrid = new DataGridControl({
    container: '#dataGrid',
    
    // Data configuration
    data: myData,
    schema: mySchema,
    
    // Feature flags
    editable: true,
    sortable: true,
    filterable: true,
    searchable: true,
    pagination: true,
    
    // Advanced options
    pageSize: 50,
    autoSave: true,
    validationMode: 'realtime',
    dragAndDrop: true,
    
    // Event handlers
    onRecordAdded: (record) => console.log('Record added:', record),
    onRecordUpdated: (record) => console.log('Record updated:', record),
    onError: (error) => console.error('DataGrid error:', error)
});

// Initialize and render
dataGrid.init().render();

// API usage
dataGrid.addRecord({ name: 'New Item', value: 123 });
dataGrid.updateRecord('record_id', { name: 'Updated Item' });
dataGrid.deleteRecord('record_id');
dataGrid.search('search term');
dataGrid.applyFilters([{ field: 'status', operator: 'equals', value: 'active' }]);
```

### Modal Control

```javascript
// Create modal
const modal = new ModalControl({
    container: '#modal',
    title: 'Confirmation',
    content: 'Are you sure you want to proceed?',
    buttons: [
        { text: 'Cancel', action: 'cancel', style: 'secondary' },
        { text: 'Confirm', action: 'confirm', style: 'primary' }
    ],
    closeOnOverlay: true,
    escapeToClose: true
});

// Show modal
modal.show();

// Handle modal events
modal.on('modal:confirmed', () => {
    console.log('User confirmed action');
});
```

### Form Builder Control

```javascript
// Create dynamic form
const formBuilder = new FormBuilderControl({
    container: '#formBuilder',
    schema: {
        fields: [
            { name: 'firstName', type: 'text', required: true, label: 'First Name' },
            { name: 'email', type: 'email', required: true, label: 'Email Address' },
            { name: 'birthDate', type: 'date', label: 'Birth Date' },
            { name: 'newsletter', type: 'checkbox', label: 'Subscribe to newsletter' }
        ]
    },
    validation: 'realtime',
    autoSave: false
});

// Handle form submission
formBuilder.on('form:submitted', (data) => {
    console.log('Form submitted:', data);
});
```

## 🔧 Development Guide

### Creating New Controls

1. **Copy the Template**
   ```bash
   cp controls/TemplateControl.js controls/MyControl/MyControl.js
   ```

2. **Customize the Control**
   ```javascript
   class MyControl extends BaseControl {
       constructor(options = {}) {
           super({
               // Your default options
               customOption: true,
               ...options
           });
           
           // Your control-specific properties
           this.myProperty = null;
       }
       
       // Override required methods
       init() {
           super.init();
           // Your initialization logic
       }
       
       render() {
           super.render();
           // Your rendering logic
       }
   }
   ```

3. **Add Logging**
   ```javascript
   // Use consistent logging throughout
   this.logger.info('Operation started', { id: this.id });
   this.logger.debug('Processing data', { dataCount: items.length });
   this.logger.error('Operation failed', { error: error.message });
   ```

4. **Implement Accessibility**
   ```javascript
   getAriaRole() {
       return 'widget'; // Appropriate ARIA role
   }
   
   getAriaLabel() {
       return 'My custom control';
   }
   
   handleKeyDown(event) {
       // Keyboard navigation logic
   }
   ```

### Best Practices

#### Logging Standards
- **Info**: User actions, state changes, API calls
- **Debug**: Internal operations, data processing, render cycles
- **Warn**: Recoverable errors, deprecated usage, performance issues
- **Error**: Unrecoverable errors, validation failures, exceptions

#### Performance Guidelines
- Use performance timers for long operations
- Minimize DOM manipulation
- Implement virtual scrolling for large datasets
- Cache computed values appropriately

#### Accessibility Requirements
- Provide proper ARIA labels and roles
- Implement keyboard navigation
- Ensure color contrast compliance
- Support screen readers

#### Error Handling
- Wrap operations in try-catch blocks
- Provide meaningful error messages
- Implement graceful degradation
- Log errors with context

## 📊 Performance Monitoring

### Built-in Metrics
All controls automatically track:
- Render times and frequency
- Operation durations
- Memory usage patterns
- Error rates and types

### Performance API
```javascript
// Start performance timer
const timer = control.startPerformanceTimer('operation_name');

// End timer and log results
control.endPerformanceTimer(timer);

// Get performance metrics
const metrics = control.getPerformanceMetrics();
console.log('Average render time:', metrics.averageRenderTime);
```

### Memory Management
```javascript
// Proper cleanup
control.destroy(); // Automatically cleans up:
// - Event listeners
// - DOM references
// - Data arrays
// - Performance timers
```

## 🧪 Testing Strategy

### Unit Testing
```javascript
// Test control creation
describe('MyControl', () => {
    let control;
    
    beforeEach(() => {
        control = new MyControl({
            container: document.createElement('div')
        });
    });
    
    afterEach(() => {
        control.destroy();
    });
    
    it('should initialize correctly', () => {
        control.init();
        expect(control.isInitialized).toBe(true);
    });
    
    it('should render without errors', () => {
        control.init().render();
        expect(control.container.innerHTML).not.toBe('');
    });
});
```

### Integration Testing
```javascript
// Test library manager integration
describe('Library Integration', () => {
    it('should register and create controls', () => {
        const manager = new HTMLControlsLibrary();
        manager.registerControl('MyControl', MyControl);
        
        const control = manager.createControl('MyControl', {
            container: '#test'
        });
        
        expect(control instanceof MyControl).toBe(true);
    });
});
```

## 🔍 Debugging

### Logging Configuration
```javascript
// Enable debug logging for development
const logger = new HTMLControlsLogger({
    level: 'debug',
    transports: [
        new ConsoleTransport({ 
            level: 'debug',
            format: 'detailed'
        })
    ]
});
```

### Common Issues
1. **Control not rendering**: Check container selector and DOM ready state
2. **Events not firing**: Verify event listener setup and element existence
3. **Performance issues**: Check for memory leaks and excessive re-renders
4. **Accessibility problems**: Use browser dev tools to audit ARIA compliance

## 📈 Migration Guide

### From Legacy Controls
1. **Update Dependencies**
   ```html
   <!-- Add library dependencies -->
   <script src="lib/logging.js"></script>
   <script src="lib/base-control.js"></script>
   ```

2. **Update Constructor**
   ```javascript
   // Old way
   const grid = new DataGrid(container, options);
   
   // New way
   const grid = new DataGridControl({
       container: container,
       ...options
   });
   ```

3. **Update Initialization**
   ```javascript
   // Old way
   grid.initialize();
   
   // New way
   grid.init().render();
   ```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Implement changes following patterns
4. Add comprehensive tests
5. Update documentation
6. Submit pull request

### Code Standards
- Use consistent logging levels
- Follow accessibility guidelines
- Implement comprehensive error handling
- Add performance monitoring
- Include unit tests

## 📄 License

This library is provided as-is for educational and development purposes. Please ensure compliance with your organization's licensing requirements before use in production environments.

## 🆘 Support

For issues, questions, or contributions:
1. Check the documentation in the `docs/` directory
2. Review the agent files for specific controls
3. Examine the template control for implementation patterns
4. Use the logging system to debug issues

---

**HTML Controls Library** - Building enterprise-grade web applications with confidence.