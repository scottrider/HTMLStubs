export type EditMode = 'edit' | 'locked' | 'readonly';
export interface EditableField {
    field: string;
    mode: EditMode;
    value: any;
    schema: any;
}
export interface EditMechanismConfig {
    targetGrid: HTMLElement;
    defaultMode: EditMode;
    onFieldEdit?: (field: EditableField) => void;
    onRowSave?: (rowIndex: number, data: any) => void;
    onValidate?: (field: string, value: any, schema: any) => boolean;
}
export declare class EditMechanism {
    private config;
    private currentEditMode;
    private editingRowIndex;
    private originalRowData;
    constructor(config: EditMechanismConfig);
    enableEditing(): void;
    disableEditing(): void;
    lockEditing(): void;
    setEditMode(mode: EditMode): void;
    startRowEdit(rowIndex: number): boolean;
    saveRowEdit(rowIndex: number): boolean;
    cancelRowEdit(): void;
    private attachToGrid;
    private injectEditControls;
    private createEditToolbar;
    private addEditButtonsToRows;
    private addEditButtonToRow;
    private getRowActionButtons;
    private attachEventListeners;
    private refreshGridEditingState;
    private updateAllRowButtons;
    private convertRowToEditable;
    private createInputForField;
    private getInputTypeFromSchema;
    private backupRowData;
    private extractRowData;
    private validateRowData;
    private applyRowData;
    private restoreRowData;
    private exitRowEdit;
    private getRowByIndex;
    private getFieldNameForCell;
    private getSchemaForField;
    integratWithGridData(getSchema: () => any, getFieldNames: () => string[]): void;
}
