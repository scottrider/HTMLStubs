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

// Schema/entity state
const ENTITY_DISPLAY_NAMES = {
    positions: { singular: 'Position', plural: 'Positions' },
    companies: { singular: 'Company', plural: 'Companies' },
    contacts: { singular: 'Contact', plural: 'Contacts' }
};

const TAB_ENTITY_MAP = {
    positions: 'positions',
    companies: 'companies',
    reports: 'contacts'
};

let currentEntityType = 'positions';
let currentSchema = {};
let currentFieldOrder = [];
let currentIdField = 'id';
let currentVisibleFieldOrder = [];

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
function applySchemaCSSDimensions(entityType = currentEntityType) {
    try {
        const schema = jobSearchData?.jobsearch?.[entityType]?.schema;
        if (!schema) {
            logger.warn(`No schema data available for CSS dimensions for ${entityType}`);
            return;
        }

        // Apply to DataGrid
        applyDataGridDimensionsFromSchema(schema, entityType);

        // Apply to row-form fields
        applyRowFormDimensions(schema);

        logger.info(`Schema-driven CSS dimensions applied to DataGrid and row-form for ${entityType}`);

    } catch (error) {
        logger.error('Error applying schema CSS dimensions:', error);
    }
}

function applyDataGridDimensionsFromSchema(schema, entityType) {
    if (typeof window.applyDataGridDimensions === 'function') {
        window.applyDataGridDimensions(schema, entityType);
        return;
    }

    // Minimal fallback for environments without DataGrid dimension helper
    const dataGridElement = document.querySelector('.datagrid-container');
    if (!dataGridElement) {
        logger.warn('DataGrid element not found for CSS dimension application');
        return;
    }

    Object.entries(schema).forEach(([fieldName, fieldConfig]) => {
        if (!fieldConfig?.css) {
            return;
        }

        const kebabName = toKebabCase(fieldName);
        const styleTarget = dataGridElement.style;

        if (fieldConfig.css.width) {
            styleTarget.setProperty(`--${kebabName}-width`, fieldConfig.css.width);
        }
        if (fieldConfig.css.minWidth) {
            styleTarget.setProperty(`--${kebabName}-min-width`, fieldConfig.css.minWidth);
        }
        if (fieldConfig.css.maxWidth) {
            styleTarget.setProperty(`--${kebabName}-max-width`, fieldConfig.css.maxWidth);
        }
        if (fieldConfig.css.gridFlex) {
            styleTarget.setProperty(`--${kebabName}-flex`, fieldConfig.css.gridFlex);
        }
    });
}

function toKebabCase(value) {
    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}

function getEntityDisplayName(entityType = currentEntityType, plural = true) {
    const mapping = ENTITY_DISPLAY_NAMES[entityType];
    if (mapping) {
        return plural ? mapping.plural : mapping.singular;
    }

    const normalized = (entityType || '').toString();
    if (!normalized) {
        return plural ? 'Records' : 'Record';
    }

    const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    if (!plural && capitalized.endsWith('s')) {
        return capitalized.slice(0, -1);
    }
    return capitalized;
}

function setEntityContext(entityType) {
    currentEntityType = entityType;
    currentSchema = jobSearchData?.jobsearch?.[entityType]?.schema || {};
    currentFieldOrder = Object.keys(currentSchema);
    currentIdField = currentFieldOrder.find(name => name.toLowerCase() === 'id') || 'id';
    currentVisibleFieldOrder = currentFieldOrder.filter(fieldName => isFieldVisible(currentSchema[fieldName]));
}

function getFieldDefinitions(entityType = currentEntityType) {
    const schema = jobSearchData?.jobsearch?.[entityType]?.schema || {};
    return Object.keys(schema).map(fieldName => ({
        name: fieldName,
        config: schema[fieldName]
    }));
}

function getFieldConfig(fieldName, entityType = currentEntityType) {
    return jobSearchData?.jobsearch?.[entityType]?.schema?.[fieldName] || null;
}

function isFieldVisible(fieldConfig) {
    return fieldConfig?.htmlType !== 'hidden';
}

function getVisibleFieldOrder(entityType = currentEntityType) {
    const schema = jobSearchData?.jobsearch?.[entityType]?.schema || {};
    return Object.keys(schema).filter(fieldName => isFieldVisible(schema[fieldName]));
}

function buildDimensionStyle(fieldConfig = {}, { includeFlex = true } = {}) {
    const css = fieldConfig.css || {};
    const styleSegments = [];

    if (css.width) {
        styleSegments.push(`width:${css.width}`);
    }
    if (css.minWidth) {
        styleSegments.push(`min-width:${css.minWidth}`);
    }
    if (css.maxWidth) {
        styleSegments.push(`max-width:${css.maxWidth}`);
    }
    if (includeFlex && css.gridFlex) {
        const flexGrowMatch = css.gridFlex.toString().match(/([0-9.]+)/);
        if (flexGrowMatch) {
            const flexGrow = parseFloat(flexGrowMatch[1]) || 1;
            styleSegments.push(`flex:${flexGrow} 1 0`);
        }
    }

    return styleSegments.join(';');
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function resolveForeignKeyOptions(fieldConfig) {
    if (!fieldConfig) {
        return [];
    }

    if (Array.isArray(fieldConfig.options) && fieldConfig.options.length > 0) {
        return fieldConfig.options.map(option => {
            if (option && typeof option === 'object') {
                const value = option.value ?? option.id ?? option.key ?? option.code ?? option.name ?? option.label ?? '';
                const label = option.label ?? option.name ?? option.display ?? option.title ?? String(value ?? '');
                return { value, label };
            }

            return { value: option, label: option };
        });
    }

    if (!fieldConfig.foreignKey) {
        return [];
    }

    const [collectionKey, idField] = fieldConfig.foreignKey.split('.');
    const [displayCollectionKey, displayField] = (fieldConfig.foreignKeyDisplay || '').split('.');
    const collectionName = displayCollectionKey || collectionKey;
    const collection = jobSearchData?.jobsearch?.[collectionName]?.data;
    if (!Array.isArray(collection)) {
        return [];
    }

    return collection.map(item => ({
        value: item?.[idField],
        label: displayField && item?.[displayField] !== undefined ? item[displayField] : item?.[idField]
    }));
}

function resolveForeignKeyLabel(fieldConfig, value) {
    if (!fieldConfig || value === null || value === undefined || value === '') {
        return value;
    }

    const options = resolveForeignKeyOptions(fieldConfig);
    const match = options.find(option => String(option.value) === String(value));
    return match ? match.label : value;
}

function resolveForeignRecord(tableName, id) {
    if (!tableName || id === null || id === undefined || id === '') {
        return null;
    }

    const collection = jobSearchData?.jobsearch?.[tableName]?.data;
    if (!Array.isArray(collection)) {
        return null;
    }

    return collection.find(record => String(record.id) === String(id));
}

function getFieldDisplayValue(record, fieldName) {
    const fieldConfig = getFieldConfig(fieldName);
    if (!fieldConfig) {
        return record[fieldName];
    }

    const value = record[fieldName];

    // Handle computed fields
    if (fieldConfig.computed && fieldConfig.computedFrom && fieldConfig.computedKey) {
        const foreignKeyValue = record[fieldConfig.computedKey];
        if (!foreignKeyValue) {
            return '';
        }

        // Extract table and field from computedFrom (e.g., "contacts.lname,contacts.fname")
        const computedFromParts = fieldConfig.computedFrom.split('.');
        if (computedFromParts.length === 2) {
            const [tableName, fieldPath] = computedFromParts;
            const foreignRecord = resolveForeignRecord(tableName, foreignKeyValue);
            
            if (foreignRecord) {
                // Handle multiple fields (e.g., "lname,fname")
                if (fieldPath.includes(',')) {
                    const fieldNames = fieldPath.split(',');
                    return fieldNames.map(fn => foreignRecord[fn.trim()]).filter(v => v).join(', ');
                } else {
                    return foreignRecord[fieldPath];
                }
            }
        }
        
        return '';
    }

    // Handle regular foreign key lookups
    if (fieldConfig.htmlElement === 'select' && fieldConfig.foreignKey) {
        return resolveForeignKeyLabel(fieldConfig, value);
    }

    return value;
}

function normalizeFieldValue(fieldName, value) {
    const fieldConfig = getFieldConfig(fieldName);
    if (!fieldConfig) {
        return value;
    }

    if (value === '' || value === null || value === undefined) {
        return '';
    }

    if (fieldConfig.type === 'number') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? value : parsed;
    }

    return value;
}

function isValueProvided(value) {
    return value !== undefined && value !== null && value !== '';
}

function getMissingRequiredFields(formData) {
    return currentFieldOrder.filter(fieldName => {
        const fieldConfig = currentSchema[fieldName];
        if (!fieldConfig?.required) {
            return false;
        }

        return !isValueProvided(formData[fieldName]);
    });
}

function formatEntityCount(count, entityType = currentEntityType) {
    const label = count === 1
        ? getEntityDisplayName(entityType, false)
        : getEntityDisplayName(entityType);
    return label.toLowerCase();
}

// applyRowFormDimensions function has been moved to DataGridRow.js

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
function getFieldCSSDimensions(fieldName, entityType = currentEntityType) {
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
    initializeEntity(currentEntityType);
  } catch (error) {
    logger.error('Error loading job search data:', error);
    // Fallback to hardcoded options if file load fails
  }
}

function initializeEntity(entityType = currentEntityType) {
  if (!jobSearchData?.jobsearch?.[entityType]) {
    logger.warn(`Entity "${entityType}" not found in job search data`);
    return;
  }

  setEntityContext(entityType);

  const entity = jobSearchData.jobsearch[entityType];
  const entityData = Array.isArray(entity.data) ? entity.data : [];

  storedRecords = entityData.map((record, index) => {
    const normalizedRecord = { ...record };
    const existingId = normalizedRecord[currentIdField];
    const fallbackId = record.id || index + 1;
    const resolvedId = isValueProvided(existingId) ? existingId : fallbackId;

    normalizedRecord[currentIdField] = normalizeFieldValue(currentIdField, resolvedId);
    if (!isValueProvided(normalizedRecord.id)) {
      normalizedRecord.id = normalizedRecord[currentIdField] ?? fallbackId;
    }

    if (normalizedRecord.isDisabled === undefined) {
      normalizedRecord.isDisabled = false;
    }

    return normalizedRecord;
  });

  jobSearchData.jobsearch[entityType].data = storedRecords.map(record => ({ ...record }));

  applySchemaCSSDimensions(entityType);
  renderRowFormFromSchema();
  renderTitleFromSchema();
  resetSelectionState();
  updateHeaderTitle();
  updatePagination();
  renderRecordsDisplay();
  initializeSearchComponent();

  logger.info(`${getEntityDisplayName(entityType)} loaded:`, storedRecords.length);
}

function resetSelectionState() {
  selectedRecords = new Set();
  masterCheckboxState = false;
  editingIndex = -1;
  originalRecordData = null;
  currentPage = 1;
  filteredSearchRecords = [];
  currentSearchTerm = '';
}

function persistStoredRecords() {
  if (jobSearchData?.jobsearch?.[currentEntityType]) {
    jobSearchData.jobsearch[currentEntityType].data = storedRecords.map(record => ({ ...record }));
  }
}

function renderRowFormFromSchema() {
  const fieldsContainer = document.getElementById('rowFormFields');
  if (!fieldsContainer) {
    return;
  }

  const fieldsHTML = currentFieldOrder
    .map(fieldName => createFormFieldGroupHTML(fieldName, currentSchema[fieldName]))
    .join('');

  fieldsContainer.innerHTML = fieldsHTML;
}

function renderTitleFromSchema() {
  const titleContainer = document.getElementById('rowTitleFields');
  if (!titleContainer) {
    return;
  }

  const titleHTML = currentVisibleFieldOrder
    .map(fieldName => {
      const fieldConfig = currentSchema[fieldName];
      if (!fieldConfig) {
        return '';
      }

      const style = buildDimensionStyle(fieldConfig);
      const styleAttr = style ? ` style="${style}"` : '';
      const hintText = getTitleHint(fieldName, fieldConfig);
      return `
        <div class="title-group field-${toKebabCase(fieldName)}"${styleAttr}>
          <span class="title-label">${escapeHtml(fieldConfig.displayName || fieldName)}</span>
          ${hintText ? `<span class="title-hint">${escapeHtml(hintText)}</span>` : ''}
        </div>
      `;
    })
    .join('');

  titleContainer.innerHTML = titleHTML;
}

function getTitleHint(fieldName, fieldConfig) {
  if (!fieldConfig) {
    return '';
  }

  const computedFrom = typeof fieldConfig.computedFrom === 'string'
    ? fieldConfig.computedFrom.toLowerCase()
    : '';

  if (
    fieldName.toLowerCase() === 'name' &&
    computedFrom.includes('lname') &&
    computedFrom.includes('fname')
  ) {
    return 'Last Name, First Name';
  }

  return '';
}

function createFormFieldGroupHTML(fieldName, fieldConfig, value = '') {
  if (!fieldConfig) {
    return '';
  }

  if (!isFieldVisible(fieldConfig)) {
    const hiddenValue = escapeHtml(value ?? '');
    return `<input type="hidden" data-field="${fieldName}" value="${hiddenValue}" />`;
  }

  const style = buildDimensionStyle(fieldConfig);
  const styleAttr = style ? ` style="${style}"` : '';
  const fieldClass = `field-group field-${toKebabCase(fieldName)}`;
  const inputHTML = createFieldInputHTML(fieldName, fieldConfig, value, { mode: 'form' });

  return `<div class="${fieldClass}"${styleAttr}>${inputHTML}</div>`;
}

function createRecordFieldHTML(record, fieldName, fieldConfig, mode) {
  if (!fieldConfig) {
    return '';
  }

  if (!isFieldVisible(fieldConfig)) {
    if (mode === 'edit') {
      const hiddenValue = escapeHtml(record[fieldName] ?? '');
      return `<input type="hidden" data-field="${fieldName}" value="${hiddenValue}" />`;
    }
    return '';
  }

  const style = buildDimensionStyle(fieldConfig);
  const styleAttr = style ? ` style="${style}"` : '';
  const fieldClass = `record-field field-${toKebabCase(fieldName)}`;

  let content = '';
  if (mode === 'read') {
    const displayValue = getFieldDisplayValue(record, fieldName);
    content = escapeHtml(displayValue ?? '');
  } else {
    content = createFieldInputHTML(fieldName, fieldConfig, record[fieldName], { mode: 'edit' });
  }

  return `<div class="${fieldClass}"${styleAttr}>${content}</div>`;
}

function createFieldInputHTML(fieldName, fieldConfig, value, { mode }) {
  const safeValue = value ?? '';

  switch ((fieldConfig?.htmlElement || 'input').toLowerCase()) {
    case 'label': {
      const display = escapeHtml(safeValue);
      const dataValueAttr = isValueProvided(safeValue) ? ` data-value="${display}"` : '';
      return `<label class="field-label-display" data-field="${fieldName}"${dataValueAttr}>${display}</label>`;
    }
    case 'select': {
      const optionsHTML = buildSelectOptions(fieldName, fieldConfig, safeValue);
      const requiredAttr = fieldConfig.required ? ' required' : '';
      const styleClass = 'field-select';
      return `<select class="${styleClass}${requiredAttr ? ' required' : ''}" data-field="${fieldName}"${requiredAttr}>${optionsHTML}</select>`;
    }
    default: {
      const type = fieldConfig.htmlType || fieldConfig.type || 'text';
      const placeholder = getFieldPlaceholder(fieldName, fieldConfig);
      const attributes = [`type="${type}"`, `class="field-input${fieldConfig.required ? ' required' : ''}"`, `data-field="${fieldName}"`];

      if (placeholder) {
        attributes.push(`placeholder="${escapeHtml(placeholder)}"`);
      }

      ['min', 'max', 'step', 'maxlength', 'pattern'].forEach(attr => {
        if (fieldConfig.css && fieldConfig.css[attr] !== undefined) {
          attributes.push(`${attr}="${escapeHtml(fieldConfig.css[attr])}"`);
        }
      });

      if (mode !== 'read') {
        attributes.push(`value="${escapeHtml(safeValue)}"`);
      }

      if (fieldConfig.required) {
        attributes.push('required');
      }

      return `<input ${attributes.join(' ')} />`;
    }
  }
}

function buildSelectOptions(fieldName, fieldConfig, selectedValue) {
  const options = resolveForeignKeyOptions(fieldConfig);
  const placeholder = getFieldPlaceholder(fieldName, fieldConfig) || `Select ${fieldConfig.displayName || fieldName}...`;
  const optionsHTML = [
    `<option value="">${escapeHtml(placeholder)}</option>`
  ];

  options.forEach(option => {
    const isSelected = String(option.value) === String(selectedValue);
    optionsHTML.push(
      `<option value="${escapeHtml(option.value)}"${isSelected ? ' selected' : ''}>${escapeHtml(option.label)}</option>`
    );
  });

  return optionsHTML.join('');
}

function getFieldPlaceholder(fieldName, fieldConfig) {
  if (fieldConfig?.css?.placeholder) {
    return fieldConfig.css.placeholder;
  }
  return fieldConfig?.displayName ? `Enter ${fieldConfig.displayName.toLowerCase()}` : '';
}

function updateHeaderTitle() {
  const headerTitleElement = document.querySelector('.header-title');
  if (headerTitleElement) {
    headerTitleElement.textContent = `${getEntityDisplayName(currentEntityType, false)} Records`;
  }
}

function initializeSearchComponent() {
  const searchElement = document.querySelector('#datagrid-search');
  if (!searchElement) {
    return;
  }

  if (window.formMockSearch && typeof window.formMockSearch.destroy === 'function') {
    try {
      window.formMockSearch.destroy();
    } catch (error) {
      logger.warn('Error destroying previous DataGridSearch instance:', error);
    }
  }

  const placeholder = `Search ${getEntityDisplayName(currentEntityType).toLowerCase()}...`;

  try {
    window.formMockSearch = new DataGridSearch('#datagrid-search', {
      debounceDelay: CONFIG.DEBOUNCE_DELAY,
      placeholder,
      onSearch: (searchTerm) => {
        if (typeof window.performGlobalSearch === 'function') {
          window.performGlobalSearch(searchTerm);
        }
      },
      onClear: () => {
        if (typeof window.clearSearch === 'function') {
          window.clearSearch();
        }
      }
    });
  } catch (error) {
    logger.error('Error initializing DataGridSearch:', error);
    window.formMockSearch = null;
  }
}

// Get filtered record by index (accounting for filtering)
function getFilteredRecordIndex(filteredIndex) {
  const filteredRecords = getFilteredRecords();
  const targetRecord = filteredRecords[filteredIndex];
  return storedRecords.findIndex(record => record.id === targetRecord.id);
}

// clearRowForm function has been moved to DataGridRow.js

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

    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    formData[fieldName] = normalizeFieldValue(fieldName, trimmedValue);
  });

  // Add timestamp
  formData.timestamp = new Date().toISOString();

  const missingFields = getMissingRequiredFields(formData);
  if (missingFields.length > 0) {
    alert(`Please provide values for: ${missingFields.map(field => currentSchema[field]?.displayName || field).join(', ')}`);
    return;
  }

  // Check if we're editing an existing record
  if (typeof window.editingRecordIndex !== 'undefined' && window.editingRecordIndex >= 0) {
    // Update existing record
    const existingRecord = storedRecords[window.editingRecordIndex] || {};
    const updatedRecord = { ...existingRecord, ...formData };
    storedRecords[window.editingRecordIndex] = updatedRecord;
    persistStoredRecords();
    window.editingRecordIndex = undefined; // Clear editing flag
    logger.debug('Record updated:', updatedRecord);
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
  const uniqueId = Date.now();
  if (!isValueProvided(formData[currentIdField])) {
    formData[currentIdField] = normalizeFieldValue(currentIdField, uniqueId);
  }
  if (!isValueProvided(formData.id)) {
    formData.id = formData[currentIdField];
  }
  if (!formData.timestamp) {
    formData.timestamp = new Date().toISOString();
  }
  // Add isDisabled field for new records (default to false = enabled)
  if (formData.isDisabled === undefined) {
    formData.isDisabled = false;
  }

  storedRecords.push(formData);
  persistStoredRecords();
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
  const viewLabel = viewingEnabled ? 'Enabled' : 'Disabled';
  const entityPlural = getEntityDisplayName(currentEntityType);
  const viewPhrase = `${viewLabel} ${entityPlural}`;
  const searchInfo = currentSearchTerm ? ` matching "${currentSearchTerm}"` : '';

  if (displayRecords.length === 0) {
    if (currentSearchTerm) {
      headerSummary.textContent = `No ${viewPhrase.toLowerCase()} found matching "${currentSearchTerm}"`;
    } else {
      headerSummary.textContent = `No ${viewPhrase.toLowerCase()} - Click ➕ to add your first record`;
    }
  } else {
    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, displayRecords.length);
    headerSummary.textContent = `Showing ${startRecord}-${endRecord} of ${displayRecords.length} ${viewPhrase.toLowerCase()}${searchInfo}`;
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
  const viewLabel = viewingEnabled ? 'Enabled' : 'Disabled';
  const entityPlural = getEntityDisplayName(currentEntityType);
  const viewPhrase = `${viewLabel.toLowerCase()} ${entityPlural.toLowerCase()}`;

  // Handle no records cases
  if (currentSearchTerm && filteredSearchRecords.length === 0) {
    recordsContainer.innerHTML = `<div class="no-records-message">No ${viewPhrase} found matching "${currentSearchTerm}".</div>`;
    return;
  }

  if (displayRecords.length === 0) {
    recordsContainer.innerHTML = `<div class="no-records-message">No ${viewPhrase} found.</div>`;
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
  const isSelected = selectedRecords.has(index);
  const isEditing = editingIndex === index;

  if (isEditing) {
    return createEditableRecordRowHTML(record, index, isSelected);
  }

  return createReadOnlyRecordRowHTML(record, index, isSelected);
}

function createReadOnlyRecordRowHTML(record, index, isSelected) {
  const fieldsHTML = currentVisibleFieldOrder
    .map(fieldName => createRecordFieldHTML(record, fieldName, currentSchema[fieldName], 'read'))
    .join('');

  return `
    <div class="record-row ${isSelected ? 'selected' : ''}" data-record-index="${index}">
      <div class="record-actions">
        <input type="checkbox" class="record-checkbox"
               data-index="${index}"
               ${isSelected ? 'checked' : ''}
               title="Select record" />
        <button class="btn-emoji btn-edit" data-action="edit" data-index="${index}" title="Edit">✏️</button>
      </div>
      ${fieldsHTML}
    </div>
  `;
}

function createEditableRecordRowHTML(record, index, isSelected) {
  const fieldsHTML = currentFieldOrder
    .map(fieldName => createRecordFieldHTML(record, fieldName, currentSchema[fieldName], 'edit'))
    .join('');

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
      ${fieldsHTML}
    </div>
  `;
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

    if (element.hasAttribute('data-value')) {
      value = element.getAttribute('data-value');
    } else if (element.tagName === 'INPUT') {
      value = element.value;
    } else if (element.tagName === 'SELECT') {
      value = element.value;
    } else if (element.classList.contains('field-label-display')) {
      value = element.textContent;
    }

    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    formData[fieldName] = normalizeFieldValue(fieldName, trimmedValue);
  });

  const missingFields = getMissingRequiredFields({ ...storedRecords[index], ...formData });
  if (missingFields.length > 0) {
    alert(`Please provide values for: ${missingFields.map(field => currentSchema[field]?.displayName || field).join(', ')}`);
    return;
  }

  // Update the stored record (preserve isDisabled state)
  const currentIsDisabled = storedRecords[index].isDisabled;
  storedRecords[index] = { ...storedRecords[index], ...formData };
  storedRecords[index].isDisabled = currentIsDisabled; // Preserve the disabled state
  persistStoredRecords();

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
    const entitySingular = getEntityDisplayName(currentEntityType, false);
    const entityPlural = getEntityDisplayName(currentEntityType);
    const selectionLabel = selectedRecords.size === 1
      ? entitySingular
      : entityPlural;
    headerInfo.innerHTML = `
      <div class="header-title">${entitySingular} Records</div>
      <div class="header-summary" id="headerSummary">
        ${selectedRecords.size} ${selectionLabel.toLowerCase()} selected
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
    initializeSearchComponent();

  } else {
    // Update header info for normal state
    const summaryText = document.getElementById('headerSummary')?.textContent || '';
    headerInfo.innerHTML = `
      <div class="header-title">${getEntityDisplayName(currentEntityType, false)} Records</div>
      <div class="header-summary" id="headerSummary">${summaryText}</div>
    `;
    updateHeaderSummary();

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
    initializeSearchComponent();

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
    const entityPlural = getEntityDisplayName(currentEntityType);
    const entityPluralLower = entityPlural.toLowerCase();
    const displayRecords = currentSearchTerm
      ? filteredSearchRecords
      : getFilteredRecords();

    if (displayRecords.length === 0) {
      alert(`No disabled ${entityPluralLower} to restore`);
      return;
    }

    const countLabel = formatEntityCount(displayRecords.length);
    if (confirm(`Restore all ${displayRecords.length} disabled ${countLabel} on this page?`)) {
      displayRecords.forEach(record => {
        const actualIndex = storedRecords.findIndex(r => r.id === record.id);
        if (actualIndex >= 0) {
          storedRecords[actualIndex].isDisabled = false;
        }
      });
      persistStoredRecords();
      
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
      showTransferNotification(`${displayRecords.length} ${countLabel} restored and moved to Enabled view`, 'success');

      logger.info('All disabled records on page restored and removed from disabled view');
    }
    return;
  }

  const entityPlural = getEntityDisplayName(currentEntityType);
  const entityPluralLower = entityPlural.toLowerCase();

  if (confirm(`Restore ${selectedRecords.size} selected ${formatEntityCount(selectedRecords.size)}?`)) {
    // Use the global indices directly from selectedRecords (same as handleDeleteSelected)
    selectedRecords.forEach(globalIndex => {
      if (globalIndex >= 0 && globalIndex < storedRecords.length) {
        storedRecords[globalIndex].isDisabled = false;
      }
    });
    persistStoredRecords();
    
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
    showTransferNotification(`${restoredCount} ${formatEntityCount(restoredCount)} restored and moved to Enabled view`, 'success');

    logger.info('Selected records restored and removed from disabled view');
  }
}

// Handle delete selected records (soft delete by setting isDisabled=true)
function handleDeleteSelected() {
  if (selectedRecords.size === 0) return;

  const deletedCount = selectedRecords.size; // Capture count before clearing
  const countLabel = formatEntityCount(deletedCount);

  if (confirm(`Delete ${deletedCount} selected ${countLabel}?`)) {
    // Use the global indices directly from selectedRecords
    selectedRecords.forEach(globalIndex => {
      if (globalIndex >= 0 && globalIndex < storedRecords.length) {
        storedRecords[globalIndex].isDisabled = true;
      }
    });
    persistStoredRecords();
    
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
    showTransferNotification(`${deletedCount} ${countLabel} deleted and moved to Disabled view`, 'warning');

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
    const entityPlural = getEntityDisplayName(currentEntityType).toLowerCase();
    const displayRecords = currentSearchTerm
      ? filteredSearchRecords
      : getFilteredRecords();

    if (displayRecords.length === 0) {
      alert(`No disabled ${entityPlural} to restore`);
      return;
    }

    // Calculate current page records
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, displayRecords.length);
    const pageRecords = displayRecords.slice(startIndex, endIndex);
    
    if (confirm(`Restore all ${pageRecords.length} disabled ${entityPlural} on this page?`)) {
      pageRecords.forEach(record => {
        const actualIndex = storedRecords.findIndex(r => r.id === record.id);
        if (actualIndex >= 0) {
          storedRecords[actualIndex].isDisabled = false;
        }
      });
      persistStoredRecords();

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
      showTransferNotification(`${pageRecords.length} ${entityPlural} restored and moved to Enabled view`, 'success');

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

function recordMatchesSearchTerm(record, lowerSearchTerm) {
  return currentFieldOrder.some(fieldName => {
    const fieldConfig = currentSchema[fieldName];
    const rawValue = record[fieldName];
    const displayValue = getFieldDisplayValue(record, fieldName);

    const valuesToCheck = [];
    
    // For computed fields, only use the display value since rawValue won't exist in the record
    if (fieldConfig?.computed) {
      if (isValueProvided(displayValue)) {
        valuesToCheck.push(displayValue);
      }
    } else {
      // For regular fields, check both raw and display values
      if (isValueProvided(rawValue)) {
        valuesToCheck.push(rawValue);
      }
      if (displayValue !== rawValue && isValueProvided(displayValue)) {
        valuesToCheck.push(displayValue);
      }
    }

    return valuesToCheck.some(value => {
      const stringValue = String(value).toLowerCase();
      return stringValue.includes(lowerSearchTerm);
    });
  });
}

// Global search function for DataGridSearch integration
window.performGlobalSearch = function(searchTerm) {
  currentSearchTerm = searchTerm.toLowerCase().trim();
  logger.debug('Search for:', searchTerm);

  if (!currentSearchTerm) {
    filteredSearchRecords = [];
    currentPage = 1;
    renderRecordsDisplay();
    updatePagination();
    return;
  }

  const baseRecords = getFilteredRecords();
  filteredSearchRecords = baseRecords.filter(record => recordMatchesSearchTerm(record, currentSearchTerm));

  logger.debug(`Found ${filteredSearchRecords.length} matches for "${searchTerm}"`);

  currentPage = 1;
  renderRecordsDisplay();
  updatePagination();
};

// Global clear search function for DataGridSearch integration
window.clearSearch = function() {
  logger.debug('Clearing global search');
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
    if (storedRecords && storedRecords.length > 0) {
      return viewingEnabled
        ? storedRecords.filter(record => !record.isDisabled)
        : storedRecords.filter(record => record.isDisabled);
    }

    const entityData = jobSearchData?.jobsearch?.[currentEntityType]?.data;
    if (Array.isArray(entityData)) {
      return viewingEnabled
        ? entityData.filter(record => !record.isDisabled)
        : entityData.filter(record => record.isDisabled);
    }

    return [];
  } catch (error) {
    logger.error('Error getting filtered records:', error);
    return [];
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

    return baseRecords.filter(record => recordMatchesSearchTerm(record, lowerSearchTerm));
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

// DataGridSearch class has been moved to DataGrid.js

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataGridSearch;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.DataGridSearch = DataGridSearch;
}


// ===== JobSearch Management Tab Functionality =====

// Tab switching functionality
window.switchTab = function(tabName) {
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Hide all tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // Activate selected tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-panel`).classList.add('active');

    const entityKey = TAB_ENTITY_MAP[tabName] || tabName;
    if (jobSearchData?.jobsearch?.[entityKey]) {
        initializeEntity(entityKey);
    } else {
        logger.warn(`No data available for tab "${tabName}"`);
    }

    if (entityKey === 'positions') {
        updateStatistics();
    }
};

// Update statistics function
function updateStatistics() {
    if (typeof storedRecords !== 'undefined' && storedRecords) {
        const totalRecords = storedRecords.length;
        const enabledRecords = storedRecords.filter(record => !record.isDisabled).length;
        const disabledRecords = storedRecords.filter(record => record.isDisabled).length;

        const totalEl = document.getElementById('totalPositions');
        const activeEl = document.getElementById('activePositions');
        const archivedEl = document.getElementById('archivedPositions');
        if (totalEl) totalEl.textContent = totalRecords;
        if (activeEl) activeEl.textContent = enabledRecords;
        if (archivedEl) archivedEl.textContent = disabledRecords;

        // Update current page display
        if (typeof currentPage !== 'undefined') {
            const currentPageEl = document.getElementById('currentPage');
            if (currentPageEl) currentPageEl.textContent = currentPage;
        }
    }
}

// Initialize DataGridSearch and hook into FormMock updates
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing JobSearch Management UI');

    // Initial statistics update
    setTimeout(() => {
        updateStatistics();
    }, 500);
});

// Override the original updatePagination to also update statistics
if (typeof window.originalUpdatePagination === 'undefined') {
    window.originalUpdatePagination = window.updatePagination;
    window.updatePagination = function() {
        if (window.originalUpdatePagination) {
            window.originalUpdatePagination();
        }
        updateStatistics();
    };
}

// Hook into FormMock save operations to update statistics
if (typeof window.originalSaveFormData === 'undefined' && typeof window.saveFormData === 'function') {
    window.originalSaveFormData = window.saveFormData;
    window.saveFormData = function() {
        const result = window.originalSaveFormData();
        updateStatistics();
        return result;
    };
}

// Hook into FormMock delete operations to update statistics  
if (typeof window.originalDeleteRecord === 'undefined' && typeof window.deleteRecord === 'function') {
    window.originalDeleteRecord = window.deleteRecord;
    window.deleteRecord = function(index) {
        window.originalDeleteRecord(index);
        updateStatistics();
    };
}

// Hook into toggle operations to update statistics
if (typeof window.originalToggleView === 'undefined' && typeof window.toggleView === 'function') {
    window.originalToggleView = window.toggleView;
    window.toggleView = function(showEnabled) {
        window.originalToggleView(showEnabled);
        updateStatistics();
    };
}

// Listen for window resize to handle responsive behavior
window.addEventListener('resize', function() {
    // Handle responsive layout adjustments if needed
    if (window.innerWidth <= 480) {
        // Mobile specific adjustments
        const statsBar = document.querySelector('.stats-bar');
        if (statsBar) {
            statsBar.style.flexDirection = 'column';
        }
    }
});
