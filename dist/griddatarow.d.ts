export interface GridDataRowConfig {
    schema: any;
    recordData: any;
    companyOptions?: string[];
    isEditable?: boolean;
    showCheckbox?: boolean;
    isChecked?: boolean;
    onSave?: (data: any) => void;
    onCancel?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onCheckboxChange?: (checked: boolean) => void;
}
export declare class GridDataRow {
    private config;
    private container;
    private formData;
    private isEditable;
    private showCheckbox;
    private isChecked;
    constructor(config: GridDataRowConfig);
    getElement(): HTMLElement;
    getData(): any;
    setEditable(editable: boolean): void;
    setChecked(checked: boolean): void;
    getChecked(): boolean;
    private createContainer;
    private render;
    private createCheckboxField;
    private createActionButtons;
    private createFormFields;
    private createFieldGroup;
    private createEditableField;
    private createCompanySelect;
    private createDefaultField;
    private attachEventListeners;
    private handleSave;
    private handleCancel;
    private handleEdit;
    private handleDelete;
    private validateForm;
    static createFromFirstRecord(sourceData: any, companyOptions?: string[], isEditable?: boolean): GridDataRow;
}
