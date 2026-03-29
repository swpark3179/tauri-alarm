## 2024-05-19 - Added ARIA labels for Korean accessibility
**Learning:** Found that Material-UI `IconButton`, `Fab`, and `Switch` components were missing `aria-label` attributes, making them inaccessible to screen readers. For this localized application, providing accurate Korean ARIA labels (e.g. `aria-label="새 알람 추가"`) improves accessibility substantially without disrupting the UI.
**Action:** When working on UI components in this application, ensure all icon-only buttons receive descriptive Korean `aria-label`s by default to maintain accessibility.

## 2025-03-30 - Tooltips for icon-only buttons
**Learning:** Material-UI `Tooltip` components fail to display when their child element is disabled because disabled elements don't fire mouse events. This causes accessibility issues when users need to know what a disabled button does.
**Action:** When wrapping an `IconButton` or `Fab` that can enter a `disabled` state with a `Tooltip`, always wrap the button itself in a `<span>` element. This allows the tooltip to listen for hover events on the span instead.
