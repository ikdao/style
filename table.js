export default class TableEnhancer {
  constructor(table, options = {}) {
    this.table = table;
    this.tbody = table.querySelector("tbody");
    this.rows = Array.from(this.tbody.rows);
    this.searchInput = options.searchInput || null;
    this.highlightMatches = options.highlightMatches || false;
    this.sortDirections = {};

    if (this.searchInput) this.initSearch();
    this.initSort();
  }

  initSearch() {
    this.searchInput.addEventListener("input", () => {
      const query = this.searchInput.value.toLowerCase();
      this.rows.forEach(row => {
        const cells = Array.from(row.cells);
        const text = cells.map(cell => cell.textContent.toLowerCase()).join(" ");
        const match = text.includes(query);

        row.style.display = match ? "" : "none";

        if (this.highlightMatches) {
          cells.forEach(cell => {
            const original = cell.textContent;
            const regex = new RegExp(`(${query})`, "gi");
            cell.innerHTML = query
              ? original.replace(regex, `<mark>$1</mark>`)
              : original;
          });
        }
      });
    });
  }

  initSort() {
    const headers = this.table.querySelectorAll("thead th");

    headers.forEach((th, index) => {
      th.style.cursor = "pointer";
      th.addEventListener("click", () => {
        const direction = this.sortDirections[index] === "asc" ? "desc" : "asc";
        this.sortDirections[index] = direction;
        this.sortByColumn(index, direction);
      });
    });
  }

  sortByColumn(index, direction = "asc") {
    const multiplier = direction === "asc" ? 1 : -1;

    const parseValue = (text) => {
      let cleaned = text.replace(/,/g, "").trim().toUpperCase();

      // Remove % and note it
      const isPercent = cleaned.endsWith('%');
      if (isPercent) cleaned = cleaned.slice(0, -1);

      // Replace Unicode minus with hyphen-minus
      cleaned = cleaned.replace(/[âˆ’â€“â€”]/g, '-');

      // Match number and optional unit suffix
      const match = cleaned.match(/^(-?[\d.]+)([KMBT]?)$/);
      if (!match) return cleaned;

      let [, num, unit] = match;
      num = parseFloat(num);
      const multipliers = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
      let value = num * (multipliers[unit] || 1);

      return isPercent ? value / 100 : value;
    };

    const sortedRows = [...this.rows].sort((a, b) => {
      const aVal = parseValue(a.cells[index].textContent);
      const bVal = parseValue(b.cells[index].textContent);

      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * multiplier;
      }

      return String(aVal).localeCompare(String(bVal)) * multiplier;
    });

    sortedRows.forEach(row => this.tbody.appendChild(row));
  }
}

