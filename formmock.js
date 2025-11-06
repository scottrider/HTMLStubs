// Form Mock JavaScript - Grid Data Row Management
// Core FormMock methods protected for use as foundation for next phase

// Job search data storage
let jobSearchData = null;

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
  
  // Convert to JSON and display in alert
  const jsonData = JSON.stringify(formData, null, 2);
  alert('Form Data (JSON):\n\n' + jsonData);
  
  // Clear the form after successful save
  clearFormAfterSave(rowForm);
  
  // Hide the form after save
  hideRecordForm();
  
  return formData;
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

// Show the record form and hide the title row
function showRecordForm() {
  const rowForm = document.getElementById('rowForm');
  const rowTitle = document.getElementById('rowTitle');
  
  if (rowForm) {
    rowForm.style.display = 'flex';
  }
  if (rowTitle) {
    rowTitle.style.display = 'none';
  }
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
  // Load job search data first
  loadJobSearchData();
  
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
});