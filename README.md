# Pathology Core - Specimen Registration & Histology Repository

A modern, high-performance web platform designed for clinical and research laboratories to register, manage, track, and analyze histology tissue specimens and organ viability metrics.

Live Deployment: [https://blackclowncy.github.io/pathology-core/](https://blackclowncy.github.io/pathology-core/)

---

## Key Features

- **Specimen Registration (`index.html`)**:
  - Interactive organ selector (Lung, Heart, Liver, Kidney, Pancreas, Spleen, Intestines, Other).
  - Preservation method tracking (`-80°C Frozen` vs `Fixed`).
  - Automated unique Tracking ID (`T-ID`) generation.
  - Automatic live calculation of Cold Ischemia Time from Clamp Time and Collection Time with prolonged ischemia detection.
  - Clinical medical history comorbidity flags (HTN, Diabetes, CAD, COPD, Obesity, CKD, Liver, Tobacco, Alcohol, Drugs).
  - Excel (`.xlsx`), CSV, and JSON export and batch import via SheetJS.
  - Real-time **Recent Log** panel with specimen detail cards and barcode generator.

- **Specimen Archive & Repository (`archive.html`)**:
  - Full-featured searchable, filterable, and sortable database of all logged specimens.
  - Batch operations: multi-select deletion, batch Excel export, barcode label generation.
  - Specimen Detail Modal with clinical parameters and print-ready tube labels.

- **Laboratory Dashboard (`dashboard.html`)**:
  - Key performance indicators: Total specimens, Cryo-preservation volume, Average Cold Ischemia duration, Flagged high-risk specimens.
  - Interactive distribution charts powered by Chart.js (Organ volume breakdown, Preservation method share).

- **Tissue Quality & Analytics (`analytics.html`)**:
  - Cold Ischemia compliance histograms (<4h target).
  - Donor medical history prevalence matrix.
  - Histology and multi-modal perfusion correlation directives.

- **Storage Resource Manager (`resources.html`)**:
  - Visual rack and freezer slot map (-80°C Ultra-low freezers S1–S3, Fixed specimen cabinets C1).
  - Capacity tracking and slot allocation.

- **System Settings & Data Management (`settings.html`)**:
  - Laboratory ID, Institution name, and Lead Pathologist configuration.
  - Full JSON database snapshot backup and restore.
  - Demo data reset and maintenance tools.

- **Histology SOP Protocols (`support.html`)**:
  - Standard operating procedures for tissue fixation (10% NBF), -80°C cryopreservation, and multi-stain histology triplets (H&E, Trichrome, PAS).

---

## Tech Stack

- **Styling**: Tailwind CSS (Dark Clinical Theme)
- **Typography & Icons**: Inter, JetBrains Mono, Google Material Symbols Outlined
- **Data Persistence**: Client-side localStorage with structured schema & event-driven synchronization
- **Spreadsheet Processing**: SheetJS (`xlsx.full.min.js`)
- **Barcode Rendering**: JsBarcode (`JsBarcode.all.min.js`)
- **Visual Analytics**: Chart.js

---

## License

MIT License. Developed for Pathology & Organ Viability Research Core.
