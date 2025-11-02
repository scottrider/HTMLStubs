// DataGrid data structure with positions entity containing schema and data siblings
// TypeScript version with full type safety
console.log('positions-data.ts loaded at:', new Date().toISOString());
const dataGridData = {
    "positions": {
        "schema": {
            "position": {
                "type": "string",
                "displayName": "Position",
                "htmlElement": "input",
                "htmlType": "text",
                "css": { "placeholder": "Enter position title", "maxlength": "100" },
                "required": true,
                "searchable": true
            },
            "company": {
                "type": "string",
                "displayName": "Company",
                "htmlElement": "input",
                "htmlType": "text",
                "css": { "placeholder": "Company name", "maxlength": "80" },
                "required": true,
                "searchable": true
            },
            "email": {
                "type": "email",
                "displayName": "Email",
                "htmlElement": "input",
                "htmlType": "email",
                "css": { "placeholder": "email@example.com" },
                "required": true,
                "searchable": true
            },
            "cphone": {
                "type": "phone",
                "displayName": "Cell",
                "htmlElement": "input",
                "htmlType": "tel",
                "css": { "placeholder": "(555) 123-4567" },
                "required": false,
                "searchable": true
            },
            "ophone": {
                "type": "phone",
                "displayName": "Office",
                "htmlElement": "input",
                "htmlType": "tel",
                "css": { "placeholder": "(555) 123-4567" },
                "required": false,
                "searchable": true
            },
            "location": {
                "type": "string",
                "displayName": "Location",
                "htmlElement": "input",
                "htmlType": "text",
                "css": { "placeholder": "City, State" },
                "required": false,
                "searchable": true
            },
            "notes": {
                "type": "text",
                "displayName": "Notes",
                "htmlElement": "textarea",
                "css": { "placeholder": "Additional notes", "rows": "3" },
                "required": false,
                "searchable": false
            }
        },
        "data": [
            {
                "position": "Senior Software Engineer",
                "company": "TechCorp Inc",
                "email": "hr@techcorp.com",
                "cphone": "(555) 123-4567",
                "ophone": "(555) 987-6543",
                "location": "San Francisco, CA",
                "notes": "Great team culture, remote-friendly"
            },
            {
                "position": "Full Stack Developer",
                "company": "StartupXYZ",
                "email": "jobs@startupxyz.com",
                "cphone": "(555) 234-5678",
                "ophone": "",
                "location": "Austin, TX",
                "notes": "Equity opportunity, fast-paced environment"
            },
            {
                "position": "Frontend Developer",
                "company": "Design Studio",
                "email": "careers@designstudio.com",
                "cphone": "(555) 345-6789",
                "ophone": "(555) 876-5432",
                "location": "New York, NY",
                "notes": "Focus on UX/UI, creative projects"
            }
        ]
    }
};
// Export for use in other modules
export { dataGridData };
// Also make it available globally for backward compatibility
window.dataGridData = dataGridData;
