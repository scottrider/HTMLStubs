// Data Validation and Handling Tests for Form Mock
// Tests data integrity, validation rules, and data flow

// Test data sets for validation
const validTestData = {
  position: 'Senior Software Engineer',
  email: 'john.doe@techcorp.com',
  cphone: '555-123-4567',
  ophone: '555-987-6543',
  company: '1',
  lcontact: '2024-02-15',
  icontact: '2024-01-10'
};

const invalidTestData = {
  position: '',  // Required field empty
  email: 'invalid-email',  // Invalid email format
  cphone: '123',  // Too short
  ophone: 'abc-def-ghij',  // Invalid format
  company: '',  // Required field empty
  lcontact: '2024-13-45',  // Invalid date
  icontact: ''
};

// Data validation functions
function validatePosition(value) {
  return value && value.trim().length > 0;
}

function validateEmail(value) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

function validatePhone(value) {
  if (!value) return true; // Optional field
  const phoneRegex = /^\d{3}-\d{3}-\d{4}$|^\(\d{3}\)\s?\d{3}-\d{4}$/;
  return phoneRegex.test(value) || value.length >= 10;
}

function validateCompany(value) {
  return value && value !== '';
}

function validateDate(value) {
  if (!value) return true; // Optional field
  const date = new Date(value);
  return date instanceof Date && !isNaN(date);
}

// Test data validation
function testDataValidation() {
  console.log('=== Testing Data Validation ===');
  
  // Test valid data
  console.log('Test 1 - Valid data validation:');
  console.log('  Position valid:', validatePosition(validTestData.position));
  console.log('  Email valid:', validateEmail(validTestData.email));
  console.log('  Cell phone valid:', validatePhone(validTestData.cphone));
  console.log('  Office phone valid:', validatePhone(validTestData.ophone));
  console.log('  Company valid:', validateCompany(validTestData.company));
  console.log('  Date valid:', validateDate(validTestData.lcontact));
  
  // Test invalid data
  console.log('\nTest 2 - Invalid data validation:');
  console.log('  Position invalid:', !validatePosition(invalidTestData.position));
  console.log('  Email invalid:', !validateEmail(invalidTestData.email));
  console.log('  Cell phone invalid:', !validatePhone(invalidTestData.cphone));
  console.log('  Office phone invalid:', !validatePhone(invalidTestData.ophone));
  console.log('  Company invalid:', !validateCompany(invalidTestData.company));
  console.log('  Date invalid:', !validateDate(invalidTestData.lcontact));
}

// Test data transformation and sanitization
function testDataTransformation() {
  console.log('\n=== Testing Data Transformation ===');
  
  const rawData = {
    position: '  Senior Developer  ',
    email: 'USER@COMPANY.COM',
    cphone: '(555) 123-4567',
    company: '2'
  };
  
  // Data sanitization functions
  function sanitizeData(data) {
    return {
      position: data.position ? data.position.trim() : '',
      email: data.email ? data.email.toLowerCase() : '',
      cphone: data.cphone ? data.cphone.replace(/\D/g, '') : '',
      ophone: data.ophone ? data.ophone.replace(/\D/g, '') : '',
      company: data.company || '',
      lcontact: data.lcontact || '',
      icontact: data.icontact || ''
    };
  }
  
  const sanitized = sanitizeData(rawData);
  
  console.log('Test 1 - Data sanitization:');
  console.log('  Position trimmed:', sanitized.position === 'Senior Developer');
  console.log('  Email lowercased:', sanitized.email === 'user@company.com');
  console.log('  Phone digits only:', sanitized.cphone === '5551234567');
  console.log('  Company preserved:', sanitized.company === '2');
}

// Test data persistence simulation
function testDataPersistence() {
  console.log('\n=== Testing Data Persistence ===');
  
  // Simulate localStorage operations
  function saveFormData(data) {
    try {
      localStorage.setItem('formMockData', JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    }
  }
  
  function loadFormData() {
    try {
      const data = localStorage.getItem('formMockData');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Load failed:', error);
      return null;
    }
  }
  
  function clearFormData() {
    try {
      localStorage.removeItem('formMockData');
      return true;
    } catch (error) {
      console.error('Clear failed:', error);
      return false;
    }
  }
  
  // Test save operation
  const saveResult = saveFormData(validTestData);
  console.log('Test 1 - Save data:', saveResult);
  
  // Test load operation
  const loadedData = loadFormData();
  const loadSuccess = JSON.stringify(loadedData) === JSON.stringify(validTestData);
  console.log('Test 2 - Load data:', loadSuccess);
  
  // Test clear operation
  const clearResult = clearFormData();
  const clearedData = loadFormData();
  console.log('Test 3 - Clear data:', clearResult && clearedData === null);
}

// Test required field validation
function testRequiredFields() {
  console.log('\n=== Testing Required Fields ===');
  
  const requiredFields = ['position', 'company'];
  
  function validateRequiredFields(data) {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!data[field] || data[field].trim() === '') {
        errors.push(`${field} is required`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
  
  // Test with valid data
  const validResult = validateRequiredFields(validTestData);
  console.log('Test 1 - Valid required fields:', validResult.isValid);
  
  // Test with invalid data
  const invalidResult = validateRequiredFields(invalidTestData);
  console.log('Test 2 - Invalid required fields:', !invalidResult.isValid);
  console.log('  Errors found:', invalidResult.errors.length === 2);
  console.log('  Error details:', invalidResult.errors);
}

// Run all data tests
function runDataTests() {
  console.log('🧪 Starting Form Mock Data Test Suite...\n');
  
  try {
    testDataValidation();
    testDataTransformation();
    testDataPersistence();
    testRequiredFields();
    console.log('\n✅ All data tests completed');
  } catch (error) {
    console.error('❌ Data test suite failed:', error);
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    validTestData, 
    invalidTestData,
    validatePosition,
    validateEmail,
    validatePhone,
    validateCompany,
    validateDate,
    testDataValidation,
    testDataTransformation,
    testDataPersistence,
    testRequiredFields,
    runDataTests
  };
}