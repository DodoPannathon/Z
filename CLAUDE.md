# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Z" is a React Native / Expo personal finance app (รายรับ-รายจ่าย) built with TypeScript. It tracks transactions and categories with a modal-based UI, budget management, and summary screens. The app targets Android primarily, with web support via Expo.

## Key Commands

```bash
npm start            # Start Expo dev server
npm run android      # Run on Android emulator/device
npm run ios          # Run on iOS simulator
npm run web          # Run on web
npm test             # Run Jest tests (ts-jest, node env)
```

## Architecture

### Monolithic App Component (`App.tsx`)
The entire app lives in a single `App.tsx` file (~950 lines). It manages:
- State for transactions, categories, modal visibility, date picker, and view mode (daily/weekly/monthly)
- Tab navigation between three screens: Home (transaction list), Summary, Budget, Settings
- CRUD operations for transactions and categories via the `db` module
- A draggable swipeable modal (using `PanResponder`) for adding/editing transactions and categories

### Database Layer (`src/db.ts`)
- Pure async functions backed by `AsyncStorage`
- Two storage keys: `@z:transactions` and `@z:categories`
- `initDatabase()` seeds default categories on first launch
- `DEFAULT_CATEGORIES` includes 8 Thai-language categories (food, transport, shopping, education, entertainment, salary, other_income, other_expense)
- `deleteCategory` cascades: reassigns orphaned transactions to `'other'`

### Screens (`src/screens/`)
All screens are **presentational** — they receive data via props and have no direct `db` imports:
- **SummaryScreen** — Income/expense/net cards, category breakdown with progress bars, 7-day trend chart, top transaction, savings rate. Supports `week`/`month`/`year` period filtering.
- **BudgetScreen** — Budget health status, per-category budget progress bars, filter by all/warning/exceeded. Supports `monthly`/`weekly`/`daily` budget cut periods.
- **SettingsScreen** — User profile, budget cycle settings, toggles (decimal display, budget alerts, daily reminders), export/backup/delete data. Has an incomplete "Budget Cut Period" modal.

### Styling
- Uses NativeWind (Tailwind CSS for React Native) with `tailwind.config.js` extending the NativeWind preset
- Custom styles are defined via React Native `StyleSheet.create` in each component
- Fonts: NotoSansThai (Medium, SemiBold, Bold) loaded via `expo-font`
- Primary color: `#10B981` (green), danger: `#EF4444`, warning: `#F59E0B`

### Testing
- Jest with `ts-jest` preset, `node` environment
- `__mocks__/async-storage.ts` — in-memory key-value store mocking AsyncStorage
- Only `src/db.test.ts` exists: tests init, add/update/delete for transactions and categories

## Important Patterns & Conventions

- **Thai language throughout** — UI text, comments, and category names are in Thai (often with transliteration-style typos like "เงิน" for "เงิน")
- **No routing library** — tab switching is done via `activeTab` state in `App.tsx`
- **No prop drilling beyond one level** — screens receive data from `App.tsx`; screens don't import `db`
- **Categories have `monthlyLimit`** for budget tracking, stored as optional `number`
- **Transaction IDs** are `Date.now()` timestamps (not UUIDs)
- **All storage errors are swallowed with `console.warn`** — no retry logic
- **`newArchEnabled: true`** in `app.json` — React Native New Architecture is enabled
