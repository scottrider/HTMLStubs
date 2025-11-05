<div class="record-item">
                    <div class="record-content" id="record-7">
                        <!-- GridDataRow will be inserted here -->
                    <div class="grid-data-row">
            <style>
                .grid-data-row {
                    background: white;
                    font-family: Arial, sans-serif;
                    position: relative;
                    transition: background-color 0.2s ease;
                    padding-bottom: 1px;
                    margin-bottom: 1px;
                }
                .grid-data-row:hover,
                .grid-data-row:focus-within {
                    background-color: #f8f9fa;
                    outline: 2px solid #007bff;
                    outline-offset: 1px;
                }
                .row-form {
                    display: flex;
                    flex-wrap: nowrap;
                    gap: 15px;
                    align-items: center;
                    overflow: visible;
                    white-space: nowrap;
                }
                .checkbox-group {
                    display: flex;
                    flex-direction: column;
                    width: 30px;
                    flex-shrink: 0;
                    align-items: center;
                    justify-content: center;
                }
                .record-checkbox {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }
                .field-group {
                    display: flex;
                    flex-direction: column;
                    width: 120px;
                    flex-shrink: 0;
                }
                .field-label {
                    font-weight: bold;
                    margin: 0;
                    font-size: 12px;
                    color: #666;
                    white-space: nowrap;
                }
                .field-input {
                    padding: 0 0 1px 0;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 14px;
                    width: 100%;
                    box-sizing: border-box;
                }
                .field-input:focus {
                    border-color: #007cba;
                    outline: none;
                    box-shadow: 0 0 3px rgba(0, 124, 186, 0.3);
                }
                .field-input.required {
                    border-left: 3px solid #e74c3c;
                }
                .field-select {
                    padding: 0 0 1px 0;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 14px;
                    background: white;
                    min-width: 150px;
                }
                .field-label-display {
                    padding: 0 0 1px 0;
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 4px;
                    font-size: 14px;
                    color: #666;
                    min-width: 100px;
                }
                .field-readonly {
                    padding: 0 0 1px 0;
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 4px;
                    font-size: 14px;
                    color: #666;
                    min-width: 100px;
                }
                .action-buttons {
                    position: absolute;
                    top: -30px;
                    right: 10px;
                    display: none;
                    gap: 8px;
                    align-items: center;
                    width: auto;
                    flex-shrink: 0;
                    background: white;
                    padding: 0 0 1px 0;
                    margin: 0;
                    border-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    z-index: 100;
                }
                .grid-data-row:hover .action-buttons,
                .grid-data-row:focus-within .action-buttons {
                    display: flex;
                }
                .btn-emoji {
                    width: 32px;
                    height: 32px;
                    border: 1px solid #ccc;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    transition: transform 0.1s;
                }
                .btn-emoji:hover {
                    transform: scale(1.1);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .btn-save {
                    background: #28a745;
                    border-color: #28a745;
                }
                .btn-save:hover {
                    background: #218838;
                }
                .btn-cancel {
                    background: #6c757d;
                    border-color: #6c757d;
                }
                .btn-cancel:hover {
                    background: #5a6268;
                }
                .btn-edit {
                    background: #007bff;
                    border-color: #007bff;
                }
                .btn-edit:hover {
                    background: #0056b3;
                }
                .btn-delete {
                    background: #dc3545;
                    border-color: #dc3545;
                }
                .btn-delete:hover {
                    background: #c82333;
                }
            </style>
            <div class="row-form">
                
            <div class="checkbox-group">
                <input type="checkbox" class="record-checkbox" id="recordCheckbox">
            </div>
        
                
            <div class="field-group">
                <div class="field-readonly"></div>
            </div>
        
            <div class="field-group">
                <div class="field-readonly"></div>
            </div>
        
            <div class="field-group">
                <div class="field-readonly"></div>
            </div>
        
            <div class="field-group">
                <div class="field-readonly"></div>
            </div>
        
            <div class="field-group">
                <div class="field-readonly"></div>
            </div>
        
            <div class="field-group">
                <div class="field-readonly">2025-11-05</div>
            </div>
        
            <div class="field-group">
                <div class="field-readonly">2025-11-05</div>
            </div>
        
                <div class="action-buttons">
                    
                <button class="btn-emoji btn-edit" id="editBtn" title="Edit">✏️</button>
                <button class="btn-emoji btn-delete" id="deleteBtn" title="Delete">🗑️</button>
            
                </div>
            </div>
        </div></div>
                </div>