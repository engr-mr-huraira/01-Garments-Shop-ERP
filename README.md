# Garments POS & Inventory ERP

Greenfield scaffold for a multi-partner, multi-wholesaler garments ERP.

## What is included

- API foundation for owners, products, inventory, sales, and reports
- React dashboard shell for the desktop/web UI
- Electron wrapper for desktop distribution
- Persistent JSON-backed data store for local development
- PDF export endpoints for sale invoices and owner statements

## Run shape

1. Install dependencies in each package after the scaffold is reviewed.
2. Start the API.
3. Start the web UI or Electron shell.

## Desktop shell

- The Electron wrapper is scaffolded in source, but the `electron` package is not pinned in the workspace so the base install stays lightweight.
- If you want the desktop shell immediately, install Electron into `packages/desktop` separately and run the desktop script.

## Core business model

- Owner management with partner and wholesaler types
- Product hierarchy with owner assignment
- Inventory movements and stock alerts
- Sale creation with profit allocation across owners
- Dashboard and report endpoints for analytics

## Useful endpoints

- `GET /health`
- `GET /reports/dashboard`
- `GET /exports/sales/pdf?id=<saleId>`
- `GET /exports/statement/pdf?ownerId=<ownerId>`
