var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, customElement, property } from 'lit';
let DataGridLit = class DataGridLit extends LitElement {
    constructor() {
        super(...arguments);
        this.entity = 'positions';
        this.cssClass = '';
    }
    render() {
        if (!this.source || !this.source[this.entity]) {
            return html `<div>No data available for entity: ${this.entity}</div>`;
        }
        const entityData = this.source[this.entity];
        const searchableKeys = Object.keys(entityData.schema)
            .filter(key => entityData.schema[key].searchable);
        return html `
            <div class="grid-container ${this.cssClass}">
                <div class="header">
                    ${searchableKeys.map(key => html `<div class="column">${entityData.schema[key].displayName || key}</div>`)}
                </div>
                <div class="data-rows">
                    ${entityData.data.map(row => this.renderRow(row, searchableKeys))}
                </div>
            </div>
        `;
    }
    renderRow(row, keys) {
        // Call external function if provided
        if (this.addRowFunction && window[this.addRowFunction]) {
            window[this.addRowFunction](row);
        }
        return html `
            <div class="row" style="display: flex;">
                ${keys.map(key => html `<div class="column">${row[key] || ''}</div>`)}
            </div>
        `;
    }
};
DataGridLit.styles = css `
        :host {
            display: block;
        }
        .grid-container {
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        .column {
            padding: 8px;
            border-right: 1px solid #eee;
            font-weight: bold;
        }
        .header {
            display: flex;
            background-color: #f5f5f5;
        }
    `;
__decorate([
    property({ type: Object })
], DataGridLit.prototype, "source", void 0);
__decorate([
    property()
], DataGridLit.prototype, "entity", void 0);
__decorate([
    property()
], DataGridLit.prototype, "cssClass", void 0);
__decorate([
    property()
], DataGridLit.prototype, "addRowFunction", void 0);
DataGridLit = __decorate([
    customElement('data-grid-lit')
], DataGridLit);
export { DataGridLit };
