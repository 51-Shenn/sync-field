# Site Reporting Implementation

**Date:** 2025-06-20

## Scope

Fix site reporting CRUD (create/edit/delete) + wire the Portfolio Reports page to live data with CSV export and date filtering.

## Part 1 — CRUD API Routes + Client Hook

### API Routes (new)
- `PUT /api/reports/[id]` — update a site report
- `DELETE /api/reports/[id]` — delete a site report
- Both authenticated via `api-auth.ts` session check

### Client Hook (`use-data.ts`)
- Add `updateReport(id, data)` — calls PUT
- Add `deleteReport(id)` — calls DELETE
- Auto-populate `createdBy` from the authenticated user's session on create

### Server Layer (`reports-server.ts`)
- Already has `updateSiteReport()` and `deleteSiteReport()` — no changes needed

## Part 2 — SitesView Edit/Delete

### Fix Edit
- `saveReport()` currently always calls `pushReport` (create)
- Branch on `editing` state: if editing, call `updateReport(id, data)`, else call `createReport(data)`

### Add Delete
- Add a delete icon button per report row
- Wire `pendingDelete` state to a confirmation dialog
- On confirm, call `deleteReport(id)` and refresh list

## Part 3 — Portfolio Reports Page

### Live Data
- Fetch real `site_reports` from `useSiteReports()` hook
- Compute stats: total reports, open count, resolved count, issue count, update count
- Pass computed data to StatCards

### CompletionChart
- Accept a `data` prop with project completion percentages
- Compute from live projects or seed data

### CSV Export
- Collect currently filtered report data
- Convert to CSV string (title, project, type, status, date, description)
- Trigger browser download via Blob/URL

### Date Range Dropdown
- Preset options: Last 7 days, 30 days, 3 months, 6 months, 1 year, All time
- Filter reports by `createdAt` within selected range

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/reports/[id]/route.ts` | New — PUT and DELETE handlers |
| `src/lib/use-data.ts` | Add `updateReport`, `deleteReport`, `createdBy` auto-population |
| `src/components/sites-view.tsx` | Branch save on edit/create, add delete button + dialog |
| `src/app/reports/page.tsx` | Live data fetch, computed stats, CSV export, date dropdown |
| `src/components/charts.tsx` | `CompletionChart` accept data prop |
| `src/lib/report-types.ts` | No change needed |
| `src/lib/reports-server.ts` | No change needed |

## Verification

- `npm run lint` passes
- Manual: create, edit, delete reports in SitesView
- Manual: /reports page shows live stats, filters by date, exports CSV
