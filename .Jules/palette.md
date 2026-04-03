## 2024-05-19 - Added ARIA labels for Korean accessibility
**Learning:** Found that Material-UI `IconButton`, `Fab`, and `Switch` components were missing `aria-label` attributes, making them inaccessible to screen readers. For this localized application, providing accurate Korean ARIA labels (e.g. `aria-label="새 알람 추가"`) improves accessibility substantially without disrupting the UI.
**Action:** When working on UI components in this application, ensure all icon-only buttons receive descriptive Korean `aria-label`s by default to maintain accessibility.

## 2025-03-30 - Tooltips for icon-only buttons
**Learning:** Material-UI `Tooltip` components fail to display when their child element is disabled because disabled elements don't fire mouse events. This causes accessibility issues when users need to know what a disabled button does.
**Action:** When wrapping an `IconButton` or `Fab` that can enter a `disabled` state with a `Tooltip`, always wrap the button itself in a `<span>` element. This allows the tooltip to listen for hover events on the span instead.

## 2024-05-15 - Empty State Call to Actions
**Learning:** Empty states that only contain descriptive text or point to other UI elements (like "Click the + button at the bottom right") can be confusing and require more cognitive load. Screen readers also might not properly associate the empty state with the required action.
**Action:** Always include a direct Call-To-Action (CTA) button within the empty state container itself. Additionally, add `role="status"` and `aria-live="polite"` to the empty state container to ensure screen readers announce it when a list becomes empty (e.g., when all alarms are deleted).
