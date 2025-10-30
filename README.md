# Standalone DataGrid Component

A full-viewport DataGrid component with nowrap text handling and responsive design.

## Features

✅ **Full Viewport Display** - Takes up entire browser window  
✅ **No Text Wrapping** - All content uses `white-space: nowrap`  
✅ **Responsive Design** - Adapts to different screen sizes  
✅ **Interactive Selection** - Click to select rows  
✅ **Keyboard Navigation** - Arrow keys for row navigation  
✅ **Sticky Header** - Header row stays visible when scrolling  
✅ **Hover Effects** - Visual feedback on row interactions  

## Files

- `DataGrid.html` - Main HTML structure
- `datagrid.css` - Complete styling for full viewport layout
- `datagrid.js` - JavaScript functionality and data management

## Usage

Simply open `DataGrid.html` in a web browser. The DataGrid will:

1. Fill the entire viewport (100vh × 100vw)
2. Display sample data with proper nowrap formatting
3. Allow row selection and keyboard navigation
4. Maintain responsive behavior on mobile devices

## CSS Classes

- `.DataGrid` - Main container (flexbox, full viewport)
- `.DataGridRow` - Row container (flex, nowrap)
- `.DataGridCellColumn` - Cell container (flex: 1, nowrap, ellipsis)

## JavaScript API

```javascript
// Access the global instance
window.dataGrid

// Add new data
dataGrid.addData({
    position: 'New Role',
    company: 'New Company',
    email: 'new@email.com',
    phone: '(555) 000-0000',
    status: 'Active'
});

// Get current data
const data = dataGrid.getData();

// Update existing data
dataGrid.updateData(0, { status: 'Updated' });

// Remove data
dataGrid.removeData(0);
```

## Responsive Breakpoints

- **Desktop**: Full padding and font sizes
- **Tablet** (≤768px): Reduced padding, 14px font
- **Mobile** (≤480px): Minimal padding, 12px font

## Browser Support

- Modern browsers with flexbox support
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## No Dependencies

This is a standalone component with no external dependencies. All CSS and JavaScript is self-contained.