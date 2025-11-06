// Form Mock JavaScript - Grid Data Row Management with Pagination
// Core FormMock methods protected for use as foundation for next phase

// Job search data storage
let jobSearchData = null;

// Pagination state
let currentPage = 1;
let totalPages = 1;
let pageSize = 1;
let storedRecords = []; // Array to store saved records for pagination

// Selection state
let selectedRecords = new Set(); // Track selected record indexes
let masterCheckboxState = false;

// Inline editing state
let editingIndex = -1; // Track which row is being edited (-1 = none)
let originalRecordData = null; // Store original data for cancel functionality

// Load job search data from consolidated JSON file
async function loadJobSearchData() {
  try {
    const response = await fetch('./jobsearch.json');
    jobSearchData = await response.json();
    populateCompanyDropdown();
  } catch (error) {
    console.error('Error loading job search data:', error);
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
    console.log('Record updated:', formData);
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
  
  storedRecords.push(formData);
  console.log('Record stored. Total records:', storedRecords.length);
}

// Update pagination display and controls
function updatePagination() {
  totalPages = Math.max(1, Math.ceil(storedRecords.length / pageSize));
  
  // Ensure current page is valid
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  
  updatePaginationControls();
  updateHeaderSummary();
  loadCurrentPageRecord();
  updateMasterCheckboxState();
  
  // Hide pagination controls when no records exist
  const paginationContainer = document.getElementById('paginationControls');
  if (paginationContainer) {
    if (storedRecords.length === 0) {
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
  
  if (storedRecords.length === 0) {
    headerSummary.textContent = 'No records - Click ➕ to add your first record';
  } else {
    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, storedRecords.length);
    headerSummary.textContent = `Showing ${startRecord}-${endRecord} of ${storedRecords.length} records`;
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
  
  if (storedRecords.length === 0) {
    recordsContainer.innerHTML = '<div class="no-records-message">No records found. Click ➕ to add your first record.</div>';
    return;
  }
  
  // Calculate which records to show on current page
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, storedRecords.length);
  const pageRecords = storedRecords.slice(startIndex, endIndex);
  
  // Render each record as a row
  recordsContainer.innerHTML = pageRecords.map((record, index) => {
    const globalIndex = startIndex + index;
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
  
  // Update the stored record
  storedRecords[index] = { ...storedRecords[index], ...formData };
  
  // Clear editing state
  editingIndex = -1;
  originalRecordData = null;
  
  // Re-render to show read-only row
  renderRecordsDisplay();
  updateHeaderSummary();
  
  console.log('Record saved:', storedRecords[index]);
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
    calculatePagination();
    
    // If current page is now empty, go to previous page
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    }
    
    // Re-render
    renderRecordsDisplay();
    updatePaginationControls();
    updateHeaderSummary();
    
    console.log('Record deleted, remaining records:', storedRecords.length);
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
  
  console.log('Selected records:', Array.from(selectedRecords));
}

// Handle master checkbox change
function handleMasterCheckboxChange(checked) {
  masterCheckboxState = checked;
  
  // Calculate visible records on current page
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, storedRecords.length);
  
  if (checked) {
    // Select all visible records on current page
    for (let i = startIndex; i < endIndex; i++) {
      selectedRecords.add(i);
    }
  } else {
    // Deselect all visible records on current page
    for (let i = startIndex; i < endIndex; i++) {
      selectedRecords.delete(i);
    }
  }
  
  renderRecordsDisplay(); // Re-render to update checkboxes
  updateHeaderForSelection();
  
  console.log('Selected records after master change:', Array.from(selectedRecords));
}

// Update master checkbox state based on current page selections
function updateMasterCheckboxState() {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, storedRecords.length);
  
  let allPageRecordsSelected = true;
  let anyPageRecordsSelected = false;
  
  for (let i = startIndex; i < endIndex; i++) {
    if (selectedRecords.has(i)) {
      anyPageRecordsSelected = true;
    } else {
      allPageRecordsSelected = false;
    }
  }
  
  const masterCheckbox = document.getElementById('masterCheckbox');
  if (masterCheckbox) {
    masterCheckbox.checked = allPageRecordsSelected && anyPageRecordsSelected;
    masterCheckbox.indeterminate = anyPageRecordsSelected && !allPageRecordsSelected;
  }
  
  masterCheckboxState = allPageRecordsSelected && anyPageRecordsSelected;
}

// Update header to show selection info or add button
function updateHeaderForSelection() {
  const header = document.querySelector('.formmock-header');
  if (!header) return;
  
  if (selectedRecords.size > 0) {
    // Show delete selected button
    header.innerHTML = `
      <div class="header-info">
        <div class="header-title">Position Records</div>
        <div class="header-summary" id="headerSummary">
          ${selectedRecords.size} record(s) selected
        </div>
      </div>
      <button class="btn-emoji btn-delete-selected" id="deleteSelectedBtn" title="Delete Selected Records">
        ❌
      </button>
    `;
    
    // Attach delete selected event listener
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener('click', handleDeleteSelected);
    }
  } else {
    // Show normal add button and summary
    updateHeaderSummary();
    header.innerHTML = `
      <div class="header-info">
        <div class="header-title">Position Records</div>
        <div class="header-summary" id="headerSummary">
          ${document.getElementById('headerSummary')?.textContent || ''}
        </div>
      </div>
      <button class="btn-emoji btn-add" id="addBtn" title="Add New Record">
        ➕
      </button>
    `;
    
    // Re-attach add button event listener
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function(event) {
        event.preventDefault();
        showRecordForm();
      });
    }
    
    updateHeaderSummary();
  }
}

// Handle delete selected records
function handleDeleteSelected() {
  if (selectedRecords.size === 0) return;
  
  if (confirm(`Delete ${selectedRecords.size} selected record(s)?`)) {
    // Convert to array and sort in descending order to maintain indexes during deletion
    const indexesToDelete = Array.from(selectedRecords).sort((a, b) => b - a);
    
    // Delete records in reverse order
    indexesToDelete.forEach(index => {
      storedRecords.splice(index, 1);
    });
    
    // Clear selection
    selectedRecords.clear();
    masterCheckboxState = false;
    
    // Update pagination and re-render
    updatePagination();
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

// Attach event listeners when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Load job search data first (for company dropdown only)
  loadJobSearchData();
  
  // Initialize pagination display
  updatePagination();
  
  // Add sample data for demonstration (can be removed later)
  addSampleData(); // TEMPORARILY ENABLED - for testing pagination layout
  
  // Ensure form starts in clean state
  clearFormFields();
  hideRecordForm(); // Show title row initially
  
  // Attach add button to show form
  const addBtn = document.querySelector('#addBtn');
  if (addBtn) {
    addBtn.addEventListener('click', function(event) {
      event.preventDefault();
      showRecordForm();
    });
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
    masterCheckbox.addEventListener('change', (e) => {
      handleMasterCheckboxChange(e.target.checked);
    });
  }
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