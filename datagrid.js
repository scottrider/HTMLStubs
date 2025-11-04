<script>

class DataGrid extends HTMLElement {
    connectedCallback() {
        const cssClass = this.getAttribute('cssClass') || '';
        const style = this.getAttribute('style') || '';
        const externalFunctionAddRow = this.getAttribute('addRow');
        
        const sourceArray = JSON.parse(this.getAttribute('source'));
        
        // Fixed: use sourceArray instead of 'a', and access schema properly
        const keys = getMemberNames(sourceArray.schema).filter(k => sourceArray.schema[k].canFilter == true); 
        
        let titles = `<div>${keys.map(t => addColumn(t)).join('')}</div>`;
        
        // Fixed: check if data exists and iterate properly
        if (sourceArray.data) {
            sourceArray.data.map(r => {
                if (externalFunctionAddRow) {
                    // Call external function if provided
                    window[externalFunctionAddRow](r);
                }
            });
        }
        
        // Fixed: moved innerHTML outside and corrected structure
        this.innerHTML = `<div class="${cssClass}" style="${style}">${titles}</div>`;
    }
}



customElements.define("data-grid", DataGrid);

// function getMemberNames(obj) {
//     return Object.keys(obj);
// } 

// function addColumn(value) {
//     return `<div class="column">${value}</div>`;
// }

</script>