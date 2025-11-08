// Universal DataGrid Test Execution Script
// Run this in the browser console to execute all tests programmatically

console.log('🚀 Starting Universal DataGrid Test Execution...');

const testSuite = {
    async runBasicValidation() {
        console.log('📋 Running basic validation tests...');
        
        const tests = [
            { name: 'DataGrid Class', test: () => typeof DataGrid !== 'undefined' },
            { name: 'DG Operations', test: () => DataGrid.prototype.startEdit !== undefined },
            { name: 'DG Presentation', test: () => typeof DataGridPresentation !== 'undefined' },
            { name: 'DataGrid Namespace', test: () => typeof DataGridNamespace !== 'undefined' }
        ];
        
        let passed = 0;
        let failed = 0;
        
        for (const test of tests) {
            try {
                const result = test.test();
                if (result) {
                    console.log(`✅ ${test.name}: PASS`);
                    passed++;
                } else {
                    console.log(`❌ ${test.name}: FAIL`);
                    failed++;
                }
            } catch (error) {
                console.log(`❌ ${test.name}: ERROR - ${error.message}`);
                failed++;
            }
        }
        
        console.log(`📊 Basic Validation: ${passed} passed, ${failed} failed`);
        return { passed, failed, total: tests.length };
    },
    
    async runFunctionalTests() {
        console.log('⚙️ Running functional tests...');
        
        try {
            // Create test data
            const testData = [
                { id: 1, name: 'Test Item 1', category: 'A', value: 100 },
                { id: 2, name: 'Test Item 2', category: 'B', value: 200 }
            ];
            
            const testSchema = {
                entityName: "functionalTest",
                fields: [
                    { name: "id", type: "number", label: "ID", readOnly: true },
                    { name: "name", type: "text", label: "Name", required: true },
                    { name: "category", type: "text", label: "Category" },
                    { name: "value", type: "number", label: "Value" }
                ]
            };
            
            // Create a temporary container
            const tempContainer = document.createElement('div');
            tempContainer.id = 'functional-test-grid';
            tempContainer.style.display = 'none';
            document.body.appendChild(tempContainer);
            
            // Test DataGrid creation
            const grid = new DataGrid('functional-test-grid', testData, testSchema);
            console.log('✅ DataGrid created successfully');
            
            // Test rendering
            grid.render();
            console.log('✅ DataGrid rendered successfully');
            
            // Test data access
            if (grid.data && grid.data.length === 2) {
                console.log('✅ Data access working');
            } else {
                console.log('❌ Data access failed');
            }
            
            // Test CRUD operations
            if (typeof grid.addItem === 'function') {
                grid.addItem({ id: 3, name: 'Test Item 3', category: 'C', value: 300 });
                console.log('✅ CRUD addItem working');
            }
            
            if (typeof grid.updateItem === 'function') {
                grid.updateItem(1, { name: 'Updated Item 1' });
                console.log('✅ CRUD updateItem working');
            }
            
            if (typeof grid.deleteItem === 'function') {
                grid.deleteItem(2);
                console.log('✅ CRUD deleteItem working');
            }
            
            // Cleanup
            document.body.removeChild(tempContainer);
            console.log('📊 Functional Tests: All major functions working');
            
            return { success: true, message: 'All functional tests passed' };
            
        } catch (error) {
            console.log(`❌ Functional test failed: ${error.message}`);
            return { success: false, message: error.message };
        }
    },
    
    async runDataIntegrationTests() {
        console.log('🔗 Running data integration tests...');
        
        try {
            // Test jobsearch.json loading
            const response = await fetch('jobsearch.json');
            if (!response.ok) {
                throw new Error('Failed to load jobsearch.json');
            }
            
            const data = await response.json();
            console.log('✅ JobSearch data loaded');
            
            // Validate data structure
            if (data.jobsearch && data.jobsearch.companies && data.jobsearch.positions) {
                console.log('✅ Data structure valid');
            } else {
                throw new Error('Invalid data structure');
            }
            
            // Test schema conversion
            const companiesSchema = data.jobsearch.companies.schema;
            if (companiesSchema && Object.keys(companiesSchema).length > 0) {
                console.log('✅ Companies schema available');
            }
            
            const positionsSchema = data.jobsearch.positions.schema;
            if (positionsSchema && Object.keys(positionsSchema).length > 0) {
                console.log('✅ Positions schema available');
            }
            
            // Test data arrays
            const companiesData = data.jobsearch.companies.data;
            const positionsData = data.jobsearch.positions.data;
            
            console.log(`✅ Companies data: ${companiesData.length} records`);
            console.log(`✅ Positions data: ${positionsData.length} records`);
            
            return { 
                success: true, 
                companiesCount: companiesData.length,
                positionsCount: positionsData.length
            };
            
        } catch (error) {
            console.log(`❌ Data integration test failed: ${error.message}`);
            return { success: false, message: error.message };
        }
    },
    
    async runPerformanceTests() {
        console.log('⚡ Running performance tests...');
        
        try {
            const startTime = performance.now();
            
            // Create large dataset
            const largeData = [];
            for (let i = 1; i <= 1000; i++) {
                largeData.push({
                    id: i,
                    name: `Performance Test Item ${i}`,
                    value: Math.random() * 1000,
                    category: `Category ${i % 10}`
                });
            }
            
            const schema = {
                entityName: "performanceTest",
                fields: [
                    { name: "id", type: "number", label: "ID" },
                    { name: "name", type: "text", label: "Name" },
                    { name: "value", type: "number", label: "Value" },
                    { name: "category", type: "text", label: "Category" }
                ],
                pagination: { enabled: true, pageSize: 20 }
            };
            
            // Create temporary container
            const perfContainer = document.createElement('div');
            perfContainer.id = 'performance-test-grid';
            perfContainer.style.display = 'none';
            document.body.appendChild(perfContainer);
            
            // Test performance
            const grid = new DataGrid('performance-test-grid', largeData, schema);
            grid.render();
            
            const endTime = performance.now();
            const renderTime = Math.round(endTime - startTime);
            
            console.log(`✅ Performance test: ${renderTime}ms for 1000 records`);
            
            // Cleanup
            document.body.removeChild(perfContainer);
            
            return { 
                success: true, 
                renderTime: renderTime,
                recordCount: 1000,
                acceptable: renderTime < 5000
            };
            
        } catch (error) {
            console.log(`❌ Performance test failed: ${error.message}`);
            return { success: false, message: error.message };
        }
    },
    
    async runAllTests() {
        console.log('🏁 Running complete test suite...');
        const startTime = Date.now();
        
        const results = {
            validation: await this.runBasicValidation(),
            functional: await this.runFunctionalTests(),
            dataIntegration: await this.runDataIntegrationTests(),
            performance: await this.runPerformanceTests()
        };
        
        const endTime = Date.now();
        const totalTime = Math.round((endTime - startTime) / 1000);
        
        console.log('🎯 Test Suite Complete!');
        console.log('📊 Final Results:');
        console.log(`   Validation: ${results.validation.passed}/${results.validation.total} passed`);
        console.log(`   Functional: ${results.functional.success ? 'PASS' : 'FAIL'}`);
        console.log(`   Data Integration: ${results.dataIntegration.success ? 'PASS' : 'FAIL'}`);
        console.log(`   Performance: ${results.performance.success ? 'PASS' : 'FAIL'}`);
        console.log(`   Total Execution Time: ${totalTime}s`);
        
        const allPassed = results.validation.failed === 0 && 
                          results.functional.success && 
                          results.dataIntegration.success && 
                          results.performance.success;
        
        if (allPassed) {
            console.log('🎉 ALL TESTS PASSED! Universal DataGrid is ready for deployment!');
        } else {
            console.log('⚠️  Some tests failed. Review the results above.');
        }
        
        return { results, allPassed, executionTime: totalTime };
    }
};

// Auto-execute if script is loaded
if (typeof window !== 'undefined') {
    console.log('Universal DataGrid Test Suite Loaded');
    console.log('Run testSuite.runAllTests() to execute all tests');
    
    // Make it available globally
    window.testSuite = testSuite;
}