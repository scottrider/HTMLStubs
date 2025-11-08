interface DataGridSchemaField {
    type?: string;
    displayName?: string;
    htmlElement?: string;
    htmlType?: string;
    css?: Record<string, string>;
    required?: boolean;
    searchable?: boolean;
}
interface DataGridSchema {
    [fieldName: string]: DataGridSchemaField;
}
interface DataGridEntity {
    schema: DataGridSchema;
    data: Record<string, any>[];
}
interface DataGridSource {
    [entityName: string]: DataGridEntity;
}
interface DataGridElement extends HTMLElement {
    sourceData: DataGridSource;
    entity: string;
    cssClass: string;
    addRow?: string;
}
declare class DataGrid extends HTMLElement implements DataGridElement {
    private _sourceData;
    set sourceData(data: DataGridSource);
    get sourceData(): DataGridSource;
    get entity(): string;
    set entity(value: string);
    get cssClass(): string;
    set cssClass(value: string);
    get addRow(): string | undefined;
    set addRow(value: string | undefined);
    connectedCallback(): void;
    static get observedAttributes(): string[];
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    protected render(): void;
    private getMemberNames;
    private addColumn;
    private renderDataRow;
}
export { DataGrid, DataGridSource, DataGridEntity, DataGridSchema, DataGridSchemaField };
declare global {
    interface HTMLElementTagNameMap {
        'data-grid': DataGrid;
    }
}
