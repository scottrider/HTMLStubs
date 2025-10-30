// DataGrid data structure with positions entity containing schema and data siblings
// Last updated: 2025-10-30 - No regex patterns version
// Cache buster: Remove any regex patterns that cause issues
console.log('positions-data.js loaded at:', new Date().toISOString());
// Last updated: 2025-10-30 13:58 - COMPLETELY PATTERN-FREE VERSION
// Cache buster: All regex patterns removed to prevent browser errors

const dataGridData = {
    "positions": {
        "schema": {
            "position": { 
                "type": "string", 
                "displayName": "Position", 
                "htmlElement": "input",
                "htmlType": "text",
                "css": { "placeholder": "Enter position title", "maxlength": "100" },
                "required": true 
            },
            "company": { 
                "type": "string", 
                "displayName": "Company", 
                "htmlElement": "input",
                "htmlType": "text",
                "css": { "placeholder": "Company name", "maxlength": "80" },
                "required": true 
            },
            "email": { 
                "type": "email", 
                "displayName": "Email", 
                "htmlElement": "input",
                "htmlType": "email",
                "css": { "placeholder": "email@example.com" },
                "required": true 
            },
            "cphone": { 
                "type": "phone", 
                "displayName": "Cell", 
                "htmlElement": "input",
                "htmlType": "tel",
                "css": { "placeholder": "(555) 123-4567" },
                "required": false 
            },
            "ophone": { 
                "type": "phone", 
                "displayName": "Office", 
                "htmlElement": "input",
                "htmlType": "tel",
                "css": { "placeholder": "(555) 123-4567" },
                "required": false 
            },
            "icontact": { 
                "type": "date", 
                "displayName": "Initial Contact", 
                "htmlElement": "label",
                "htmlType": "label",
                "css": { "min": "2020-01-01", "max": "2030-12-31" },
                "required": true 
            },
            "lcontact": { 
                "type": "date", 
                "displayName": "Last Contact", 
                "htmlElement": "input",
                "htmlType": "date",
                "css": { "min": "2020-01-01", "max": "2030-12-31" },
                "required": false 
            },
            "isDisabled": {
                "type": "boolean",
                "displayName": "Disabled",
                "htmlElement": "input",
                "htmlType": "checkbox",
                "css": {},
                "required": false
            }
        },
        "data": [
            { "position": "Senior Software Engineer", "company": "TechCorp Inc", "email": "john.doe@techcorp.com", "cphone": "(555) 123-4567", "ophone": "(555) 123-4567", "icontact": "2024-01-15", "lcontact": "2024-10-28", "isDisabled": false },
            { "position": "Frontend Developer", "company": "InnovateSoft", "email": "jane.smith@innovatesoft.com", "cphone": "(555) 987-6543", "ophone": "(555) 987-6543", "icontact": "2024-02-03", "lcontact": "2024-10-25", "isDisabled": false },
            { "position": "Data Analyst", "company": "DataDrive Systems", "email": "mike.johnson@datadrive.com", "cphone": "(555) 456-7890", "ophone": "(555) 456-7890", "icontact": "2024-03-12", "lcontact": "2024-09-18", "isDisabled": true },
            { "position": "DevOps Engineer", "company": "CloudFirst Technologies", "email": "sarah.wilson@cloudfirst.com", "cphone": "(555) 321-0987", "ophone": "(555) 321-0987", "icontact": "2024-01-28", "lcontact": "2024-10-30", "isDisabled": false },
            { "position": "Product Manager", "company": "NextGen Solutions", "email": "alex.brown@nextgen.com", "cphone": "(555) 654-3210", "ophone": "(555) 654-3210", "icontact": "2024-04-07", "lcontact": "2024-10-22", "isDisabled": true },
            { "position": "UX Designer", "company": "DesignWorks Studio", "email": "emily.davis@designworks.com", "cphone": "(555) 789-0123", "ophone": "(555) 789-0123", "icontact": "2024-02-20", "lcontact": "2024-10-15", "isDisabled": false },
            { "position": "Backend Developer", "company": "ServerTech Corp", "email": "david.miller@servertech.com", "cphone": "(555) 345-6789", "ophone": "(555) 345-6789", "icontact": "2024-05-11", "lcontact": "2024-10-10", "isDisabled": false },
            { "position": "QA Engineer", "company": "TestPro Solutions", "email": "lisa.garcia@testpro.com", "cphone": "(555) 567-8901", "ophone": "(555) 567-8901", "icontact": "2024-03-25", "lcontact": "2024-10-29", "isDisabled": true }
        ]
    }
};