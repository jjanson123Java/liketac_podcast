# Episode Classification Filters Design

## Intent

Help visitors steer the Shows catalog toward material at their learning level without hiding the catalog's subject structure. Administrators classify episodes independently of playback access; visitors can combine classifications while the existing access rules continue to decide what they may play.

## Approved experience

The Shows page displays four buttons, in this order, below its introduction: **Free Episodes**, **Non-Technical Episodes**, **Beginner Episodes**, and **Seriously Episodes**. Buttons are multi-select. With no selection, every published episode is shown. With one or more selections, an episode is shown when it has at least one selected classification (OR matching). Nonmatching episodes are hidden, but every category remains visible and shows a category-specific no-match message when necessary.

The Admin Dashboard exposes four independent classification checkboxes on the new-episode form and on every existing active episode: Free, Non-Technical, Beginner, and Seriously. Administrators may assign any combination and change it later. Classifications affect discovery only. The existing Access field remains the sole authority for visitor versus subscriber playback.

Visitors see matching free and subscriber episodes. Visitor-accessible episodes retain normal playback. Subscriber-only playback controls are visibly grey and locked; activating one opens an accessible notice that explains the visitor state and offers **Sign Up Free** (to `/signup`) and **Keep Browsing**. Signed-in subscribers retain normal episode navigation and playback behavior. The shared header and dark-mode control remain unchanged.

## Data and compatibility

Store four non-null boolean columns on `episodes`, defaulting to false, so existing rows migrate safely without being assigned classifications. Catalog fallback fixtures include the same fields. Classification updates do not modify media, category, status, publication date, or access level.

## Constraints

- Preserve exact public filter labels, including **Seriously Episodes**.
- Preserve existing category ordering and published-episode ordering.
- Preserve current authentication and media authorization behavior.
- Filtering is client-side over the server-rendered catalog; it must remain keyboard accessible and honor the existing responsive design.
- A category is never removed solely because its episodes do not match a selected filter.

