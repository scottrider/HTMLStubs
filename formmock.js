// Form Mock JavaScript - Grid Data Row Management with Pagination
// Core FormMock methods protected for use as foundation for next phase

/**
 * Constants and Configuration
 */
const CONFIG = {
    DEFAULT_PAGE_SIZE: 10,
    DEBOUNCE_DELAY: 300,
    MAX_PAGE_SIZE: 100,
    MIN_PAGE_SIZE: 5
};

// Create logger instance
const logger = window.DataGridNamespace?.logger || {
    debug: () => {},
    info: console.info.bind(console, '[FormMock]:'),
    warn: console.warn.bind(console, '[FormMock]:'),
    error: console.error.bind(console, '[FormMock]:')
};

// Job search data storage
let jobSearchData = null;

// Pagination state
let currentPage = 1;
let totalPages = 1;
let pageSize = CONFIG.DEFAULT_PAGE_SIZE;
let storedRecords = []; // Array to store saved records for pagination

// Selection state
let selectedRecords = new Set(); // Track selected record indexes
let masterCheckboxState = false;

// Inline editing state
let editingIndex = -1; // Track which row is being edited (-1 = none)
let originalRecordData = null; // Store original data for cancel functionality

// Toggle state
let viewingEnabled = true; // Track whether viewing enabled (true) or disabled (false) records

/**
 * Apply schema-driven CSS dimensions to DataGrid and row-form elements
 */
function applySchemaCSSDimensions() {
    try {
        if (!jobSearchData?.jobsearch?.positions?.schema) {
            logger.warn('No schema data available for CSS dimensions');
            return;
        }
        
        const schema = jobSearchData.jobsearch.positions.schema;
        
        // Apply to DataGrid
        applyDataGridDimensions(schema);
        
        // Apply to row-form fields
        applyRowFormDimensions(schema);
        
        logger.info('Schema-driven CSS dimensions applied to DataGrid and row-form');
        
    } catch (error) {
        logger.error('Error applying schema CSS dimensions:', error);
    }
}

/**
 * Apply dimensions to DataGrid CSS custom properties
 */
function applyDataGridDimensions(schema) {
    const dataGridElement = document.querySelector('.DataGrid');
    
    if (!dataGridElement) {
        logger.warn('DataGrid element not found for CSS dimension application');
        return;
    }
    
    // Map schema field names to CSS custom property names
    const fieldToCSSMap = {
        'position': '--position',
        'companyId': '--company', 
        'email': '--email',
        'cphone': '--cphone',
        'ophone': '--ophone', 
        'icontact': '--icontact',
        'lcontact': '--lcontact'
    };
    
    // Apply dimensions from schema to CSS custom properties
    Object.entries(schema).forEach(([fieldName, fieldConfig]) => {
        const cssPrefix = fieldToCSSMap[fieldName];
        if (cssPrefix && fieldConfig.css) {
            // Apply width if defined
            if (fieldConfig.css.width) {
                dataGridElement.style.setProperty(
                    `${cssPrefix}-width`, 
                    fieldConfig.css.width
                );
            }
            
            // Apply grid flex if defined
            if (fieldConfig.css.gridFlex) {
                dataGridElement.style.setProperty(
                    `${cssPrefix}-grid-flex`, 
                    fieldConfig.css.gridFlex
                );
            }
            
            // Apply height if defined (for future use)
            if (fieldConfig.css.height) {
                dataGridElement.style.setProperty(
                    `${cssPrefix}-height`, 
                    fieldConfig.css.height
                );
            }
            
            // Apply min/max dimensions if defined
            if (fieldConfig.css.minWidth) {
                dataGridElement.style.setProperty(
                    `${cssPrefix}-min-width`, 
                    fieldConfig.css.minWidth
                );
            }
            
            if (fieldConfig.css.maxWidth) {
                dataGridElement.style.setProperty(
                    `${cssPrefix}-max-width`, 
                    fieldConfig.css.maxWidth
                );
            }
        }
    });
    
    logger.debug('DataGrid dimensions applied from schema');
}

/**
 * Apply dimensions to row-form field elements
 */
function applyRowFormDimensions(schema) {
    const rowFormElement = document.querySelector('.row-form');
    
    if (!rowFormElement) {
        logger.debug('Row-form element not found for CSS dimension application');
        return;
    }
    
    // Apply dimensions to individual form fields based on schema
    Object.entries(schema).forEach(([fieldName, fieldConfig]) => {
        if (fieldConfig.css) {
            // Find form elements with data-field attribute matching the field name
            const fieldElements = rowFormElement.querySelectorAll(`[data-field="${fieldName}"]`);
            
            fieldElements.forEach(element => {
                // Apply width if defined
                if (fieldConfig.css.width) {
                    element.style.width = fieldConfig.css.width;
                }
                
                // Apply height if defined
                if (fieldConfig.css.height) {
                    element.style.height = fieldConfig.css.height;
                }
                
                // Apply min/max dimensions if defined
                if (fieldConfig.css.minWidth) {
                    element.style.minWidth = fieldConfig.css.minWidth;
                }
                
                if (fieldConfig.css.maxWidth) {
                    element.style.maxWidth = fieldConfig.css.maxWidth;
                }
                
                if (fieldConfig.css.minHeight) {
                    element.style.minHeight = fieldConfig.css.minHeight;
                }
                
                if (fieldConfig.css.maxHeight) {
                    element.style.maxHeight = fieldConfig.css.maxHeight;
                }
            });
        }
    });
    
    logger.debug('Row-form field dimensions applied from schema');
}

/**
 * Refresh all schema-driven CSS dimensions (can be called when schema changes)
 */
function refreshSchemaCSSDimensions() {
    applySchemaCSSDimensions();
    logger.info('Schema CSS dimensions refreshed');
}

/**
 * Get schema field CSS properties for a specific field
 */
function getFieldCSSDimensions(fieldName, entityType = 'positions') {
    try {
        const schema = jobSearchData?.jobsearch?.[entityType]?.schema;
        if (!schema || !schema[fieldName]) {
            return null;
        }
        
        return schema[fieldName].css || {};
    } catch (error) {
        logger.error(`Error getting CSS dimensions for field ${fieldName}:`, error);
        return null;
    }
}

// Load job search data from consolidated JSON file
async function loadJobSearchData() {
  try {
    const response = await fetch('./jobsearch.json');
    jobSearchData = await response.json();
    populateCompanyDropdown();
    
    // Apply schema-driven CSS dimensions
    applySchemaCSSDimensions();
    
    // Load position records into storedRecords
    if (jobSearchData?.jobsearch?.positions?.data) {
      storedRecords = [...jobSearchData.jobsearch.positions.data];
      // Add ID and isDisabled field to each record if not present
      storedRecords.forEach((record, index) => {
        if (!record.id) {
          record.id = index + 1;
        }
        if (record.isDisabled === undefined) {
          record.isDisabled = false; // Default to enabled
        }
      });
      logger.info('Position records loaded:', storedRecords.length);
      updatePagination();
      renderRecordsDisplay();
    }
  } catch (error) {
    logger.error('Error loading job search data:', error);
    // Fallback to hardcoded options if file load fails
  }
}

// Populate company dropdown with data from jobsearch.json
function populateCompanyDropdown() {
  const companySelect = document.querySelector('select[data-field="companyId"]');
  if (companySelect && jobSearchData?.jobsearch?.companies?.data) {
    // Clear existing options except the first (placeholder)
    while (companySelect.children.length > 1) {
      companySelect.removeChild(companySelect.lastChild);
    }
    
    // Add options from companies data
    jobSearchData.jobsearch.companies.data.forEach(company => {
      const option = document.createElement('option');
      option.value = company.id;
      option.textContent = company.name;
      companySelect.appendChild(option);
    });
  }
}

// Get company name by ID for display purposes
function getCompanyNameById(companyId) {
  if (!jobSearchData?.jobsearch?.companies?.data) return 'Unknown Company';
  const company = jobSearchData.jobsearch.companies.data.find(c => c.id === parseInt(companyId));
  return company ? company.name : 'Unknown Company';
}

// Get filtered records based on current view mode
function getFilteredRecords() {
  return storedRecords.filter(record => {
    if (viewingEnabled) {
      return !record.isDisabled; // Show only enabled records
    } else {
      return record.isDisabled; // Show only disabled records
    }
  });
}

// Get filtered record by index (accounting for filtering)
function getFilteredRecordIndex(filteredIndex) {
  const filteredRecords = getFilteredRecords();
  const targetRecord = filteredRecords[filteredIndex];
  return storedRecords.findIndex(record => record.id === targetRecord.id);
}

// Clear method for datagrid-checkbox - clears all row-form children values
function clearRowForm() {
  const checkbox = document.querySelector('input[name="datagrid-checkbox"]');
  if (checkbox && checkbox.checked) {
    const rowForm = checkbox.closest('.row-form');
    if (rowForm) {
      // Clear all input fields
      rowForm.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"]').forEach(input => {
        input.value = '';
      });
      
      // Reset select fields to first option
      rowForm.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
      });
      
      // Clear label displays
      rowForm.querySelectorAll('.field-label-display').forEach(label => {
        label.textContent = '';
      });
      
      // Uncheck the checkbox after clearing
      checkbox.checked = false;
    }
  }
}

// Save method for gathering form data and converting to JSON
function saveFormData() {
  const rowForm = document.querySelector('.row-form');
  if (!rowForm) {
    alert('Form not found');
    return;
  }

  const formData = {};
  
  // Gather data from all fields with data-field attributes
  rowForm.querySelectorAll('[data-field]').forEach(element => {
    const fieldName = element.getAttribute('data-field');
    let value = '';
    
    // Check for data-value attribute first (preferred for labels/displays)
    if (element.hasAttribute('data-value')) {
      value = element.getAttribute('data-value');
    } else if (element.tagName === 'INPUT') {
      value = element.value;
    } else if (element.tagName === 'SELECT') {
      value = element.value;
    } else if (element.classList.contains('field-label-display')) {
      value = element.textContent;
    }
    
    // Trim whitespace from all values
    formData[fieldName] = value.trim();
  });
  
  // Add timestamp
  formData.timestamp = new Date().toISOString();
  
  // Check if we're editing an existing record
  if (typeof window.editingRecordIndex !== 'undefined' && window.editingRecordIndex >= 0) {
    // Update existing record
    storedRecords[window.editingRecordIndex] = formData;
    window.editingRecordIndex = undefined; // Clear editing flag
    logger.debug('Record updated:', formData);
  } else {
    // Store new record for pagination
    storeRecord(formData);
    
    // Navigate to the last page to show the new record
    const newTotalPages = Math.ceil(storedRecords.length / pageSize);
    currentPage = newTotalPages; // Go to last page where new record is
  }
  
  // Clear the form after successful save
  clearFormAfterSave(rowForm);
  
  // Hide the form after save
  hideRecordForm();
  
  // Update pagination display
  updatePagination();
  
  return formData;
}

// Store saved record for pagination
function storeRecord(formData) {
  // Add unique ID and timestamp if not present
  if (!formData.id) {
    formData.id = Date.now();
  }
  if (!formData.timestamp) {
    formData.timestamp = new Date().toISOString();
  }
  // Add isDisabled field for new records (default to false = enabled)
  if (formData.isDisabled === undefined) {
    formData.isDisabled = false;
  }
  
  storedRecords.push(formData);
  logger.info('Record stored. Total records:', storedRecords.length);
}

// Update pagination display and controls
function updatePagination() {
  // Use search results if searching, otherwise use filtered records for display logic
  const displayRecords = currentSearchTerm 
    ? filteredSearchRecords 
    : getFilteredRecords();
  
  totalPages = Math.max(1, Math.ceil(displayRecords.length / pageSize));
  
  // Ensure current page is valid
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  
  updatePaginationControls();
  updateHeaderSummary();
  loadCurrentPageRecord();
  updateMasterCheckboxState();
  updateGridVisibility();
  
  // Hide pagination controls when no display records exist
  const paginationContainer = document.getElementById('paginationControls');
  if (paginationContainer) {
    if (displayRecords.length === 0) {
      paginationContainer.style.display = 'none';
    } else {
      paginationContainer.style.display = 'flex';
    }
  }
}

// Update pagination controls
function updatePaginationControls() {
  const paginationContainer = document.getElementById('paginationControls');
  if (!paginationContainer) return;
  
  // Update page size select
  const pageSizeSelect = document.getElementById('pageSizeSelect');
  if (pageSizeSelect) {
    pageSizeSelect.value = pageSize;
  }
  
  // Update navigation buttons
  const firstBtn = document.getElementById('firstBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const lastBtn = document.getElementById('lastBtn');
  
  if (firstBtn) firstBtn.disabled = (currentPage === 1);
  if (prevBtn) prevBtn.disabled = (currentPage === 1);
  if (nextBtn) nextBtn.disabled = (currentPage === totalPages);
  if (lastBtn) lastBtn.disabled = (currentPage === totalPages);
  
  // Update page info
  const pageInfo = document.getElementById('pageInfo');
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }
  
  // Update page number buttons
  updatePageNumberButtons();
}

// Update page number buttons
function updatePageNumberButtons() {
  const paginationContainer = document.getElementById('paginationControls');
  if (!paginationContainer) return;
  
  // Remove existing page number buttons
  const existingPageBtns = paginationContainer.querySelectorAll('[data-page]');
  existingPageBtns.forEach(btn => btn.remove());
  
  // Add new page number buttons
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  // Find insertion point (after prevBtn)
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
    pageBtn.setAttribute('data-page', i);
    pageBtn.textContent = i;
    
    // Add click event listener
    pageBtn.addEventListener('click', () => goToPage(i));
    
    // Insert before nextBtn
    paginationContainer.insertBefore(pageBtn, nextBtn);
  }
}

// Update header summary
function updateHeaderSummary() {
  const headerSummary = document.getElementById('headerSummary');
  if (!headerSummary) return;
  
  // Use search results if searching, otherwise use filtered records for summary
  const displayRecords = currentSearchTerm 
    ? filteredSearchRecords 
    : getFilteredRecords();
  const viewType = viewingEnabled ? 'enabled' : 'disabled';
  const searchInfo = currentSearchTerm ? ` matching "${currentSearchTerm}"` : '';
  
  if (displayRecords.length === 0) {
    if (currentSearchTerm) {
      headerSummary.textContent = `No ${viewType} records found matching "${currentSearchTerm}"`;
    } else {
      headerSummary.textContent = `No ${viewType} records - Click ➕ to add your first record`;
    }
  } else {
    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, displayRecords.length);
    headerSummary.textContent = `Showing ${startRecord}-${endRecord} of ${displayRecords.length} ${viewType} records${searchInfo}`;
  }
}

// Load record for current page
function loadCurrentPageRecord() {
  renderRecordsDisplay();
}

// Render all records in the display area
function renderRecordsDisplay() {
  const recordsContainer = document.getElementById('recordsDisplay');
  if (!recordsContainer) return;
  
  // Determine which records to display (search results or normal filtered records)
  const displayRecords = currentSearchTerm 
    ? filteredSearchRecords 
    : getFilteredRecords();
  const viewType = viewingEnabled ? 'enabled' : 'disabled'; 
  
  // Handle no records cases
  if (currentSearchTerm && filteredSearchRecords.length === 0) {
    recordsContainer.innerHTML = `<div class="no-records-message">No ${viewType} records found matching "${currentSearchTerm}".</div>`;
    return;
  }
  
  if (displayRecords.length === 0) {
    recordsContainer.innerHTML = `<div class="no-records-message">No ${viewType} records found.</div>`;
    return;
  }
  
  // Calculate which records to show on current page
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, displayRecords.length);
  const pageRecords = displayRecords.slice(startIndex, endIndex);
  
  // Render each record as a row
  recordsContainer.innerHTML = pageRecords.map((record, index) => {
    const filteredIndex = startIndex + index;
    // For search results, find the original global index
    const globalIndex = currentSearchTerm
      ? storedRecords.findIndex(r => r.id === record.id)
      : getFilteredRecordIndex(filteredIndex);
    return createRecordRowHTML(record, globalIndex);
  }).join('');
  
  // Attach event listeners to record action buttons
  attachRecordActionListeners();
}

// Create HTML for a single record row
function createRecordRowHTML(record, index) {
  const companyName = getCompanyNameById(record.companyId) || record.companyId || 'Unknown Company';
  const isSelected = selectedRecords.has(index);
  const isEditing = editingIndex === index;
  
  if (isEditing) {
    // Render editable row
    return createEditableRecordRowHTML(record, index, isSelected);
  } else {
    // Render read-only row
    return createReadOnlyRecordRowHTML(record, index, isSelected, companyName);
  }
}

// Create HTML for read-only record row
function createReadOnlyRecordRowHTML(record, index, isSelected, companyName) {
  return `
    <div class="record-row ${isSelected ? 'selected' : ''}" data-record-index="${index}">
      <div class="record-actions">
        <input type="checkbox" class="record-checkbox" 
               data-index="${index}" 
               ${isSelected ? 'checked' : ''} 
               title="Select record" />
        <button class="btn-emoji btn-edit" data-action="edit" data-index="${index}" title="Edit">✏️</button>
      </div>
      
      <div class="record-field field-position">
        ${record.position || ''}
      </div>
      
      <div class="record-field field-icontact">
        ${record.icontact || ''}
      </div>
      
      <div class="record-field field-lcontact">
        ${record.lcontact || ''}
      </div>
      
      <div class="record-field field-company">
        ${companyName}
      </div>
      
      <div class="record-field field-email">
        ${record.email || ''}
      </div>
      
      <div class="record-field field-cphone">
        ${record.cphone || ''}
      </div>
      
      <div class="record-field field-ophone">
        ${record.ophone || ''}
      </div>
    </div>
  `;
}

// Create HTML for editable record row
function createEditableRecordRowHTML(record, index, isSelected) {
  return `
    <div class="record-row editing ${isSelected ? 'selected' : ''}" data-record-index="${index}">
      <div class="record-actions">
        <input type="checkbox" class="record-checkbox" 
               data-index="${index}" 
               ${isSelected ? 'checked' : ''} 
               title="Select record" />
        <button class="btn-emoji btn-save" data-action="save" data-index="${index}" title="Save">💾</button>
        <button class="btn-emoji btn-cancel" data-action="cancel" data-index="${index}" title="Cancel">❌</button>
      </div>
      
      <div class="record-field field-position">
        <input type="text" class="field-input" value="${record.position || ''}" data-field="position" placeholder="Position">
      </div>
      
      <div class="record-field field-icontact">
        <input type="date" class="field-input" value="${record.icontact || ''}" data-field="icontact">
      </div>
      
      <div class="record-field field-lcontact">
        <input type="date" class="field-input" value="${record.lcontact || ''}" data-field="lcontact">
      </div>
      
      <div class="record-field field-company">
        <select class="field-select" data-field="companyId">
          <option value="">Select Company...</option>
          ${createCompanyOptions(record.companyId)}
        </select>
      </div>
      
      <div class="record-field field-email">
        <input type="email" class="field-input" value="${record.email || ''}" data-field="email" placeholder="Email">
      </div>
      
      <div class="record-field field-cphone">
        <input type="tel" class="field-input" value="${record.cphone || ''}" data-field="cphone" placeholder="(555) 123-4567">
      </div>
      
      <div class="record-field field-ophone">
        <input type="tel" class="field-input" value="${record.ophone || ''}" data-field="ophone" placeholder="(555) 123-4567">
      </div>
    </div>
  `;
}

// Create company options HTML for dropdown
function createCompanyOptions(selectedCompanyId) {
  if (!jobSearchData?.jobsearch?.companies?.data) return '';
  
  return jobSearchData.jobsearch.companies.data.map(company => 
    `<option value="${company.id}" ${company.id == selectedCompanyId ? 'selected' : ''}>${company.name}</option>`
  ).join('');
}

// Attach event listeners to record action buttons
function attachRecordActionListeners() {
  const recordsContainer = document.getElementById('recordsDisplay');
  if (!recordsContainer) return;
  
  // Record checkboxes
  const checkboxes = recordsContainer.querySelectorAll('.record-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index);
      handleRecordCheckboxChange(index, e.target.checked);
    });
  });

  // Edit buttons
  const editButtons = recordsContainer.querySelectorAll('[data-action="edit"]');
  editButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      startInlineEdit(index);
    });
  });

  // Save buttons
  const saveButtons = recordsContainer.querySelectorAll('[data-action="save"]');
  saveButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      saveInlineEdit(index);
    });
  });

  // Cancel buttons
  const cancelButtons = recordsContainer.querySelectorAll('[data-action="cancel"]');
  cancelButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      cancelInlineEdit(index);
    });
  });
}// Edit a record by populating the form
function editRecord(index) {
  if (index >= 0 && index < storedRecords.length) {
    const record = storedRecords[index];
    populateFormWithRecord(record);
    showRecordForm();
    
    // Store the index being edited for save operation
    window.editingRecordIndex = index;
  }
}

// Start inline editing for a specific record
function startInlineEdit(index) {
  // Cancel any existing edit
  if (editingIndex !== -1) {
    cancelInlineEdit(editingIndex);
  }
  
  // Store original data for cancel functionality
  originalRecordData = { ...storedRecords[index] };
  
  // Set editing state
  editingIndex = index;
  
  // Re-render to show editable row
  renderRecordsDisplay();
}

// Save inline edit changes
function saveInlineEdit(index) {
  const recordRow = document.querySelector(`[data-record-index="${index}"]`);
  if (!recordRow) return;
  
  // Gather form data from the editable row
  const formData = {};
  recordRow.querySelectorAll('[data-field]').forEach(element => {
    const fieldName = element.getAttribute('data-field');
    let value = '';
    
    if (element.tagName === 'INPUT') {
      value = element.value;
    } else if (element.tagName === 'SELECT') {
      value = element.value;
    }
    
    formData[fieldName] = value;
  });
  
  // Validate required fields (position is required)
  if (!formData.position || formData.position.trim() === '') {
    alert('Position is required');
    return;
  }
  
  // Update the stored record (preserve isDisabled state)
  const currentIsDisabled = storedRecords[index].isDisabled;
  storedRecords[index] = { ...storedRecords[index], ...formData };
  storedRecords[index].isDisabled = currentIsDisabled; // Preserve the disabled state
  
  // Clear editing state
  editingIndex = -1;
  originalRecordData = null;
  
  // Re-render to show read-only row
  renderRecordsDisplay();
  updateHeaderSummary();
  
  logger.debug('Record saved:', storedRecords[index]);
}

// Cancel inline edit
function cancelInlineEdit(index) {
  // Restore original data if it was modified
  if (originalRecordData) {
    storedRecords[index] = { ...originalRecordData };
  }
  
  // Clear editing state
  editingIndex = -1;
  originalRecordData = null;
  
  // Re-render to show read-only row
  renderRecordsDisplay();
}

// Delete a record
function deleteRecord(index) {
  if (confirm('Are you sure you want to delete this record?')) {
    // Remove from stored records
    storedRecords.splice(index, 1);
    
    // Update selection set (shift indexes down for records after deleted one)
    const newSelectedRecords = new Set();
    selectedRecords.forEach(selectedIndex => {
      if (selectedIndex < index) {
        newSelectedRecords.add(selectedIndex);
      } else if (selectedIndex > index) {
        newSelectedRecords.add(selectedIndex - 1);
      }
      // Skip the deleted index
    });
    selectedRecords = newSelectedRecords;
    
    // Clear editing state if we were editing the deleted record
    if (editingIndex === index) {
      editingIndex = -1;
      originalRecordData = null;
    } else if (editingIndex > index) {
      editingIndex = editingIndex - 1; // Shift down
    }
    
    // Recalculate pagination
    totalPages = Math.max(1, Math.ceil(storedRecords.length / pageSize));
    
    // If current page is now empty, go to previous page
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    }
    
    // Re-render
    renderRecordsDisplay();
    updatePaginationControls();
    updateHeaderSummary();
    
    logger.info('Record deleted, remaining records:', storedRecords.length);
  }
}

// Cancel editing operation
function cancelEdit() {
  // Clear editing flag
  window.editingRecordIndex = undefined;
  
  // Clear and hide form
  clearFormFields();
  hideRecordForm();
}

// Handle individual record checkbox change
function handleRecordCheckboxChange(index, checked) {
  if (checked) {
    selectedRecords.add(index);
  } else {
    selectedRecords.delete(index);
  }
  
  updateMasterCheckboxState();
  updateHeaderForSelection();
  
  logger.debug('Selected records:', Array.from(selectedRecords));
}

// Handle master checkbox change
function handleMasterCheckboxChange(checked) {
  logger.debug('Master checkbox changed:', checked);
  masterCheckboxState = checked;
  
  // Get the currently displayed records (filtered by toggle state and search)
  const displayRecords = currentSearchTerm 
    ? filteredSearchRecords 
    : getFilteredRecords();
  
  // Calculate visible records on current page
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, displayRecords.length);
  const pageRecords = displayRecords.slice(startIndex, endIndex);
  
  logger.debug('Page records for master checkbox:', pageRecords.length, pageRecords);
  
  if (checked) {
    // Select all visible records on current page
    pageRecords.forEach((record) => {
      const globalIndex = storedRecords.findIndex(r => r.id === record.id);
      if (globalIndex >= 0) {
        selectedRecords.add(globalIndex);
        logger.debug('Selected record:', globalIndex, record);
      }
    });
  } else {
    // Deselect all visible records on current page
    pageRecords.forEach((record) => {
      const globalIndex = storedRecords.findIndex(r => r.id === record.id);
      if (globalIndex >= 0) {
        selectedRecords.delete(globalIndex);
        logger.debug('Deselected record:', globalIndex, record);
      }
    });
  }
  
  renderRecordsDisplay(); // Re-render to update checkboxes
  updateHeaderForSelection();
  
  logger.debug('Selected records after master change:', Array.from(selectedRecords));
}

// Update master checkbox state based on current page selections
function updateMasterCheckboxState() {
  // Get the currently displayed records (filtered by toggle state and search)
  const displayRecords = currentSearchTerm 
    ? filteredSearchRecords 
    : getFilteredRecords();
  
  // Calculate visible records on current page
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, displayRecords.length);
  const pageRecords = displayRecords.slice(startIndex, endIndex);
  
  let allPageRecordsSelected = true;
  let anyPageRecordsSelected = false;
  
  // Check if any records exist on this page
  if (pageRecords.length === 0) {
    allPageRecordsSelected = false;
    anyPageRecordsSelected = false;
  } else {
    // Check each record on the current page
    pageRecords.forEach((record) => {
      const globalIndex = storedRecords.findIndex(r => r.id === record.id);
      if (globalIndex >= 0 && selectedRecords.has(globalIndex)) {
        anyPageRecordsSelected = true;
      } else {
        allPageRecordsSelected = false;
      }
    });
  }
  
  const masterCheckbox = document.getElementById('masterCheckbox');
  if (masterCheckbox) {
    // Set checked state: all records on page must be selected
    masterCheckbox.checked = allPageRecordsSelected && anyPageRecordsSelected;
    // Set indeterminate state: some but not all records are selected
    masterCheckbox.indeterminate = anyPageRecordsSelected && !allPageRecordsSelected;
  }
  
  masterCheckboxState = allPageRecordsSelected && anyPageRecordsSelected;
  
  logger.debug('Master checkbox state updated:', { 
    allSelected: allPageRecordsSelected, 
    anySelected: anyPageRecordsSelected,
    checked: masterCheckboxState,
    pageRecordsCount: pageRecords.length 
  });
}

// Update header to show selection info or add button
function updateHeaderForSelection() {
  const headerInfo = document.querySelector('.header-info');
  const headerControls = document.querySelector('.header-controls');
  if (!headerInfo || !headerControls) return;
  
  if (selectedRecords.size > 0) {
    // Update header info for selection
    headerInfo.innerHTML = `
      <div class="header-title">Position Records</div>
      <div class="header-summary" id="headerSummary">
        ${selectedRecords.size} record(s) selected
      </div>
    `;
    
    // Preserve all existing header control elements
    const hcLeft = headerControls.querySelector('#hc-left');
    const hcRight = headerControls.querySelector('#hc-right');
    const hcLeftHTML = hcLeft ? hcLeft.outerHTML : '';
    const hcRightHTML = hcRight ? hcRight.outerHTML : '';
    
    // Show appropriate action button based on toggle state
    const actionButtonHTML = viewingEnabled 
      ? '<button class="btn-emoji btn-delete-selected" id="actionBtn" title="Delete Selected Records">❌</button>'
      : '<button class="btn-emoji btn-restore-selected" id="actionBtn" title="Restore Selected Records">♻️</button>';
    
    headerControls.innerHTML = `
      ${hcLeftHTML}
      <div id="hc-middle">
        ${actionButtonHTML}
      </div>
      ${hcRightHTML}
    `;
    
    // Attach appropriate event listener based on toggle state
    const actionBtn = document.getElementById('actionBtn');
    if (actionBtn) {
      if (viewingEnabled) {
        actionBtn.addEventListener('click', handleDeleteSelected);
      } else {
        actionBtn.addEventListener('click', handleRestoreSelected);
      }
    }
    
    // Re-initialize toggle after DOM update
    initializeToggle();
    
    // Re-initialize DataGridSearch if it exists
    if (window.formMockSearch && typeof window.formMockSearch.destroy === 'function') {
      try {
        window.formMockSearch.destroy();
      } catch (error) {
        logger.warn('Error destroying DataGridSearch:', error);
      }
      window.formMockSearch = null;
    }
    
    const searchElement = document.querySelector('#formmock-search');
    if (searchElement) {
      try {
        window.formMockSearch = new DataGridSearch('#formmock-search', {
          debounceDelay: 300,
          placeholder: 'Search positions...',
          onSearch: function(searchTerm, instance) {
            if (typeof window.performGlobalSearch === 'function') {
              window.performGlobalSearch(searchTerm);
            }
          },
          onClear: function(instance) {
            if (typeof window.clearSearch === 'function') {
              window.clearSearch();
            }
          }
        });
      } catch (error) {
        console.error('Error creating DataGridSearch:', error);
        window.formMockSearch = null;
      }
    }
    
  } else {
    // Update header info for normal state
    updateHeaderSummary();
    headerInfo.innerHTML = `
      <div class="header-title">Position Records</div>
      <div class="header-summary" id="headerSummary">
        ${document.getElementById('headerSummary')?.textContent || ''}
      </div>
    `;
    
    // Preserve all existing header control elements
    const hcLeft = headerControls.querySelector('#hc-left');
    const hcRight = headerControls.querySelector('#hc-right');
    const hcLeftHTML = hcLeft ? hcLeft.outerHTML : '';
    const hcRightHTML = hcRight ? hcRight.outerHTML : '';
    
    headerControls.innerHTML = `
      ${hcLeftHTML}
      <div id="hc-middle">
        ${createToggleAwareButton()}
      </div>
      ${hcRightHTML}
    `;
    
    // Re-initialize toggle and DataGridSearch
    initializeToggle();
    
    // Re-initialize DataGridSearch if it exists (disabled view)
    if (window.formMockSearch && typeof window.formMockSearch.destroy === 'function') {
      try {
        window.formMockSearch.destroy();
      } catch (error) {
        logger.warn('Error destroying DataGridSearch:', error);
      }
      window.formMockSearch = null;
    }
    
    const searchElement = document.querySelector('#formmock-search');
    if (searchElement) {
      try {
        window.formMockSearch = new DataGridSearch('#formmock-search', {
          debounceDelay: 300,
          placeholder: 'Search positions...',
          onSearch: function(searchTerm, instance) {
            if (typeof window.performGlobalSearch === 'function') {
              window.performGlobalSearch(searchTerm);
            }
          },
          onClear: function(instance) {
            if (typeof window.clearSearch === 'function') {
              window.clearSearch();
            }
          }
        });
      } catch (error) {
        console.error('Error creating DataGridSearch:', error);
        window.formMockSearch = null;
      }
    }
    
    // Re-attach add/restore button event listener
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
      addBtn.addEventListener('click', handleAddRestoreButtonClick);
    }
    
    updateHeaderSummary();
  }
}

// Handle restore selected records (set isDisabled=false)
function handleRestoreSelected() {
  if (selectedRecords.size === 0) {
    // If no records selected, restore all disabled records on current page
    const displayRecords = currentSearchTerm 
      ? filteredSearchRecords 
      : getFilteredRecords();
    
    if (displayRecords.length === 0) {
      alert('No disabled records to restore');
      return;
    }
    
    if (confirm(`Restore all ${displayRecords.length} disabled record(s) on this page?`)) {
      displayRecords.forEach(record => {
        const actualIndex = storedRecords.findIndex(r => r.id === record.id);
        if (actualIndex >= 0) {
          storedRecords[actualIndex].isDisabled = false;
        }
      });
      
      // Immediately update display to remove restored records from disabled view
      // This provides instant visual feedback - records disappear from current view
      updatePagination();
      renderRecordsDisplay();
      updateHeaderForSelection();
      
      // Check if current page is now empty and adjust pagination
      const newDisplayRecords = currentSearchTerm 
        ? filteredSearchRecords 
        : getFilteredRecords();
      
      const totalPages = Math.max(1, Math.ceil(newDisplayRecords.length / pageSize));
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
        updatePagination();
        renderRecordsDisplay();
      }
      
      // Show success notification
      showTransferNotification(`${displayRecords.length} record(s) restored and moved to Enabled view`, 'success');
      
      logger.info('All disabled records on page restored and removed from disabled view');
    }
    return;
  }
  
  if (confirm(`Restore ${selectedRecords.size} selected record(s)?`)) {
    // Use the global indices directly from selectedRecords (same as handleDeleteSelected)
    selectedRecords.forEach(globalIndex => {
      if (globalIndex >= 0 && globalIndex < storedRecords.length) {
        storedRecords[globalIndex].isDisabled = false;
      }
    });
    
    // Clear selection
    selectedRecords.clear();
    masterCheckboxState = false;
    
    // Immediately update display to remove restored records from disabled view
    // This provides instant visual feedback - records disappear from current view
    updatePagination();
    renderRecordsDisplay();
    updateHeaderForSelection();
    
    // Check if current page is now empty and adjust pagination
    const displayRecords = currentSearchTerm 
      ? filteredSearchRecords 
      : getFilteredRecords();
    
    const totalPages = Math.max(1, Math.ceil(displayRecords.length / pageSize));
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
      updatePagination();
      renderRecordsDisplay();
    }
    
    // Show success notification
    const restoredCount = selectedRecords.size;
    showTransferNotification(`${restoredCount} record(s) restored and moved to Enabled view`, 'success');
    
    logger.info('Selected records restored and removed from disabled view');
  }
}

// Handle delete selected records (soft delete by setting isDisabled=true)
function handleDeleteSelected() {
  if (selectedRecords.size === 0) return;
  
  const deletedCount = selectedRecords.size; // Capture count before clearing
  
  if (confirm(`Delete ${deletedCount} selected record(s)?`)) {
    // Use the global indices directly from selectedRecords
    selectedRecords.forEach(globalIndex => {
      if (globalIndex >= 0 && globalIndex < storedRecords.length) {
        storedRecords[globalIndex].isDisabled = true;
      }
    });
    
    // Clear selection
    selectedRecords.clear();
    masterCheckboxState = false;
    
    // Immediately update display to remove deleted records from enabled view
    // This provides instant visual feedback - records disappear from current view
    updatePagination();
    renderRecordsDisplay();
    updateHeaderForSelection();
    
    // Check if current page is now empty and adjust pagination
    const displayRecords = currentSearchTerm 
      ? filteredSearchRecords 
      : getFilteredRecords();
    
    const totalPages = Math.max(1, Math.ceil(displayRecords.length / pageSize));
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
      updatePagination();
      renderRecordsDisplay();
    }
    
    // Show success notification
    showTransferNotification(`${deletedCount} record(s) deleted and moved to Disabled view`, 'warning');
    
    logger.info(`Selected records soft deleted and removed from enabled view`);
  }
}

// Enhanced showRecordForm for new record entry
function showRecordForm() {
  const rowForm = document.getElementById('rowForm');
  const rowTitle = document.getElementById('rowTitle');
  
  if (rowForm) {
    rowForm.style.display = 'flex';
    
    // Enable all form inputs for editing
    const inputs = rowForm.querySelectorAll('input, select');
    inputs.forEach(input => {
      if (input.type !== 'checkbox' && input.id !== 'recordCheckbox') {
        input.readOnly = false;
        input.style.backgroundColor = '';
        input.style.cursor = '';
      }
    });
    
    // Clear editing flag if this is a new record (not an edit)
    if (typeof window.editingRecordIndex === 'undefined') {
      clearFormFields();
    }
  }
  if (rowTitle) {
    rowTitle.style.display = 'none';
  }
}

// Populate form fields with record data
function populateFormWithRecord(record) {
  const rowForm = document.querySelector('.row-form');
  if (!rowForm) return;
  
  // Populate form fields
  Object.keys(record).forEach(fieldName => {
    const element = rowForm.querySelector(`[data-field="${fieldName}"]`);
    if (element && record[fieldName] !== undefined) {
      if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
        element.value = record[fieldName];
      } else if (element.classList.contains('field-label-display')) {
        element.textContent = record[fieldName];
        element.setAttribute('data-value', record[fieldName]);
      }
    }
  });
}

// Clear all form fields
function clearFormFields() {
  const rowForm = document.querySelector('.row-form');
  if (!rowForm) return;
  
  // Clear all input fields
  rowForm.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"]').forEach(input => {
    input.value = '';
  });
  
  // Reset select fields to first option
  rowForm.querySelectorAll('select').forEach(select => {
    select.selectedIndex = 0;
  });
  
  // Clear label displays
  rowForm.querySelectorAll('.field-label-display').forEach(label => {
    label.textContent = '';
    label.removeAttribute('data-value');
  });
}

// Navigation functions
function goToPage(page) {
  if (page >= 1 && page <= totalPages && page !== currentPage) {
    currentPage = page;
    updatePagination();
  }
}

function goToFirstPage() {
  goToPage(1);
}

function goToPreviousPage() {
  goToPage(currentPage - 1);
}

function goToNextPage() {
  goToPage(currentPage + 1);
}

function goToLastPage() {
  goToPage(totalPages);
}

function changePageSize(newPageSize) {
  pageSize = parseInt(newPageSize);
  currentPage = 1; // Reset to first page
  updatePagination();
}

// Helper function to clear form after save (similar to clearRowForm but without checkbox requirement)
function clearFormAfterSave(rowForm) {
  // Clear all input fields
  rowForm.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"]').forEach(input => {
    input.value = '';
  });
  
  // Reset select fields to first option
  rowForm.querySelectorAll('select').forEach(select => {
    select.selectedIndex = 0;
  });
  
  // Clear label displays
  rowForm.querySelectorAll('.field-label-display').forEach(label => {
    label.textContent = '';
    // Also clear data-value attribute if it exists
    if (label.hasAttribute('data-value')) {
      label.removeAttribute('data-value');
    }
  });
}

// Toggle view between enabled/disabled records (isolated to recordsDisplay only)
function toggleView(showEnabled) {
  viewingEnabled = showEnabled;
  const enableToggle = document.getElementById('enableToggle');
  
  // Update toggle checkbox state to match the view
  if (enableToggle) {
    enableToggle.checked = showEnabled;
  }
  
  // Update UI elements based on toggle state
  updateToggleBasedUI();
  
  // If there's an active search, re-execute it with the new toggle state
  if (currentSearchTerm) {
    window.performGlobalSearch(currentSearchTerm);
  } else {
    // ISOLATED: Only update recordsDisplay and related grid visibility
    updateGridVisibility();
    renderRecordsDisplay();
    updatePagination();
  }
  
  console.log(`Switched to viewing ${showEnabled ? 'enabled' : 'disabled'} records - recordsDisplay only`);
}

// Update UI elements based on current toggle state
function updateToggleBasedUI() {
  // Update toggle label text
  const toggleLabel = document.querySelector('.toggle-label');
  if (toggleLabel) {
    toggleLabel.textContent = viewingEnabled ? 'Enabled' : 'Disabled';
  }
  
  // Update add/restore button
  const addBtn = document.getElementById('addBtn');
  if (addBtn) {
    if (viewingEnabled) {
      // Show add button for enabled view
      addBtn.innerHTML = '➕';
      addBtn.title = 'Add New Record';
      addBtn.className = 'btn-emoji btn-add';
    } else {
      // Show restore button for disabled view
      addBtn.innerHTML = '♻️';
      addBtn.title = 'Restore Selected Records';
      addBtn.className = 'btn-emoji btn-restore';
    }
  }
}

// Create toggle-aware button HTML
function createToggleAwareButton() {
  if (viewingEnabled) {
    return `<button class="btn-emoji btn-add" id="addBtn" title="Add New Record">➕</button>`;
  } else {
    return `<button class="btn-emoji btn-restore" id="addBtn" title="Restore Selected Records">♻️</button>`;
  }
}

// Handle add/restore button click based on current toggle state
function handleAddRestoreButtonClick(event) {
  event.preventDefault();
  
  if (viewingEnabled) {
    // In enabled view: show add new record form
    showRecordForm();
  } else {
    // In disabled view: restore all visible records on current page
    const displayRecords = currentSearchTerm 
      ? filteredSearchRecords 
      : getFilteredRecords();
    
    if (displayRecords.length === 0) {
      alert('No disabled records to restore');
      return;
    }
    
    // Calculate current page records
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, displayRecords.length);
    const pageRecords = displayRecords.slice(startIndex, endIndex);
    
    if (confirm(`Restore all ${pageRecords.length} disabled record(s) on this page?`)) {
      pageRecords.forEach(record => {
        const actualIndex = storedRecords.findIndex(r => r.id === record.id);
        if (actualIndex >= 0) {
          storedRecords[actualIndex].isDisabled = false;
        }
      });
      
      // Immediately update display to remove restored records from disabled view
      // This provides instant visual feedback - records disappear from current view
      updatePagination();
      renderRecordsDisplay();
      
      // Check if current page is now empty and adjust pagination
      const newDisplayRecords = currentSearchTerm 
        ? filteredSearchRecords 
        : getFilteredRecords();
      
      const totalPages = Math.max(1, Math.ceil(newDisplayRecords.length / pageSize));
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
        updatePagination();
        renderRecordsDisplay();
      }
      
      // Show success notification
      showTransferNotification(`${pageRecords.length} record(s) restored and moved to Enabled view`, 'success');
      
      console.log(`All ${pageRecords.length} disabled records on page restored and removed from disabled view`);
    }
  }
}

// Show transfer notification with fade-out effect
function showTransferNotification(message, type = 'info') {
  // Remove any existing notifications
  const existingNotification = document.querySelector('.transfer-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `transfer-notification transfer-notification--${type}`;
  notification.textContent = message;
  
  // Style the notification
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '6px',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
    zIndex: '9999',
    opacity: '0',
    transform: 'translateX(100%)',
    transition: 'all 0.3s ease',
    maxWidth: '350px',
    wordWrap: 'break-word'
  });
  
  // Set background color based on type
  if (type === 'success') {
    notification.style.background = '#28a745';
  } else if (type === 'warning') {
    notification.style.background = '#ffc107';
    notification.style.color = '#212529';
  } else {
    notification.style.background = '#17a2b8';
  }
  
  // Add to page
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Animate out and remove
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Control grid visibility based on filtered records
function updateGridVisibility() {
  const recordForm = document.getElementById('recordForm');
  // Consider search results when determining grid visibility
  const displayRecords = currentSearchTerm 
    ? filteredSearchRecords 
    : getFilteredRecords();
  
  if (recordForm) {
    if (displayRecords.length === 0) {
      // Hide entire grid structure when no display records
      recordForm.style.display = 'none';
    } else {
      // Show grid structure when there are display records
      recordForm.style.display = 'block';
      // Ensure row title is visible (not in edit mode)
      const rowForm = document.getElementById('rowForm');
      const rowTitle = document.getElementById('rowTitle');
      if (rowForm) rowForm.style.display = 'none';
      if (rowTitle) rowTitle.style.display = 'flex';
    }
  }
}

// Handle toggle switch change
function handleToggleChange(event) {
  const checked = event.target.checked;
  console.log(`Toggle changed: checked=${checked}, viewingEnabled=${viewingEnabled}`);
  toggleView(checked);
}

// Hide the record form and show the title row
function hideRecordForm() {
  const rowForm = document.getElementById('rowForm');
  const rowTitle = document.getElementById('rowTitle');
  
  if (rowForm) {
    rowForm.style.display = 'none';
  }
  if (rowTitle) {
    rowTitle.style.display = 'flex';
  }
}

// Properly initialize toggle with correct state and event handling
function initializeToggle() {
  const enableToggle = document.getElementById('enableToggle');
  if (!enableToggle) return;
  
  // Remove any existing event listeners to prevent duplicates
  enableToggle.removeEventListener('change', handleToggleChange);
  
  // Set correct initial state
  enableToggle.checked = viewingEnabled;
  
  // Add fresh event listener
  enableToggle.addEventListener('change', handleToggleChange);
  
  // Ensure visibility
  initializeToggleVisibility();
  
  // Update UI elements based on current toggle state
  updateToggleBasedUI();
  
  console.log(`Toggle initialized: checked=${enableToggle.checked}, viewingEnabled=${viewingEnabled}`);
}

// Initialize toggle visibility function
function initializeToggleVisibility() {
  const toggleContainer = document.querySelector('.toggle-container');
  const toggleSwitch = document.querySelector('.toggle-switch');
  const toggleLabel = document.querySelector('.toggle-label');
  const headerControls = document.querySelector('.header-controls');
  
  if (toggleContainer) {
    toggleContainer.style.display = 'flex';
    toggleContainer.style.visibility = 'visible';
    toggleContainer.style.opacity = '1';
  }
  
  if (toggleSwitch) {
    toggleSwitch.style.display = 'inline-block';
    toggleSwitch.style.visibility = 'visible';
    toggleSwitch.style.opacity = '1';
  }
  
  if (toggleLabel) {
    toggleLabel.style.display = 'inline-block';
    toggleLabel.style.visibility = 'visible';
    toggleLabel.style.opacity = '1';
  }
  
  if (headerControls) {
    headerControls.style.display = 'flex';
    headerControls.style.visibility = 'visible';
    headerControls.style.opacity = '1';
  }
}

// Attach event listeners when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Ensure toggle is visible immediately
  initializeToggleVisibility();
  
  // Load job search data and position records
  loadJobSearchData();
  
  // Initialize pagination display
  updatePagination();
  
  // Sample data disabled - now loading from jobsearch.json
  // addSampleData(); // DISABLED - using real data from JSON file
  
  // Ensure form starts in clean state
  clearFormFields();
  hideRecordForm(); // Show title row initially
  
  // Attach add/restore button to handle both functions based on toggle state
  const addBtn = document.querySelector('#addBtn');
  if (addBtn) {
    addBtn.addEventListener('click', handleAddRestoreButtonClick);
  }
  
  // Attach save method to save button
  const saveBtn = document.querySelector('#saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function(event) {
      event.preventDefault(); // Prevent form submission
      saveFormData();
    });
  }
  
  // Attach cancel method to cancel button
  const cancelBtn = document.querySelector('#cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function(event) {
      event.preventDefault();
      cancelEdit();
    });
  }
  
  // Attach pagination event listeners
  attachPaginationListeners();
  
  // Attach master checkbox event listener
  const masterCheckbox = document.getElementById('masterCheckbox');
  if (masterCheckbox) {
    console.log('Master checkbox found and event listener being attached');
    masterCheckbox.addEventListener('change', (e) => {
      console.log('Master checkbox event fired:', e.target.checked);
      handleMasterCheckboxChange(e.target.checked);
    });
  } else {
    console.log('Master checkbox not found during initialization');
  }
  
  // Initialize toggle switch with proper state management
  initializeToggle();
  
  // Backup visibility enforcement after a short delay
  setTimeout(() => {
    initializeToggle();
  }, 100);
});

// Add sample data for demonstration
// TEMPORARILY ENABLED - Use only when testing pagination
function addSampleData() {
  const sampleRecords = [
    {
      id: 1,
      position: "Senior Software Engineer",
      companyId: "1",
      email: "careers@techcorp.com",
      cphone: "(555) 123-4567",
      ophone: "(555) 123-4568",
      icontact: "2024-01-15",
      lcontact: "2024-03-01",
      timestamp: "2024-01-15T10:00:00.000Z"
    },
    {
      id: 2,
      position: "Product Manager", 
      companyId: "2",
      email: "hr@innovatesoft.com",
      cphone: "(555) 234-5678",
      ophone: "(555) 234-5679",
      icontact: "2024-02-01",
      lcontact: "2024-02-28",
      timestamp: "2024-02-01T10:00:00.000Z"
    },
    {
      id: 3,
      position: "UX Designer",
      companyId: "6",
      email: "jobs@designworks.com", 
      cphone: "(555) 345-6789",
      ophone: "(555) 345-6790",
      icontact: "2024-01-20",
      lcontact: "2024-03-05",
      timestamp: "2024-01-20T10:00:00.000Z"
    }
  ];
  
  storedRecords.push(...sampleRecords);
  console.log('Sample data added. Total records:', storedRecords.length);
  updatePagination();
}

// Attach pagination event listeners
function attachPaginationListeners() {
  // Page size selector
  const pageSizeSelect = document.getElementById('pageSizeSelect');
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', function(event) {
      changePageSize(event.target.value);
    });
  }
  
  // Navigation buttons
  const firstBtn = document.getElementById('firstBtn');
  if (firstBtn) {
    firstBtn.addEventListener('click', goToFirstPage);
  }
  
  const prevBtn = document.getElementById('prevBtn');
  if (prevBtn) {
    prevBtn.addEventListener('click', goToPreviousPage);
  }
  
  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', goToNextPage);
  }
  
  const lastBtn = document.getElementById('lastBtn');
  if (lastBtn) {
    lastBtn.addEventListener('click', goToLastPage);
  }
}

// Global search variables
let currentSearchTerm = '';
let filteredSearchRecords = [];

// Global search function for DataGridSearch integration
window.performGlobalSearch = function(searchTerm) {
  currentSearchTerm = searchTerm.toLowerCase().trim();
  console.log('Search for:', searchTerm);
  
  if (!currentSearchTerm) {
    // Clear search - show all filtered records based on toggle state
    filteredSearchRecords = [];
    currentPage = 1;
    renderRecordsDisplay();
    updatePagination();
    return;
  }
  
  // Get the base filtered records (based on toggle state)
  const baseRecords = getFilteredRecords();
  
  // Further filter by search term
  filteredSearchRecords = baseRecords.filter(record => {
    const matches = (
      (record.position && record.position.toLowerCase().includes(currentSearchTerm)) ||
      (record.email && record.email.toLowerCase().includes(currentSearchTerm)) ||
      (record.cphone && record.cphone.toLowerCase().includes(currentSearchTerm)) ||
      (record.ophone && record.ophone.toLowerCase().includes(currentSearchTerm)) ||
      (record.icontact && record.icontact.toLowerCase().includes(currentSearchTerm)) ||
      (record.lcontact && record.lcontact.toLowerCase().includes(currentSearchTerm)) ||
      (getCompanyNameById(record.companyId) && getCompanyNameById(record.companyId).toLowerCase().includes(currentSearchTerm))
    );
    return matches;
  });
  
  console.log(`Found ${filteredSearchRecords.length} matches for "${searchTerm}"`);
  
  // Reset to first page and update display
  currentPage = 1;
  renderRecordsDisplay();
  updatePagination();
};

// Global clear search function for DataGridSearch integration  
window.clearSearch = function() {
  console.log('Clearing global search');
  currentSearchTerm = '';
  filteredSearchRecords = [];
  currentPage = 1;
  renderRecordsDisplay();
  updatePagination();
};

/**
 * Get filtered records based on current toggle state
 * Returns all available records filtered by enabled/disabled state
 */
function getFilteredRecords() {
  try {
    // Return stored records if available
    if (storedRecords && storedRecords.length > 0) {
      return viewingEnabled 
        ? storedRecords.filter(record => !record.isDisabled)
        : storedRecords.filter(record => record.isDisabled);
    }
    
    // Fallback to jobSearchData if available
    if (jobSearchData?.jobsearch?.positions?.data) {
      const allRecords = jobSearchData.jobsearch.positions.data;
      return viewingEnabled 
        ? allRecords.filter(record => !record.isDisabled)
        : allRecords.filter(record => record.isDisabled);
    }
    
    // Return empty array if no data available
    return [];
  } catch (error) {
    logger.error('Error getting filtered records:', error);
    return [];
  }
}

/**
 * Get company name by ID (helper function for search)
 */
function getCompanyNameById(companyId) {
  try {
    if (jobSearchData?.jobsearch?.companies?.data) {
      const company = jobSearchData.jobsearch.companies.data.find(c => c.id === companyId);
      return company ? company.name : '';
    }
    return '';
  } catch (error) {
    logger.error('Error getting company name:', error);
    return '';
  }
}

/**
 * Apply search functionality (alias for compatibility)
 * Expected by test framework
 */
function applySearch(searchTerm) {
  if (typeof window.applyGlobalSearch === 'function') {
    window.applyGlobalSearch(searchTerm);
  } else {
    logger.warn('Global search function not available');
  }
}

/**
 * Filter records based on search criteria (alias for compatibility)
 * Expected by test framework
 */
function filterRecords(searchTerm) {
  try {
    if (!searchTerm || searchTerm.trim() === '') {
      return getFilteredRecords(); // Return all filtered records if no search term
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const baseRecords = getFilteredRecords();
    
    return baseRecords.filter(record => {
      const matches = (
        (record.position && record.position.toLowerCase().includes(lowerSearchTerm)) ||
        (record.email && record.email.toLowerCase().includes(lowerSearchTerm)) ||
        (record.cphone && record.cphone.toLowerCase().includes(lowerSearchTerm)) ||
        (record.ophone && record.ophone.toLowerCase().includes(lowerSearchTerm)) ||
        (record.icontact && record.icontact.toLowerCase().includes(lowerSearchTerm)) ||
        (record.lcontact && record.lcontact.toLowerCase().includes(lowerSearchTerm)) ||
        (getCompanyNameById(record.companyId) && getCompanyNameById(record.companyId).toLowerCase().includes(lowerSearchTerm))
      );
      return matches;
    });
  } catch (error) {
    logger.error('Error filtering records:', error);
    return [];
  }
}

/**
 * Clear search filters (alias for compatibility)
 * Expected by test framework
 */
function clearSearchFilter() {
  if (typeof window.clearSearch === 'function') {
    window.clearSearch();
  } else {
    logger.warn('Clear search function not available');
  }
}

// Make functions globally available for test framework
window.applySearch = applySearch;
window.filterRecords = filterRecords;
window.clearSearchFilter = clearSearchFilter;