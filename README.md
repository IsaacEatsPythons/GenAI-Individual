# Embedded Market BOM Test Page

This folder contains a standalone React prototype of the Embedded Market bill of materials page. It uses fictional sample data to demonstrate the BOM workflow from the project proposal and the supplied screenshot.

## What the page does

- Shows project-wide electrical constraints and a five-part sample BOM.
- Opens draft editors for adding or editing components and project constraints.
- Saves changes to browser storage; Cancel discards the open draft.
- Summarizes pin use and known current, and flags missing current data.
- Displays a compatibility review with example conflict explanations and sample-price-ranked alternatives.

The component records, compatibility findings, recommendations, and prices are illustrative. The prototype does not connect to a backend, supplier API, or production compatibility engine.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To create a production build, run:

```sh
npm run build
```

Saved BOM changes are stored in the browser's `localStorage` under `embedded-market-field-node-bom`.

## Change summary and review

The implementation adds the React page, responsive styling, sample BOM data, client-side draft/save/cancel interactions, browser persistence, and the compatibility review panel. The screenshot captured during browser review is available at [`evidence/bom-page.png`](evidence/bom-page.png).

Validation performed:

- `npm run build` completed successfully.
- Playwright in headless Chrome confirmed the initial five rows, adding and saving a component, persistence after reload, Cancel preserving the original component, and visibility of compatibility findings and two alternatives.
- The 1242 × 1338 browser capture was visually compared with the supplied reference screenshot.

The dedicated Playwright MCP was not available in the session; the Playwright package was used directly with Chrome for the browser check.
