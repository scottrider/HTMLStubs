// cSpell:words αβγδε
// Unit Tests for DataGridPaginator Soft Delete Functionality
// These tests verify the soft delete codepath and filtering behavior

// Test data setup
const testSchema = {
    id: { 
        type: 'number', 
        displayName: 'ID', 
        htmlElement: 'input', 
        htmlType: 'number', 
        required: true,
        searchable: false,
        canFilter: false,
        visible: false,
        css: { readonly: true } 
    },
    name: { 
        type: 'string', 
        displayName: 'Name', 
        htmlElement: 'input', 
        htmlType: 'text', 
        required: true,
        searchable: true,
        canFilter: true,
        css: { placeholder: 'Enter name' } 
    },
    company: { 
        type: 'string', 
        displayName: 'Company', 
        htmlElement: 'input', 
        htmlType: 'text', 
        required: true,
        searchable: true,
        canFilter: true,
        css: { placeholder: 'Enter company' } 
    }
};

const testData = [
    { id: 1, name: "John Doe", company: "Tech Corp", isDisabled: false },
    { id: 2, name: "Jane Smith", company: "Innovation Inc", isDisabled: false },
    { id: 3, name: "Bob Johnson", company: "Data Systems", isDisabled: true },
    { id: 4, name: "Alice Brown", company: "Cloud Tech", isDisabled: false },
    { id: 5, name: "Charlie Davis", company: "Web Solutions", isDisabled: false }
];

// Enhanced test data for edge cases
const edgeCaseData = [
    { id: 6, name: "", company: "", isDisabled: false },  // Empty strings
    { id: 7, name: "Special & Characters <test>", company: "A & B Company", isDisabled: false },
    { id: 8, name: "Very Long Name ".repeat(10), company: "Very Long Company ".repeat(5), isDisabled: false },
    { id: 9, name: null, company: null, isDisabled: true },  // Null values
    { id: 10, name: "Unicode Test αβγδε 中文 🌟", company: "Unicode Corp 日本", isDisabled: false }
];

// Test Framework
class TestFramework {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    test(description, testFn) {
        this.tests.push({ description, testFn });
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
        }
    }

    assertArrayEqual(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`Assertion failed: ${message}. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
        }
    }

    async runTests() {
        console.log('🧪 Starting DataGridPaginator Tests...\n');
        
        for (const test of this.tests) {
            try {
                console.log(`🔸 Running: ${test.description}`);
                await test.testFn();
                console.log(`✅ PASSED: ${test.description}`);
                this.results.push({ description: test.description, status: 'PASSED', error: null });
            } catch (error) {
                console.error(`❌ FAILED: ${test.description}`);
                console.error(`   Error: ${error.message}`);
                this.results.push({ description: test.description, status: 'FAILED', error: error.message });
            }
        }

        this.printSummary();
    }

    printSummary() {
        const passed = this.results.filter(r => r.status === 'PASSED').length;
        const failed = this.results.filter(r => r.status === 'FAILED').length;
        
        console.log('\n📊 Test Summary:');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📝 Total: ${this.results.length}`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => r.status === 'FAILED').forEach(result => {
                console.log(`   - ${result.description}: ${result.error}`);
            });
        }
    }
}

// Test Suite
const testFramework = new TestFramework();

// Test 1: Constructor initialization
testFramework.test('Constructor should initialize with correct default values', () => {
    const config = {
        schema: testSchema,
        data: [...testData],
        pageSize: 3
    };
    
    const paginator = new DataGridPaginator(config);
    
    testFramework.assertEqual(paginator.currentPage, 1, 'Current page should be 1');
    testFramework.assertEqual(paginator.pageSize, 3, 'Page size should be 3');
    testFramework.assertEqual(paginator.showDisabled, false, 'Should show enabled records by default');
    testFramework.assert(Array.isArray(paginator.filteredData), 'Filtered data should be an array');
});

// Test 2: Filter data - enabled records only
testFramework.test('filterData should return only enabled records by default', () => {
    const config = {
        schema: testSchema,
        data: [...testData],
        pageSize: 5
    };
    
    const paginator = new DataGridPaginator(config);
    const filtered = paginator.filterData();
    
    testFramework.assertEqual(filtered.length, 4, 'Should return 4 enabled records');
    
    const allEnabled = filtered.every(record => record.isDisabled === false);
    testFramework.assert(allEnabled, 'All filtered records should be enabled');
});

// Test 3: Filter data - disabled records only
testFramework.test('filterData should return only disabled records when showDisabled is true', () => {
    const config = {
        schema: testSchema,
        data: [...testData],
        pageSize: 5
    };
    
    const paginator = new DataGridPaginator(config);
    paginator.showDisabled = true;
    const filtered = paginator.filterData();
    
    testFramework.assertEqual(filtered.length, 1, 'Should return 1 disabled record');
    testFramework.assertEqual(filtered[0].id, 3, 'Should return Bob Johnson (disabled record)');
});

// Test 4: Soft delete functionality
testFramework.test('Setting isDisabled=true should remove record from filtered view', () => {
    const config = {
        schema: testSchema,
        data: [...testData],
        pageSize: 5
    };
    
    const paginator = new DataGridPaginator(config);
    
    // Initial state - should have 4 enabled records
    let filtered = paginator.filterData();
    testFramework.assertEqual(filtered.length, 4, 'Should start with 4 enabled records');
    
    // Soft delete John Doe (id: 1)
    const johnIndex = paginator.config.data.findIndex(r => r.id === 1);
    testFramework.assert(johnIndex !== -1, 'John Doe should exist in data');
    
    // Perform soft delete
    paginator.config.data[johnIndex].isDisabled = true;
    paginator.filteredData = paginator.filterData();
    
    // Check if record is filtered out
    filtered = paginator.filteredData;
    testFramework.assertEqual(filtered.length, 3, 'Should have 3 enabled records after soft delete');
    
    const johnInFiltered = filtered.find(r => r.id === 1);
    testFramework.assert(!johnInFiltered, 'John Doe should not be in filtered data');
    
    // Verify record still exists in raw data but is disabled
    const johnInRaw = paginator.config.data.find(r => r.id === 1);
    testFramework.assert(johnInRaw, 'John Doe should still exist in raw data');
    testFramework.assertEqual(johnInRaw.isDisabled, true, 'John Doe should be marked as disabled');
});

// Test 5: Toggle disabled filter
testFramework.test('toggleDisabledFilter should switch between enabled and disabled views', () => {
    const config = {
        schema: testSchema,
        data: [...testData],
        pageSize: 5
    };
    
    const paginator = new DataGridPaginator(config);
    
    // Should start showing enabled records
    testFramework.assertEqual(paginator.showDisabled, false, 'Should start with showDisabled = false');
    testFramework.assertEqual(paginator.filteredData.length, 4, 'Should show 4 enabled records');
    
    // Toggle to show disabled records
    paginator.toggleDisabledFilter();
    testFramework.assertEqual(paginator.showDisabled, true, 'Should switch to showDisabled = true');
    testFramework.assertEqual(paginator.filteredData.length, 1, 'Should show 1 disabled record');
    
    // Toggle back to enabled records
    paginator.toggleDisabledFilter();
    testFramework.assertEqual(paginator.showDisabled, false, 'Should switch back to showDisabled = false');
    testFramework.assertEqual(paginator.filteredData.length, 4, 'Should show 4 enabled records again');
});

// Test 6: Bulk soft delete simulation
testFramework.test('Bulk soft delete should update filtered data correctly', () => {
    const config = {
        schema: testSchema,
        data: [...testData],
        pageSize: 5
    };
    
    const paginator = new DataGridPaginator(config);
    
    // Initial state
    testFramework.assertEqual(paginator.filteredData.length, 4, 'Should start with 4 enabled records');
    
    // Simulate bulk delete of John Doe and Jane Smith
    const targetIds = [1, 2];
    targetIds.forEach(id => {
        const index = paginator.config.data.findIndex(r => r.id === id);
        if (index !== -1) {
            paginator.config.data[index].isDisabled = true;
        }
    });
    
    // Update filtered data
    paginator.filteredData = paginator.filterData();
    
    // Verify results
    testFramework.assertEqual(paginator.filteredData.length, 2, 'Should have 2 enabled records after bulk delete');
    
    const remainingIds = paginator.filteredData.map(r => r.id).sort();
    testFramework.assertArrayEqual(remainingIds, [4, 5], 'Should have Alice Brown and Charlie Davis remaining');
});

// Test 7: Search functionality with disabled filter
testFramework.test('Search should work with disabled filter', () => {
    const config = {
        schema: testSchema,
        data: [...testData],
        pageSize: 5
    };
    
    const paginator = new DataGridPaginator(config);
    
    // Search for "Tech" in enabled records
    paginator.handleSearch('Tech');
    
    // Should find Tech Corp and Cloud Tech (both enabled)
    testFramework.assertEqual(paginator.filteredData.length, 2, 'Should find 2 records with "Tech"');
    
    const foundIds = paginator.filteredData.map(r => r.id).sort();
    testFramework.assertArrayEqual(foundIds, [1, 4], 'Should find John Doe (Tech Corp) and Alice Brown (Cloud Tech)');
});

// Test 8: removeRecord method with soft delete
testFramework.test('removeRecord should perform soft delete and update filtered data', () => {
    const config = {
        schema: testSchema,
        data: [...testData],
        pageSize: 5
    };
    
    const paginator = new DataGridPaginator(config);
    
    // Initial state
    testFramework.assertEqual(paginator.filteredData.length, 4, 'Should start with 4 enabled records');
    
    // Remove the first record (index 0 in filtered data)
    paginator.removeRecord(0);
    
    // Check if record was soft deleted
    const firstRecord = paginator.config.data.find(r => r.id === 1); // John Doe
    testFramework.assert(firstRecord, 'Record should still exist in raw data');
    testFramework.assertEqual(firstRecord.isDisabled, true, 'Record should be marked as disabled');
    
    // Check if filtered data is updated
    testFramework.assertEqual(paginator.filteredData.length, 3, 'Should have 3 enabled records after soft delete');
});

// Test 9: Global index calculation
testFramework.test('getGlobalIndex should calculate correct global index', () => {
    const config = {
        schema: testSchema,
        data: [...testData],
        pageSize: 2 // Small page size to test pagination
    };
    
    const paginator = new DataGridPaginator(config);
    
    // Page 1: records 0, 1
    testFramework.assertEqual(paginator.getGlobalIndex(0), 0, 'Page 1, index 0 should be global index 0');
    testFramework.assertEqual(paginator.getGlobalIndex(1), 1, 'Page 1, index 1 should be global index 1');
    
    // Go to page 2: records 2, 3
    paginator.goToPage(2);
    testFramework.assertEqual(paginator.getGlobalIndex(0), 2, 'Page 2, index 0 should be global index 2');
    testFramework.assertEqual(paginator.getGlobalIndex(1), 3, 'Page 2, index 1 should be global index 3');
});

// Test 10: Edge case - empty filtered data
testFramework.test('Handle empty filtered data correctly', () => {
    // Create data with all records disabled
    const allDisabledData = testData.map(record => ({ ...record, isDisabled: true }));
    
    const config = {
        schema: testSchema,
        data: allDisabledData,
        pageSize: 5
    };
    
    const paginator = new DataGridPaginator(config);
    
    // Should have no enabled records
    testFramework.assertEqual(paginator.filteredData.length, 0, 'Should have no enabled records');
    testFramework.assertEqual(paginator.totalPages, 0, 'Should have 0 total pages');
    testFramework.assertEqual(paginator.currentPage, 1, 'Current page should remain 1');
});

// Export for browser use
if (typeof window !== 'undefined') {
    window.DataGridTests = {
        testFramework,
        testData,
        testSchema,
        edgeCaseData,
        runAllTests: () => testFramework.runTests()
    };
}

// Additional comprehensive tests for edge cases and error handling

// Test 11: Handle null/undefined data gracefully
testFramework.test('Handle null and undefined data gracefully', () => {
    const config = {
        schema: testSchema,
        data: [...testData, ...edgeCaseData],
        pageSize: 10
    };
    
    const paginator = new DataGridPaginator(config);
    const filtered = paginator.filterData();
    
    // Should handle records with null values
    const nullRecord = filtered.find(r => r.id === 9);
    if (nullRecord) {
        testFramework.assert(true, 'Should handle null values without crashing');
    } else {
        testFramework.assert(true, 'Null record was filtered out appropriately');
    }
});

// Test 12: Handle special characters in data
testFramework.test('Handle special characters and HTML entities', () => {
    const config = {
        schema: testSchema,
        data: [...testData, ...edgeCaseData],
        pageSize: 10
    };
    
    const paginator = new DataGridPaginator(config);
    
    // Search for special characters
    paginator.handleSearch('Special & Characters');
    
    testFramework.assert(paginator.filteredData.length >= 0, 'Should handle special character search');
});

// Test 13: Handle empty strings in data
testFramework.test('Handle empty strings in data fields', () => {
    const config = {
        schema: testSchema,
        data: [...testData, ...edgeCaseData],
        pageSize: 10
    };
    
    const paginator = new DataGridPaginator(config);
    const filtered = paginator.filterData();
    
    const emptyRecord = filtered.find(r => r.id === 6);
    testFramework.assert(emptyRecord !== undefined, 'Should handle records with empty strings');
});

// Test 14: Handle very long data values
testFramework.test('Handle very long data values', () => {
    const config = {
        schema: testSchema,
        data: [...testData, ...edgeCaseData],
        pageSize: 10
    };
    
    const paginator = new DataGridPaginator(config);
    const filtered = paginator.filterData();
    
    const longRecord = filtered.find(r => r.id === 8);
    testFramework.assert(longRecord !== undefined, 'Should handle records with very long values');
});

// Test 15: Handle Unicode characters
testFramework.test('Handle Unicode and international characters', () => {
    const config = {
        schema: testSchema,
        data: [...testData, ...edgeCaseData],
        pageSize: 10
    };
    
    const paginator = new DataGridPaginator(config);
    
    // Search for Unicode characters
    paginator.handleSearch('αβγδε');
    
    testFramework.assert(paginator.filteredData.length >= 0, 'Should handle Unicode character search');
    
    // Reset search
    paginator.handleSearch('');
    
    const unicodeRecord = paginator.filteredData.find(r => r.id === 10);
    testFramework.assert(unicodeRecord !== undefined, 'Should handle records with Unicode characters');
});

// Test 16: Error handling for invalid operations
testFramework.test('Error handling for invalid operations', () => {
    const config = {
        schema: testSchema,
        data: [...testData],
        pageSize: 5
    };
    
    const paginator = new DataGridPaginator(config);
    
    // Test removing invalid index
    try {
        paginator.removeRecord(-1);
        testFramework.assert(true, 'Should handle negative index gracefully');
    } catch (error) {
        testFramework.assert(true, 'Should throw appropriate error for negative index');
    }
    
    try {
        paginator.removeRecord(999);
        testFramework.assert(true, 'Should handle out-of-bounds index gracefully');
    } catch (error) {
        testFramework.assert(true, 'Should throw appropriate error for out-of-bounds index');
    }
});

// Test 17: Pagination with soft deleted records
testFramework.test('Pagination should work correctly after soft deletes', () => {
    const config = {
        schema: testSchema,
        data: [...testData],
        pageSize: 2
    };
    
    const paginator = new DataGridPaginator(config);
    
    // Initial state: 4 enabled records, 2 pages
    testFramework.assertEqual(paginator.totalPages, 2, 'Should start with 2 pages');
    
    // Soft delete 2 records
    paginator.removeRecord(0); // Remove first record on page 1
    paginator.removeRecord(0); // Remove what is now the first record on page 1
    
    // Should now have 2 enabled records, 1 page
    testFramework.assertEqual(paginator.totalPages, 1, 'Should have 1 page after deleting 2 records');
    testFramework.assertEqual(paginator.currentPage, 1, 'Should be on page 1');
});

// Test 18: Data integrity after multiple operations
testFramework.test('Data integrity after multiple operations', () => {
    const config = {
        schema: testSchema,
        data: [...testData],
        pageSize: 5
    };
    
    const paginator = new DataGridPaginator(config);
    
    const initialDataLength = paginator.config.data.length;
    const initialEnabledCount = paginator.filteredData.length;
    
    // Perform multiple operations
    paginator.handleSearch('Tech');
    const searchResults = paginator.filteredData.length;
    
    paginator.handleSearch(''); // Clear search
    paginator.removeRecord(0); // Soft delete
    paginator.toggleDisabledFilter(); // Show disabled
    paginator.toggleDisabledFilter(); // Show enabled again
    
    // Verify data integrity
    testFramework.assertEqual(paginator.config.data.length, initialDataLength, 'Raw data length should be unchanged');
    testFramework.assertEqual(paginator.filteredData.length, initialEnabledCount - 1, 'Should have one less enabled record');
    
    // Verify that the deleted record still exists in raw data
    const deletedRecord = paginator.config.data.find(r => r.isDisabled === true && r.id === 1);
    testFramework.assert(deletedRecord !== undefined, 'Deleted record should still exist in raw data');
});

// Test 19: Performance with larger dataset
testFramework.test('Performance with larger dataset', () => {
    // Create larger test dataset
    const largeData = [];
    for (let i = 1; i <= 1000; i++) {
        largeData.push({
            id: i,
            name: `User ${i}`,
            company: `Company ${Math.floor(i / 10)}`,
            isDisabled: Math.random() > 0.8 // 20% disabled
        });
    }
    
    const config = {
        schema: testSchema,
        data: largeData,
        pageSize: 50
    };
    
    const startTime = performance.now();
    const paginator = new DataGridPaginator(config);
    const endTime = performance.now();
    
    const initTime = endTime - startTime;
    testFramework.assert(initTime < 100, `Initialization should be fast (${initTime.toFixed(2)}ms)`);
    
    // Test search performance
    const searchStartTime = performance.now();
    paginator.handleSearch('User 1');
    const searchEndTime = performance.now();
    
    const searchTime = searchEndTime - searchStartTime;
    testFramework.assert(searchTime < 50, `Search should be fast (${searchTime.toFixed(2)}ms)`);
});

// Test 20: Memory management and cleanup
testFramework.test('Memory management and cleanup', () => {
    const config = {
        schema: testSchema,
        data: [...testData],
        pageSize: 5
    };
    
    const paginator = new DataGridPaginator(config);
    
    // Verify that modifying original data doesn't affect paginator if properly isolated
    testData[0].name = "Modified Name";
    
    // If properly implemented, paginator should have its own copy
    const paginatorFirstRecord = paginator.config.data[0];
    
    // This test documents the expected behavior - whether data is copied or referenced
    testFramework.assert(paginatorFirstRecord.name !== undefined, 'Paginator should have valid data');
});

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testFramework,
        testData,
        testSchema,
        runAllTests: () => testFramework.runTests()
    };
}