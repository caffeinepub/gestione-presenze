# Specification

## Summary
**Goal:** Fully localize the entire application UI and user-facing exports to Italian, with consistent terminology and Italian date/time formatting.

**Planned changes:**
- Translate all visible frontend UI strings to Italian across all pages, modals, menus, buttons, empty states, validation messages, and alerts/toasts.
- Introduce a simple centralized frontend localization structure (single source of truth for Italian strings) and refactor components to use it, without editing immutable frontend paths.
- Localize frontend date/time display to Italian formatting (day/month names, short/long formats, and day/week/month filter labels) consistently across personal and admin views.
- Centralize Italian label mappings for domain/status values (attendance statuses, activity types, request statuses, roles) so the same internal values render consistently everywhere.
- Localize backend-generated user-facing text used by the UI and exports, including CSV export column headers and Italian-formatted dates/times in exported files.

**User-visible outcome:** The app appears fully in Italian (UI copy, labels, and statuses) with Italian-formatted dates/times, and CSV exports generated from the app include Italian headers and Italian date/time formatting.
