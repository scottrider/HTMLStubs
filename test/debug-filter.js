// Debug Test - Minimal test to understand the filtering issue

console.log('🔍 Starting Debug Test for DataGridPaginator filtering...\n');

function debugFilterTest() {
    console.log('📊 Test Data Setup:');
    
    const testData = [
        { id: 1, name: "John", isDisabled: false },
        { id: 2, name: "Jane", isDisabled: false },
        { id: 3, name: "Bob", isDisabled: true },
        { id: 4, name: "Alice", isDisabled: false },
        { id: 5, name: "Charlie", isDisabled: false }
    ];
    
    console.log('Original data:', JSON.stringify(testData.map(r => ({ id: r.id, name: r.name, isDisabled: r.isDisabled }))));
    
    const schema = {
        id: { type: 'number', searchable: false },
        name: { type: 'string', searchable: true }
    };
    
    const config = {
        schema: schema,
        data: [...testData], // Create copy
        pageSize: 5
    };
    
    console.log('\n🏗️ Creating DataGridPaginator...');
    const paginator = new DataGridPaginator(config);
    
    console.log('\n📈 Initial State Analysis:');
    console.log('- showDisabled:', paginator.showDisabled);
    console.log('- searchTerm:', JSON.stringify(paginator.searchTerm));
    console.log('- config.data length:', paginator.config.data.length);
    console.log('- filteredData length:', paginator.filteredData.length);
    
    console.log('\n🔍 Manual Filter Test:');
    console.log('Expected enabled records (isDisabled = false):');
    const expectedEnabled = paginator.config.data.filter(r => !r.isDisabled);
    console.log(JSON.stringify(expectedEnabled.map(r => ({ id: r.id, name: r.name, isDisabled: r.isDisabled }))));
    console.log('Count:', expectedEnabled.length);
    
    console.log('\nExpected disabled records (isDisabled = true):');
    const expectedDisabled = paginator.config.data.filter(r => r.isDisabled);
    console.log(JSON.stringify(expectedDisabled.map(r => ({ id: r.id, name: r.name, isDisabled: r.isDisabled }))));
    console.log('Count:', expectedDisabled.length);
    
    console.log('\n🧪 Testing filterData() method:');
    const filteredResult = paginator.filterData();
    console.log('filterData() result:');
    console.log(JSON.stringify(filteredResult.map(r => ({ id: r.id, name: r.name, isDisabled: r.isDisabled }))));
    console.log('Count:', filteredResult.length);
    
    console.log('\n🔍 Step-by-step filter logic:');
    paginator.config.data.forEach((record, index) => {
        const passesDisabledFilter = paginator.showDisabled ? (record.isDisabled === true) : (record.isDisabled === false);
        console.log(`Record ${record.id} (${record.name}): isDisabled=${record.isDisabled}, showDisabled=${paginator.showDisabled}, passes=${passesDisabledFilter}`);
    });
    
    console.log('\n🧪 Testing soft delete simulation:');
    console.log('Before soft delete - John (id:1):');
    const johnBefore = paginator.config.data.find(r => r.id === 1);
    console.log(JSON.stringify(johnBefore));
    
    // Simulate soft delete
    const johnIndex = paginator.config.data.findIndex(r => r.id === 1);
    if (johnIndex !== -1) {
        paginator.config.data[johnIndex].isDisabled = true;
        console.log('\nAfter setting isDisabled=true - John (id:1):');
        console.log(JSON.stringify(paginator.config.data[johnIndex]));
        
        // Update filtered data
        paginator.filteredData = paginator.filterData();
        console.log('\nUpdated filteredData after soft delete:');
        console.log(JSON.stringify(paginator.filteredData.map(r => ({ id: r.id, name: r.name, isDisabled: r.isDisabled }))));
        console.log('Count:', paginator.filteredData.length);
        
        // Check if John is still in filtered data
        const johnInFiltered = paginator.filteredData.find(r => r.id === 1);
        console.log('\nIs John still in filtered data?', !!johnInFiltered);
        
        if (johnInFiltered) {
            console.error('❌ PROBLEM: John should NOT be in filtered data');
        } else {
            console.log('✅ SUCCESS: John correctly filtered out');
        }
    }
    
    console.log('\n🧪 Testing toggle to show disabled:');
    paginator.showDisabled = true;
    const disabledFiltered = paginator.filterData();
    console.log('filterData() with showDisabled=true:');
    console.log(JSON.stringify(disabledFiltered.map(r => ({ id: r.id, name: r.name, isDisabled: r.isDisabled }))));
    console.log('Count:', disabledFiltered.length);
    
    console.log('\n📋 Final Data State:');
    console.log('All records in config.data:');
    paginator.config.data.forEach(record => {
        console.log(`  ${record.id}: ${record.name} (isDisabled: ${record.isDisabled})`);
    });
    
    return paginator;
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.DebugFilterTest = {
        run: debugFilterTest
    };
}

// Auto-run if DataGridPaginator is available
if (typeof window !== 'undefined' && window.DataGridPaginator) {
    console.log('🚀 Running debug filter test...');
    debugFilterTest();
} else if (typeof window !== 'undefined') {
    console.log('⏳ Waiting for DataGridPaginator to be available...');
    window.addEventListener('load', () => {
        if (window.DataGridPaginator) {
            debugFilterTest();
        } else {
            console.error('❌ DataGridPaginator not found');
        }
    });
}