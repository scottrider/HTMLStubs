// ../js/datagridrows.js

class DataGridRows2 extends HTMLElement {
  constructor() {
    super();
    this._columns = [];
    this._dimensions = {};
    this._rows = [];
  }

  set columns(value) {
    this._columns = Array.isArray(value) ? value : [];
    this._render();
  }

  set dimensions(value) {
    this._dimensions = value || {};
    this._render();
  }

  set rows(value) {
    this._rows = Array.isArray(value) ? value : [];
    this._render();
  }

  get columns() {
    return this._columns;
  }

  get dimensions() {
    return this._dimensions;
  }

  get rows() {
    return this._rows;
  }

  connectedCallback() {
    this._render();
  }

  _render() {
    // Clear and rebuild light DOM
    this.replaceChildren();

    if (!this._columns.length) return;

    for (const rowObj of this._rows) {
      const rowEl = document.createElement("data-grid-row");
      rowEl.columns = this._columns;
      rowEl.dimensions = this._dimensions;
      rowEl.row = rowObj;
      this.appendChild(rowEl);
    }
  }
}

customElements.define("data-grid-rows", DataGridRows);
