# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Z is a React Native / Expo personal finance app (รายรับ-รายจ่าย — income/expense tracker) that tracks transactions and categories with a swipeable modal UI. Built with Expo SDK 54, React Native 0.81, TypeScript, and NativeWind (Tailwind CSS for React Native).

## Quick Commands

```bash
npm start              # Start Expo dev server (port 3000)
npm run android        # Run on Android emulator/device
npm run ios            # Run on iOS simulator
npm run web            # Run on web
npm test               # Run Jest tests (ts-jest, node environment)
```

## Architecture

### File Structure

```
App.tsx                  # Main app — single-file orchestrator (~900 lines)
src/
  db.ts                  # Data layer: types + AsyncStorage CRUD for transactions & categories
  db.test.ts             # Jest tests for db module
  screens/
    BudgetScreen.tsx     # Budget management screen (progress bars, health status, category budgets)
    SummaryScreen.tsx    # Financial summary screen (period selector, category breakdown, daily trend)
__mocks__/
  async-storage.ts       # Jest mock for @react-native-async-storage/async-storage
```

### Key Patterns

- **Single-file app shell**: `App.tsx` contains all state management, UI, modals, and styles (~900 lines). Screens are extracted as separate components (`BudgetScreen`, `SummaryScreen`) but the main tab navigation, transaction/category modals, and global state live in `App.tsx`.
- **Data layer**: `src/db.ts` exports typed CRUD functions backed by `AsyncStorage`. Types: `Transaction` (id, title, amount, type, category, date) and `Category` (id, name, icon, color, type, monthlyLimit). Default categories are embedded.
- **State flow**: `App.tsx` loads data via `getTransactions()` / `getCategories()` on mount. All mutations go through `db.ts` functions, then `App.tsx` re-fetches to update state.
- **Modals**: Two swipeable, draggable modals using `PanResponder` + `Animated.Value` — transaction add/edit modal and category add/edit modal. Both support drag-to-resize height with spring animations.
- **Tabs**: Bottom nav with 4 tabs: home (หน้าหลัก), budget (งบประมาณ), category (หมวดหมู่), settings (ตั้งค่า — not yet implemented). FAB button in center for adding transactions.
- **Styling**: `StyleSheet.create` throughout (not NativeWind classes), despite NativeWind being in dependencies. Tailwind config exists but is minimally used.

### Screens

- **Home**: Shows balance, income/expense stats, daily progress circle (SVG), transaction list. View switcher for monthly/weekly/daily.
- **Budget**: Health status card, budget summary cards, filter buttons (all/warning/exceeded), per-category budget progress bars. Respects `budgetcutperiod` setting (monthly/weekly/daily).
- **Summary**: Period selector (week/month/year), income/expense/net cards, key metrics (savings rate, transaction count, avg daily expense), category breakdown with progress bars, 7-day trend chart, top transaction.

### Important Details

- All UI text is in Thai.
- Font: NotoSansThai (Medium, Bold, SemiBold) loaded via expo-font.
- Currency: Thai Baht (฿).
- Date storage: ISO strings.
- Category deletion cascades: transactions referencing deleted categories get reassigned to `'other'`.
- `DEFAULT_CATEGORIES` is exported from `db.ts` and used as initial state in `App.tsx`.
- `DEFAULT_COLOR` array defines 14 soft pastel colors for category color picker.
- Web build is constrained to `maxWidth: 480px` centered layout.
- New Architecture enabled (`newArchEnabled: true` in app.json).
