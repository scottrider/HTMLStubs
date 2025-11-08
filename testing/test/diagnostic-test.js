// Diagnostic Test for Soft Delete Issue
// This test specifically focuses on the exact codepath used in the position-management.html

console.log('🔍 Starting Diagnostic Test for Soft Delete Issue...\n');

// Import the test data from the main test file
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
    position: { 
        type: 'string', 
        displayName: 'Position', 
        htmlElement: 'input', 
        htmlType: 'text', 
        required: true,
        searchable: true,
        canFilter: true,
        css: { placeholder: 'Enter position title' } 
    },
    company: { 
        type: 'string', 
        displayName: 'Company', 
        htmlElement: 'input', 
        htmlType: 'text', 
        required: true,
        searchable: true,
        canFilter: true,
        css: { placeholder: 'Enter company name' } 
    }
};

const testData = [
    { id: 1, position: "Senior Software Engineer", company: "TechCorp Inc", isDisabled: false },
    { id: 2, position: "Product Manager", company: "InnovateHub", isDisabled: false },
    { id: 3, position: "UX Designer", company: "DesignWorks Studio", isDisabled: true },
    { id: 4, position: "DevOps Engineer", company: "CloudTech Solutions", isDisabled: false },
    { id: 5, position: "Data Scientist", company: "Analytics Pro", isDisabled: false }
];

function diagnosticTest() {
    return new Promise(async (resolve) => {
        console.log('📊 Test Data:');
        console.log(JSON.stringify(testData, null, 2));
        console.log('\n🏗️ Creating DataGridPaginator...');
        
        // Mimic the exact configuration from position-management.html
        const paginatorConfig = {
            schema: testSchema,
            data: [...testData], // Create a copy like the real implementation
            pageSize: 5,
            showCheckboxes: true,
            onDeleteRecord: async (index, record) => {
                console.log(`🗑️ onDeleteRecord called - index: ${index}, record:`, record);
                console.log(`📍 Record before modification:`, JSON.stringify(record));
                
                // Find the actual record in the data array
                const dataIndex = paginator.config.data.findIndex(p => p.id === record.id);
                console.log(`🔍 Found record at dataIndex: ${dataIndex}`);
                
                if (dataIndex !== -1) {
                    console.log(`📝 Setting isDisabled = true for record at index ${dataIndex}`);
                    paginator.config.data[dataIndex].isDisabled = true;
                    console.log(`✅ Record after modification:`, JSON.stringify(paginator.config.data[dataIndex]));
                    
                    console.log(`🔄 Calling filterData()...`);
                    paginator.filteredData = paginator.filterData();
                    console.log(`📊 Filtered data after update:`, JSON.stringify(paginator.filteredData));
                    
                    console.log(`🖼️ Calling render()...`);
                    // Note: We'll skip actual render since we don't have DOM in this test
                    // paginator.render();
                    
                    console.log(`✅ Soft delete process completed`);
                } else {
                    console.error(`❌ Could not find record ${record.id} in data array`);
                }
            }
        };
        
        console.log(`📋 Config:`, JSON.stringify(paginatorConfig, null, 2));
        
        // Create the paginator
        const paginator = new DataGridPaginator(paginatorConfig);
        
        console.log('\n📈 Initial State:');
        console.log(`🔢 Total records: ${paginator.config.data.length}`);
        console.log(`👁️ Show disabled: ${paginator.showDisabled}`);
        console.log(`📊 Filtered data length: ${paginator.filteredData.length}`);
        console.log(`🗂️ Filtered data:`, JSON.stringify(paginator.filteredData.map(r => ({ id: r.id, position: r.position, isDisabled: r.isDisabled }))));
        
        console.log('\n🧪 Test 1: Manual soft delete simulation');
        console.log('Setting record ID 1 (Senior Software Engineer) as disabled...');
        
        // Find the record
        const targetRecord = paginator.config.data.find(r => r.id === 1);
        if (targetRecord) {
            console.log(`📍 Target record before:`, JSON.stringify(targetRecord));
            
            // Call the onDeleteRecord handler directly (simulating what happens in the UI)
            const recordIndex = paginator.config.data.findIndex(r => r.id === 1);
            await paginatorConfig.onDeleteRecord(recordIndex, targetRecord);
            
            console.log(`📍 Target record after:`, JSON.stringify(targetRecord));
            console.log(`📊 Full data array after:`, JSON.stringify(paginator.config.data.map(r => ({ id: r.id, isDisabled: r.isDisabled }))));
            
            // Check if the record is filtered out
            const isInFiltered = paginator.filteredData.some(r => r.id === 1);
            console.log(`🔍 Is record ID 1 still in filtered data? ${isInFiltered}`);
            
            if (isInFiltered) {
                console.error(`❌ PROBLEM FOUND: Record is still in filtered data even though it should be hidden!`);
                console.log(`🔍 Current filter state: showDisabled = ${paginator.showDisabled}`);
                console.log(`🔍 Record isDisabled value: ${targetRecord.isDisabled}`);
                
                // Debug the filter logic
                console.log('\n🔍 Debugging filter logic...');
                const filterResult = paginator.config.data.filter(record => {
                    const passesDisabledFilter = paginator.showDisabled ? (record.isDisabled === true) : (record.isDisabled === false);
                    console.log(`📋 Record ${record.id}: isDisabled=${record.isDisabled}, showDisabled=${paginator.showDisabled}, passes=${passesDisabledFilter}`);
                    return passesDisabledFilter;
                });
                console.log(`🔍 Manual filter result:`, JSON.stringify(filterResult.map(r => ({ id: r.id, isDisabled: r.isDisabled }))));
                
            } else {
                console.log(`✅ SUCCESS: Record was correctly filtered out!`);
            }
        } else {
            console.error(`❌ Could not find target record`);
        }
        
        console.log('\n🧪 Test 2: Bulk delete simulation');
        console.log('Setting records ID 2 and 3 as disabled...');
        
        const selectedIndexes = [1, 2]; // Indexes in the current data array
        selectedIndexes.forEach(index => {
            const record = paginator.config.data[index];
            if (record) {
                console.log(`🗑️ Disabling record ${record.id}: ${record.position}`);
                paginator.config.data[index].isDisabled = true;
            }
        });
        
        // Update filtered data
        paginator.filteredData = paginator.filterData();
        
        console.log(`📊 Filtered data after bulk delete:`, JSON.stringify(paginator.filteredData.map(r => ({ id: r.id, position: r.position, isDisabled: r.isDisabled }))));
        console.log(`🔢 Filtered data length: ${paginator.filteredData.length}`);
        
        // Expected: Should only have records 5 (Data Scientist) since 1,2,3 are disabled and 4 was already disabled
        const expectedEnabled = paginator.config.data.filter(r => !r.isDisabled);
        console.log(`✅ Expected enabled records:`, JSON.stringify(expectedEnabled.map(r => ({ id: r.id, position: r.position }))));
        
        if (paginator.filteredData.length === expectedEnabled.length) {
            console.log(`✅ Bulk delete test PASSED`);
        } else {
            console.error(`❌ Bulk delete test FAILED: Expected ${expectedEnabled.length} records, got ${paginator.filteredData.length}`);
        }
        
        console.log('\n🧪 Test 3: Toggle to show disabled records');
        paginator.toggleDisabledFilter();
        console.log(`📊 After toggle - showing disabled: ${paginator.showDisabled}`);
        console.log(`📊 Filtered data (disabled):`, JSON.stringify(paginator.filteredData.map(r => ({ id: r.id, position: r.position, isDisabled: r.isDisabled }))));
        
        // Should show records 1, 2, 3, 4 (all disabled)
        const expectedDisabled = paginator.config.data.filter(r => r.isDisabled);
        console.log(`✅ Expected disabled records:`, JSON.stringify(expectedDisabled.map(r => ({ id: r.id, position: r.position }))));
        
        if (paginator.filteredData.length === expectedDisabled.length) {
            console.log(`✅ Toggle test PASSED`);
        } else {
            console.error(`❌ Toggle test FAILED: Expected ${expectedDisabled.length} records, got ${paginator.filteredData.length}`);
        }
        
        console.log('\n📋 Final Summary:');
        console.log(`🔢 Total records in data: ${paginator.config.data.length}`);
        console.log(`🟢 Enabled records: ${paginator.config.data.filter(r => !r.isDisabled).length}`);
        console.log(`🔴 Disabled records: ${paginator.config.data.filter(r => r.isDisabled).length}`);
        console.log(`👁️ Currently showing: ${paginator.showDisabled ? 'disabled' : 'enabled'} records`);
        console.log(`📊 Filtered data count: ${paginator.filteredData.length}`);
        
        resolve(paginator);
    });
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.DiagnosticTest = {
        run: diagnosticTest,
        testData,
        testSchema
    };
}

// Auto-run if DataGridPaginator is available
if (typeof window !== 'undefined' && window.DataGridPaginator) {
    console.log('🚀 Running diagnostic test...');
    diagnosticTest();
} else if (typeof window !== 'undefined') {
    console.log('⏳ Waiting for DataGridPaginator to be available...');
    window.addEventListener('load', () => {
        if (window.DataGridPaginator) {
            diagnosticTest();
        } else {
            console.error('❌ DataGridPaginator not found');
        }
    });
}