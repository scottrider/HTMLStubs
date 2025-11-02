import { LitElement } from 'lit';
interface DataGridSchema {
    [key: string]: {
        searchable: boolean;
        displayName?: string;
        type?: string;
    };
}
interface DataGridData {
    schema: DataGridSchema;
    data: any[];
}
interface DataGridSource {
    [entityName: string]: DataGridData;
}
export declare class DataGridLit extends LitElement {
    source: DataGridSource;
    entity: string;
    cssClass: string;
    addRowFunction?: string;
    static styles: any;
    render(): any;
    private renderRow;
}
declare global {
    interface HTMLElementTagNameMap {
        'data-grid-lit': DataGridLit;
    }
}
export {};
