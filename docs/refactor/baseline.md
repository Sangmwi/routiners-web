# Routiners Refactor Baseline (Phase 0)

Date: 2026-02-21
Scope: Web core first (Routine + Stats + Home + API), progressive/no-downtime

## Quality Scan Baseline

### Web (`routiners-web`)
- Files scanned: 500
- Duplicate groups: 1201
- Large files: 13
- Files with long lines: 64
- Source: `docs/refactor/quality-scan-web.json`

### App (`routiners-app`)
- Files scanned: 45
- Duplicate groups: 30
- Large files: 1
- Files with long lines: 2
- Source: `docs/refactor/quality-scan-app.json`

## Lint Baseline

### Web (`routiners-web`)
- Command: `npm run lint`
- Result: 33 errors / 53 warnings

### App (`routiners-app`)
- Command: `npm run lint`
- Result: 0 errors / 1 warning

## Hotspot Checklist for Iteration Comparison

- [ ] Stats period navigation logic unified (`AchievementContent`, `NutritionStatsTab`, `WorkoutStatsTab`)
- [ ] Stats weekly/monthly summary renderer unified
- [ ] Routine event detail header action duplication reduced (`WorkoutContent`, `MealContent`)
- [ ] Calendar day rendering uses pre-index map (remove `O(42*N)` filtering)
- [ ] Calendar event icon rendering uses static components (no render-time component creation)
- [ ] Optimistic mutation logic unified (`useUpdateWorkoutData`, `useUpdateMealData`)
- [ ] API route parsing/validation/error helpers introduced under `app/api/_shared`
- [ ] Targeted lint errors in refactored files are 0

## Reproduce

1. `python C:\Users\gkstk\.codex\skills\solid-dry-review\scripts\heuristic_quality_scan.py --root c:\routiners\routiners-web --format json --output c:\routiners\routiners-web\docs\refactor\quality-scan-web.json`
2. `python C:\Users\gkstk\.codex\skills\solid-dry-review\scripts\heuristic_quality_scan.py --root c:\routiners\routiners-app --format json --output c:\routiners\routiners-web\docs\refactor\quality-scan-app.json`
3. `npm run lint` in `routiners-web`
4. `npm run lint` in `routiners-app`

