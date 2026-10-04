# Project Guidance

## User Preferences

- ใช้ภาษาไทยเป็นภาษาหลักของส่วนติดต่อผู้ใช้
- แอปสำหรับบริหารจัดการโครงการจบการศึกษาระดับปี 4
- ลำดับชั้นการนำทางและความหนาแน่นของข้อมูลที่ชัดเจน เหมาะกับงานบริหารจัดการ

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- Enhanced Migration project: mops.toml has [canisters.backend.migrations]; fold pending migrations into the latest pending file (OldActor = {}) when check-limit=1, never touch an applied migration.
- Private helper functions declared in two different mixins collide as duplicate definitions when both mixins are included into the same actor; give each mixin's private helpers unique names.
- 'label' is a reserved keyword in Motoko — a record field named label is a syntax error (M0001).
- Motoko has no triple-quoted multi-line string literal; author long static Markdown as concatenated escaped string literals.
- OQL manual-mode entities need the top-level Entity import for .payload/.flatten plus the OQL import for OQL.Entity.manual; variant/option fields cannot auto-derive through .toEntity.
- CSS variables for semantic colors must also be registered in tailwind.config.js theme.extend.colors or their utility classes are never generated.
- App-role gating in the UI must match the backend's authorization source; AccessControl.isAdmin checks the platform role, so admin-only endpoints need isCallerAdmin.
- Backend Principal fields are ICP Principal objects, not strings — call .toText() before using them as React keys or display values.
- useCallerProfile().data.role (AppRole) is the right source for role-gated UI, not useCallerRole (base UserRole).
- Internet Identity sign-in cannot complete inside the local preflight browser boundary (navigation_blocked on the II canister call), so authenticated flows are only verifiable by the app's own test suite.
