/**
 * DataGrid Unit Tests
 * Comprehensive test suite following best practices for component testing
 * Uses Jest-style testing patterns with mock data and assertions
 */

// Mock data for testing
const mockSchema = {
    id: {
        type: 'number',
        displayName: 'ID',
        htmlElement: 'input',
        htmlType: 'number',
        required: true,
        css: { readonly: true }
    },
    name: {
        type: 'string',
        displayName: 'Name',
        htmlElement: 'input',
        htmlType: 'text',
        required: true,
        css: { placeholder: 'Enter name', maxlength: '100' }
    },
    email: {
        type: 'email',
        displayName: 'Email',
        htmlElement: 'input',
        htmlType: 'email',
        required: true,
        css: { placeholder: 'Enter email' }
    },
    phone: {
        type: 'phone',
        displayName: 'Phone',
        htmlElement: 'input',
        htmlType: 'tel',
        required: false,
        css: { placeholder: '(555) 123-4567' }
    },
    joinDate: {
        type: 'date',
        displayName: 'Join Date',
        htmlElement: 'input',
        htmlType: 'date',
        required: true,
        css: {}
    },
    salary: {
        type: 'number',
        displayName: 'Salary',
        htmlElement: 'input',
        htmlType: 'number',
        required: false,
        css: { min: '0', step: '0.01' }
    }
};

const mockData = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '(555) 123-4567',
        joinDate: '2023-01-15',
        salary: 75000
    },
    {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '(555) 987-6543',
        joinDate: '2023-03-20',
        salary: 85000
    },
    {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        phone: '(555) 456-7890',
        joinDate: '2022-11-10',
        salary: 65000
    }
];

/**
 * Test Suite for DataGrid Component
 * Follows AAA pattern: Arrange, Act, Assert
 */
class DataGridTestSuite {
    constructor() {
        this.testResults = [];
        this.setupTestEnvironment();
    }

    setupTestEnvironment() {
        // Create test container
        this.testContainer = document.createElement('div');
        this.testContainer.id = 'test-datagrid-container';
        this.testContainer.style.display = 'none'; // Hide during tests
        document.body.appendChild(this.testContainer);

        // Initialize DataGrid instance for testing
        this.dataGrid = new DataGrid(this.testContainer);
        this.dataGrid.schema = { ...mockSchema };
        this.dataGrid.data = [...mockData];
    }

    // ========================================
    // DATA MANAGEMENT TESTS
    // ========================================

    testAddRecord() {
        console.log('🧪 Testing addRecord method...');
        
        // Arrange
        const newRecord = {
            id: 4,
            name: 'Alice Cooper',
            email: 'alice.cooper@example.com',
            phone: '(555) 111-2222',
            joinDate: '2023-06-01',
            salary: 90000
        };
        const initialCount = this.dataGrid.data.length;

        // Act
        const result = this.dataGrid.addRecord(newRecord);

        // Assert
        const assertions = [
            { condition: result === true, message: 'addRecord should return true on success' },
            { condition: this.dataGrid.data.length === initialCount + 1, message: 'Data array length should increase by 1' },
            { condition: this.dataGrid.data[this.dataGrid.data.length - 1].id === 4, message: 'New record should be added at the end' },
            { condition: this.dataGrid.data[this.dataGrid.data.length - 1].name === 'Alice Cooper', message: 'New record should have correct data' }
        ];

        this.recordTestResults('addRecord - Valid Record', assertions);

        // Test invalid record
        const invalidRecord = { name: 'Invalid User' }; // Missing required fields
        const invalidResult = this.dataGrid.addRecord(invalidRecord);
        
        const invalidAssertions = [
            { condition: invalidResult === false, message: 'addRecord should return false for invalid record' },
            { condition: this.dataGrid.data.length === initialCount + 1, message: 'Data array should not change for invalid record' }
        ];

        this.recordTestResults('addRecord - Invalid Record', invalidAssertions);
    }

    testUpdateRecord() {
        console.log('🧪 Testing updateRecord method...');
        
        // Arrange
        const recordId = 1;
        const updates = {
            name: 'John Updated Doe',
            salary: 80000
        };
        const originalRecord = this.dataGrid.data.find(r => r.id === recordId);

        // Act
        const result = this.dataGrid.updateRecord(recordId, updates);

        // Assert
        const updatedRecord = this.dataGrid.data.find(r => r.id === recordId);
        const assertions = [
            { condition: result === true, message: 'updateRecord should return true on success' },
            { condition: updatedRecord.name === 'John Updated Doe', message: 'Record name should be updated' },
            { condition: updatedRecord.salary === 80000, message: 'Record salary should be updated' },
            { condition: updatedRecord.email === originalRecord.email, message: 'Unchanged fields should remain the same' }
        ];

        this.recordTestResults('updateRecord - Valid Update', assertions);

        // Test non-existent record
        const nonExistentResult = this.dataGrid.updateRecord(999, { name: 'Non-existent' });
        const nonExistentAssertions = [
            { condition: nonExistentResult === false, message: 'updateRecord should return false for non-existent record' }
        ];

        this.recordTestResults('updateRecord - Non-existent Record', invalidAssertions);
    }

    testDeleteRecord() {
        console.log('🧪 Testing deleteRecord method...');
        
        // Arrange
        const recordId = 3;
        const initialCount = this.dataGrid.data.length;

        // Act - Soft delete
        const result = this.dataGrid.deleteRecord(recordId, { softDelete: true });

        // Assert
        const deletedRecord = this.dataGrid.data.find(r => r.id === recordId);
        const assertions = [
            { condition: result === true, message: 'deleteRecord should return true on success' },
            { condition: this.dataGrid.data.length === initialCount, message: 'Data array length should remain same for soft delete' },
            { condition: deletedRecord.isDeleted === true, message: 'Record should be marked as deleted' },
            { condition: deletedRecord.deletedAt !== undefined, message: 'Record should have deletedAt timestamp' }
        ];

        this.recordTestResults('deleteRecord - Soft Delete', assertions);

        // Test hard delete
        const hardDeleteResult = this.dataGrid.deleteRecord(recordId, { softDelete: false });
        const hardDeleteAssertions = [
            { condition: hardDeleteResult === true, message: 'Hard delete should return true on success' },
            { condition: this.dataGrid.data.length === initialCount - 1, message: 'Data array length should decrease for hard delete' },
            { condition: !this.dataGrid.data.find(r => r.id === recordId), message: 'Record should be completely removed' }
        ];

        this.recordTestResults('deleteRecord - Hard Delete', hardDeleteAssertions);
    }

    // ========================================
    // SEARCH AND FILTERING TESTS
    // ========================================

    testApplyFilters() {
        console.log('🧪 Testing applyFilters method...');
        
        // Arrange
        const filters = [
            { field: 'salary', operator: '>', value: 70000 }
        ];

        // Act
        const result = this.dataGrid.applyFilters(filters);

        // Assert
        const assertions = [
            { condition: Array.isArray(result), message: 'applyFilters should return an array' },
            { condition: result.length === 2, message: 'Should return 2 records with salary > 70000' },
            { condition: result.every(r => r.salary > 70000), message: 'All returned records should match filter criteria' }
        ];

        this.recordTestResults('applyFilters - Single Filter', assertions);

        // Test multiple filters with AND logic
        const multipleFilters = [
            { field: 'salary', operator: '>', value: 60000 },
            { field: 'joinDate', operator: '>=', value: '2023-01-01' }
        ];

        const multipleResult = this.dataGrid.applyFilters(multipleFilters, { mode: 'AND' });
        const multipleAssertions = [
            { condition: multipleResult.length === 2, message: 'Should return records matching both criteria' },
            { condition: multipleResult.every(r => r.salary > 60000 && r.joinDate >= '2023-01-01'), message: 'All records should match both filters' }
        ];

        this.recordTestResults('applyFilters - Multiple Filters AND', multipleAssertions);
    }

    testSearch() {
        console.log('🧪 Testing search method...');
        
        // Arrange
        const searchTerm = 'john';

        // Act
        const result = this.dataGrid.search(searchTerm);

        // Assert
        const assertions = [
            { condition: Array.isArray(result), message: 'search should return an array' },
            { condition: result.length > 0, message: 'Should find matching records' },
            { condition: result[0].record !== undefined, message: 'Results should contain record objects' },
            { condition: result[0].relevanceScore !== undefined, message: 'Results should contain relevance scores' },
            { condition: result.some(r => r.record.name.toLowerCase().includes('john')), message: 'Should find records containing search term' }
        ];

        this.recordTestResults('search - Basic Text Search', assertions);

        // Test empty search
        const emptyResult = this.dataGrid.search('');
        const emptyAssertions = [
            { condition: Array.isArray(emptyResult), message: 'Empty search should return array' },
            { condition: emptyResult.length === this.dataGrid.data.length, message: 'Empty search should return all records' }
        ];

        this.recordTestResults('search - Empty Search Term', emptyAssertions);
    }

    // ========================================
    // SORTING TESTS
    // ========================================

    testSortBy() {
        console.log('🧪 Testing sortBy method...');
        
        // Arrange - Reset data to known state
        this.dataGrid.data = [...mockData];

        // Act - Sort by name ascending
        const result = this.dataGrid.sortBy('name', 'asc');

        // Assert
        const sortedNames = this.dataGrid.data.map(r => r.name);
        const assertions = [
            { condition: result === true, message: 'sortBy should return true on success' },
            { condition: sortedNames[0] === 'Bob Johnson', message: 'First record should be Bob Johnson' },
            { condition: sortedNames[1] === 'Jane Smith', message: 'Second record should be Jane Smith' },
            { condition: sortedNames[2] === 'John Doe', message: 'Third record should be John Doe' }
        ];

        this.recordTestResults('sortBy - Single Column Ascending', assertions);

        // Test descending sort
        this.dataGrid.sortBy('salary', 'desc');
        const salaryDescAssertions = [
            { condition: this.dataGrid.data[0].salary === 85000, message: 'Highest salary should be first' },
            { condition: this.dataGrid.data[this.dataGrid.data.length - 1].salary === 65000, message: 'Lowest salary should be last' }
        ];

        this.recordTestResults('sortBy - Single Column Descending', salaryDescAssertions);

        // Test multi-column sort
        const multiResult = this.dataGrid.sortBy(['joinDate', 'salary'], ['asc', 'desc']);
        const multiAssertions = [
            { condition: multiResult === true, message: 'Multi-column sort should return true' }
        ];

        this.recordTestResults('sortBy - Multi-column Sort', multiAssertions);
    }

    // ========================================
    // VALIDATION TESTS
    // ========================================

    testValidateRecord() {
        console.log('🧪 Testing validateRecord method...');
        
        // Arrange - Valid record
        const validRecord = {
            id: 5,
            name: 'Test User',
            email: 'test@example.com',
            phone: '(555) 999-8888',
            joinDate: '2023-07-01',
            salary: 70000
        };

        // Act
        const validResult = this.dataGrid.validateRecord(validRecord);

        // Assert
        const validAssertions = [
            { condition: validResult.isValid === true, message: 'Valid record should pass validation' },
            { condition: validResult.errors.length === 0, message: 'Valid record should have no errors' },
            { condition: typeof validResult.fieldErrors === 'object', message: 'Should return fieldErrors object' }
        ];

        this.recordTestResults('validateRecord - Valid Record', validAssertions);

        // Test invalid record
        const invalidRecord = {
            id: 'not-a-number',
            name: '', // Required field empty
            email: 'invalid-email', // Invalid email format
            salary: -1000 // Negative salary
        };

        const invalidResult = this.dataGrid.validateRecord(invalidRecord);
        const invalidAssertions = [
            { condition: invalidResult.isValid === false, message: 'Invalid record should fail validation' },
            { condition: invalidResult.errors.length > 0, message: 'Invalid record should have errors' },
            { condition: Object.keys(invalidResult.fieldErrors).length > 0, message: 'Should have field-specific errors' }
        ];

        this.recordTestResults('validateRecord - Invalid Record', invalidAssertions);
    }

    // ========================================
    // EXPORT/IMPORT TESTS
    // ========================================

    testExportData() {
        console.log('🧪 Testing exportData method...');
        
        // Test CSV export
        const csvPromise = this.dataGrid.exportData('csv', { download: false });
        
        // Since this is async, we'll create a simplified test
        const csvAssertions = [
            { condition: csvPromise instanceof Promise, message: 'exportData should return a Promise' }
        ];

        this.recordTestResults('exportData - CSV Format', csvAssertions);

        // Test JSON export
        const jsonPromise = this.dataGrid.exportData('json', { download: false });
        const jsonAssertions = [
            { condition: jsonPromise instanceof Promise, message: 'JSON export should return a Promise' }
        ];

        this.recordTestResults('exportData - JSON Format', jsonAssertions);
    }

    testImportData() {
        console.log('🧪 Testing importData method...');
        
        // Arrange - Mock import data
        const importData = [
            {
                id: 10,
                name: 'Imported User',
                email: 'imported@example.com',
                joinDate: '2023-08-01',
                salary: 60000
            }
        ];

        // Act
        const importPromise = this.dataGrid.importData(importData, { preview: true });

        // Assert
        const importAssertions = [
            { condition: importPromise instanceof Promise, message: 'importData should return a Promise' }
        ];

        this.recordTestResults('importData - Preview Mode', importAssertions);
    }

    // ========================================
    // UTILITY TESTS
    // ========================================

    testGenerateUniqueId() {
        console.log('🧪 Testing generateUniqueId method...');
        
        // Act
        const id1 = this.dataGrid.generateUniqueId();
        const id2 = this.dataGrid.generateUniqueId();
        const prefixedId = this.dataGrid.generateUniqueId('user_');

        // Assert
        const assertions = [
            { condition: typeof id1 === 'string', message: 'Should return a string' },
            { condition: id1.length > 0, message: 'ID should not be empty' },
            { condition: id1 !== id2, message: 'Generated IDs should be unique' },
            { condition: prefixedId.startsWith('user_'), message: 'Should respect prefix parameter' }
        ];

        this.recordTestResults('generateUniqueId - Basic Functionality', assertions);
    }

    testTriggerEvent() {
        console.log('🧪 Testing triggerEvent method...');
        
        // Arrange
        let eventFired = false;
        let eventDetail = null;

        const eventListener = (e) => {
            eventFired = true;
            eventDetail = e.detail;
        };

        this.testContainer.addEventListener('datagrid:testEvent', eventListener);

        // Act
        this.dataGrid.triggerEvent('testEvent', { test: 'data' });

        // Assert
        const assertions = [
            { condition: eventFired === true, message: 'Event should be fired' },
            { condition: eventDetail !== null, message: 'Event should contain detail data' },
            { condition: eventDetail.test === 'data', message: 'Event detail should contain custom data' },
            { condition: eventDetail.timestamp !== undefined, message: 'Event should include timestamp' },
            { condition: eventDetail.source === 'DataGrid', message: 'Event should identify source' }
        ];

        this.recordTestResults('triggerEvent - Event Firing', assertions);

        // Cleanup
        this.testContainer.removeEventListener('datagrid:testEvent', eventListener);
    }

    // ========================================
    // TEST EXECUTION AND REPORTING
    // ========================================

    recordTestResults(testName, assertions) {
        const passed = assertions.filter(a => a.condition).length;
        const total = assertions.length;
        const success = passed === total;

        this.testResults.push({
            testName,
            success,
            passed,
            total,
            assertions: assertions.map(a => ({
                passed: a.condition,
                message: a.message
            }))
        });

        console.log(`${success ? '✅' : '❌'} ${testName}: ${passed}/${total} assertions passed`);
        
        if (!success) {
            const failedAssertions = assertions.filter(a => !a.condition);
            failedAssertions.forEach(assertion => {
                console.log(`   ❌ ${assertion.message}`);
            });
        }
    }

    runAllTests() {
        console.log('🚀 Starting DataGrid Test Suite...\n');

        try {
            // Data Management Tests
            this.testAddRecord();
            this.testUpdateRecord();
            this.testDeleteRecord();

            // Search and Filtering Tests
            this.testApplyFilters();
            this.testSearch();

            // Sorting Tests
            this.testSortBy();

            // Validation Tests
            this.testValidateRecord();

            // Export/Import Tests
            this.testExportData();
            this.testImportData();

            // Utility Tests
            this.testGenerateUniqueId();
            this.testTriggerEvent();

            this.generateTestReport();
        } catch (error) {
            console.error('❌ Test suite execution failed:', error);
        }
    }

    generateTestReport() {
        console.log('\n📊 TEST REPORT');
        console.log('================');

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(t => t.success).length;
        const failedTests = totalTests - passedTests;

        const totalAssertions = this.testResults.reduce((sum, t) => sum + t.total, 0);
        const passedAssertions = this.testResults.reduce((sum, t) => sum + t.passed, 0);

        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
        console.log(`Failed: ${failedTests}`);
        console.log(`\nTotal Assertions: ${totalAssertions}`);
        console.log(`Passed Assertions: ${passedAssertions} (${Math.round(passedAssertions/totalAssertions*100)}%)`);

        if (failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults.filter(t => !t.success).forEach(test => {
                console.log(`  - ${test.testName} (${test.passed}/${test.total})`);
            });
        }

        console.log('\n✨ Test suite completed!');
    }

    cleanup() {
        if (this.testContainer && this.testContainer.parentNode) {
            this.testContainer.parentNode.removeChild(this.testContainer);
        }
    }
}

// Usage example and automatic test execution
if (typeof window !== 'undefined') {
    // Browser environment - wait for DataGrid to be available
    window.addEventListener('DOMContentLoaded', () => {
        if (typeof DataGrid !== 'undefined') {
            const testSuite = new DataGridTestSuite();
            
            // You can run tests manually or automatically
            // testSuite.runAllTests();
            
            // Make test suite available globally for manual testing
            window.DataGridTestSuite = testSuite;
            
            console.log('🧪 DataGrid Test Suite ready! Run tests with: window.DataGridTestSuite.runAllTests()');
        }
    });
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataGridTestSuite;
}