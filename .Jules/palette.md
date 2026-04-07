## 2024-05-19 - Added ARIA labels for Korean accessibility
**Learning:** Found that Material-UI `IconButton`, `Fab`, and `Switch` components were missing `aria-label` attributes, making them inaccessible to screen readers. For this localized application, providing accurate Korean ARIA labels (e.g. `aria-label="새 알람 추가"`) improves accessibility substantially without disrupting the UI.
**Action:** When working on UI components in this application, ensure all icon-only buttons receive descriptive Korean `aria-label`s by default to maintain accessibility.

## 2025-03-30 - Tooltips for icon-only buttons
**Learning:** Material-UI `Tooltip` components fail to display when their child element is disabled because disabled elements don't fire mouse events. This causes accessibility issues when users need to know what a disabled button does.
**Action:** When wrapping an `IconButton` or `Fab` that can enter a `disabled` state with a `Tooltip`, always wrap the button itself in a `<span>` element. This allows the tooltip to listen for hover events on the span instead.

## 2024-05-15 - Empty State Call to Actions
**Learning:** Empty states that only contain descriptive text or point to other UI elements (like "Click the + button at the bottom right") can be confusing and require more cognitive load. Screen readers also might not properly associate the empty state with the required action.
**Action:** Always include a direct Call-To-Action (CTA) button within the empty state container itself. Additionally, add `role="status"` and `aria-live="polite"` to the empty state container to ensure screen readers announce it when a list becomes empty (e.g., when all alarms are deleted).

## 2025-03-09 - Accessible Material-UI Tabs and Autofocus in Modals
**Learning:** When using MUI `<Tabs>` for dynamic views like edit/preview in a modal dialog, simply switching content isn't accessible to screen readers. MUI's `Tabs` provides the `tablist` and `tab` roles, but `aria-label` must be provided manually, and the content wrappers strictly need `role="tabpanel"`, `id`, and `aria-labelledby` corresponding to the tabs. Additionally, setting `autoFocus` and `required` on the primary `TextField` when the modal/view opens provides an immediate, helpful UX lift, ensuring users know exactly what is required and can start typing instantly.
**Action:** Always ensure that any custom tab implementations include full ARIA linkage (`tab` to `tabpanel` via IDs) and apply `autoFocus` to the first logical required input when rendering data entry forms.

## 2025-05-19 - Top-level Exit Actions & Esc Shortcut for Forms
**Learning:** Found that long forms (especially those with Markdown previews) can act as scrolling traps. If the only way to cancel/exit is at the bottom of the page, users feel trapped or get frustrated having to scroll all the way down.
**Action:** Always provide a top-level exit action (like a back button or an `X` in the header) and support the `Escape` key to quickly cancel/close full-page forms or modals. Ensure these icon buttons have descriptive Korean `aria-label`s.
