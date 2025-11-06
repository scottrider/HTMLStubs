// Test Suite for Form Mock JavaScript Methods
// Tests for clearRowForm() and form data handling

// Mock DOM setup for testing
function createMockDOM() {
  document.body.innerHTML = `
    <form>
      <div>
        <div class="grid-data-row">
          <div class="row-form">
            <div class="action-buttons">
              <input type="checkbox" class="record-checkbox" name="datagrid-checkbox" />
            </div>
            <div class="field-group">
              <input type="text" class="field-input required" data-field="position" value="Test Position" />
            </div>
            <div class="field-group">
              <input type="email" class="field-input" data-field="email" value="test@example.com" />
            </div>
            <div class="field-group">
              <input type="tel" class="field-input" data-field="cphone" value="555-1234" />
            </div>
            <div class="field-group">
              <input type="date" class="field-input" data-field="lcontact" value="2024-01-15" />
            </div>
            <div class="field-group">
              <select class="field-select required" data-field="company">
                <option value="">Select Company...</option>
                <option value="1" selected>TechCorp Inc</option>
                <option value="2">InnovateSoft</option>
              </select>
            </div>
            <div class="field-group">
              <label class="field-label-display" data-field="icontact">2024-01-12</label>
            </div>
          </div>
        </div>
      </div>
    </form>
  `;
}

// Test clearRowForm method
function testClearRowForm() {
  console.log('=== Testing clearRowForm() ===');
  
  // Setup mock DOM
  createMockDOM();
  
  const checkbox = document.querySelector('input[name="datagrid-checkbox"]');
  const textInput = document.querySelector('input[data-field="position"]');
  const emailInput = document.querySelector('input[data-field="email"]');
  const telInput = document.querySelector('input[data-field="cphone"]');
  const dateInput = document.querySelector('input[data-field="lcontact"]');
  const selectInput = document.querySelector('select[data-field="company"]');
  const labelDisplay = document.querySelector('.field-label-display');
  
  // Test 1: Method exists
  console.log('Test 1 - clearRowForm function exists:', typeof clearRowForm === 'function');
  
  // Test 2: Initial values are set
  console.log('Test 2 - Initial values present:');
  console.log('  Text:', textInput.value === 'Test Position');
  console.log('  Email:', emailInput.value === 'test@example.com');
  console.log('  Phone:', telInput.value === '555-1234');
  console.log('  Date:', dateInput.value === '2024-01-15');
  console.log('  Select:', selectInput.selectedIndex === 1);
  console.log('  Label:', labelDisplay.textContent === '2024-01-12');
  
  // Test 3: Clear method without checkbox checked (should not clear)
  checkbox.checked = false;
  clearRowForm();
  console.log('Test 3 - Values remain when checkbox unchecked:');
  console.log('  Text unchanged:', textInput.value === 'Test Position');
  console.log('  Email unchanged:', emailInput.value === 'test@example.com');
  
  // Test 4: Clear method with checkbox checked (should clear)
  checkbox.checked = true;
  clearRowForm();
  console.log('Test 4 - Values cleared when checkbox checked:');
  console.log('  Text cleared:', textInput.value === '');
  console.log('  Email cleared:', emailInput.value === '');
  console.log('  Phone cleared:', telInput.value === '');
  console.log('  Date cleared:', dateInput.value === '');
  console.log('  Select reset:', selectInput.selectedIndex === 0);
  console.log('  Label cleared:', labelDisplay.textContent === '');
  console.log('  Checkbox unchecked:', checkbox.checked === false);
}

// Test form data collection
function testFormDataCollection() {
  console.log('\n=== Testing Form Data Collection ===');
  
  // Setup mock DOM with test data
  createMockDOM();
  
  const testData = {
    position: 'Senior Developer',
    email: 'dev@company.com',
    cphone: '555-9876',
    lcontact: '2024-02-20',
    company: '2'
  };
  
  // Populate form with test data
  document.querySelector('input[data-field="position"]').value = testData.position;
  document.querySelector('input[data-field="email"]').value = testData.email;
  document.querySelector('input[data-field="cphone"]').value = testData.cphone;
  document.querySelector('input[data-field="lcontact"]').value = testData.lcontact;
  document.querySelector('select[data-field="company"]').value = testData.company;
  
  // Collect form data
  const formData = collectFormData();
  
  console.log('Test 1 - Form data collection:');
  console.log('  Position match:', formData.position === testData.position);
  console.log('  Email match:', formData.email === testData.email);
  console.log('  Phone match:', formData.cphone === testData.cphone);
  console.log('  Date match:', formData.lcontact === testData.lcontact);
  console.log('  Company match:', formData.company === testData.company);
  
  console.log('Collected data:', formData);
}

// Helper function to collect form data
function collectFormData() {
  const rowForm = document.querySelector('.row-form');
  const formData = {};
  
  if (rowForm) {
    // Collect input field data
    rowForm.querySelectorAll('input[data-field]').forEach(input => {
      formData[input.dataset.field] = input.value;
    });
    
    // Collect select field data
    rowForm.querySelectorAll('select[data-field]').forEach(select => {
      formData[select.dataset.field] = select.value;
    });
    
    // Collect label display data
    rowForm.querySelectorAll('.field-label-display[data-field]').forEach(label => {
      formData[label.dataset.field] = label.textContent;
    });
  }
  
  return formData;
}

// Run all tests
function runAllTests() {
  console.log('🧪 Starting Form Mock Test Suite...\n');
  
  try {
    testClearRowForm();
    testFormDataCollection();
    console.log('\n✅ All tests completed');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testClearRowForm, testFormDataCollection, collectFormData, runAllTests };
}