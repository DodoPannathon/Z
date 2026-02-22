import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type Transaction = {
  id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  iconColor?: string;
};

// Storage keys
const TX_KEY = '@z:transactions';
const CAT_KEY = '@z:categories';

// Default categories (kept small; App.tsx expects DEFAULT_CATEGORIES export)
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'อาหาร', icon: '🍔', color: '#FEE2E2', type: 'expense', iconColor: '#000' },
  { id: 'transport', name: 'เดินทาง', icon: '🚌', color: '#E0F2FE', type: 'expense', iconColor: '#000' },
  { id: 'shopping', name: 'ช้อปปิ้ง', icon: '🛍️', color: '#FCE7F3', type: 'expense', iconColor: '#000' },
  { id: 'education', name: 'การศึกษา', icon: '📚', color: '#E9D5FF', type: 'expense', iconColor: '#000' },
  { id: 'entertainment', name: 'บันเทิง', icon: '🎬', color: '#E0F7FA', type: 'expense', iconColor: '#000' },
  { id: 'salary', name: 'เงินเดือน', icon: '💼', color: '#DCFCE7', type: 'income', iconColor: '#000' },
  { id: 'other_income', name: 'อื่นๆ', icon: '📝', color: '#F3F4F6', type: 'income', iconColor: '#9CA3AF' },
  { id: 'other_expense', name: 'อื่นๆ', icon: '📝', color: '#F3F4F6', type: 'expense', iconColor: '#9CA3AF' },
];

// Initialize database: ensure categories exist
export async function initDatabase(): Promise<void> {
  try {
    const cats = await AsyncStorage.getItem(CAT_KEY);
    if (cats == null) {
      // Ensure default categories have iconColor
      const withIconColor = DEFAULT_CATEGORIES.map(c => ({ ...c, iconColor: c.iconColor || getContrastColor(c.color) }));
      await AsyncStorage.setItem(CAT_KEY, JSON.stringify(withIconColor));
    }
    const tx = await AsyncStorage.getItem(TX_KEY);
    if (tx == null) {
      await AsyncStorage.setItem(TX_KEY, JSON.stringify([]));
    }
  } catch (e) {
    // swallow for now; caller can handle if needed
    console.warn('initDatabase error', e);
  }
}

// Helper: return readable icon color (black or white) depending on bg hex
function getContrastColor(hex: string) {
  try {
    const c = hex.replace('#', '').trim();
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    // Perceived luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#000000' : '#FFFFFF';
  } catch (e) {
    return '#000000';
  }
}

// Transactions
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const raw = await AsyncStorage.getItem(TX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Transaction[];
    return parsed.sort((a, b) => b.id - a.id);
  } catch (e) {
    console.warn('getTransactions error', e);
    return [];
  }
}

export async function addTransaction(title: string, amount: number, type: 'income' | 'expense', category = 'other') {
  try {
    const all = await getTransactions();
    const id = Date.now();
    const item: Transaction = { id, title, amount, type, category, date: new Date().toLocaleString('th-TH') };
    all.unshift(item);
    await AsyncStorage.setItem(TX_KEY, JSON.stringify(all));
    return item;
  } catch (e) {
    console.warn('addTransaction error', e);
    throw e;
  }
}

export async function updateTransaction(tx: Transaction) {
  try {
    const all = await getTransactions();
    const idx = all.findIndex(t => t.id === tx.id);
    if (idx === -1) throw new Error('Transaction not found');
    all[idx] = tx;
    await AsyncStorage.setItem(TX_KEY, JSON.stringify(all));
    return tx;
  } catch (e) {
    console.warn('updateTransaction error', e);
    throw e;
  }
}

export async function deleteTransaction(id: number) {
  try {
    const all = await getTransactions();
    const filtered = all.filter(t => t.id !== id);
    await AsyncStorage.setItem(TX_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('deleteTransaction error', e);
    throw e;
  }
}

// Categories
export async function getCategories(): Promise<Category[]> {
  try {
    const raw = await AsyncStorage.getItem(CAT_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw) as Category[];
    // merge defaults for any missing
    const merged = [...parsed];
    for (const def of DEFAULT_CATEGORIES) {
      if (!merged.find(c => c.id === def.id)) merged.push(def);
    }
    // Ensure iconColor exists for all categories; if missing, compute and persist
    let changed = false;
    const ensured = merged.map(c => {
      if (!c.iconColor) {
        changed = true;
        return { ...c, iconColor: getContrastColor(c.color || '#FFFFFF') };
      }
      return c;
    });
    if (changed) {
      try {
        await AsyncStorage.setItem(CAT_KEY, JSON.stringify(ensured));
      } catch (e) {
        console.warn('getCategories persist iconColor error', e);
      }
    }
    return ensured;
  } catch (e) {
    console.warn('getCategories error', e);
    return DEFAULT_CATEGORIES;
  }
}

export async function addCategory(cat: Category) {
  try {
    const all = await getCategories();
    const withIcon = { ...cat, iconColor: cat.iconColor || getContrastColor(cat.color || '#FFFFFF') };
    all.push(withIcon);
    await AsyncStorage.setItem(CAT_KEY, JSON.stringify(all));
    return withIcon;
  } catch (e) {
    console.warn('addCategory error', e);
    throw e;
  }
}

export async function updateCategory(cat: Category) {
  try {
    const all = await getCategories();
    const idx = all.findIndex(c => c.id === cat.id);
    if (idx === -1) throw new Error('Category not found');
    const withIcon = { ...cat, iconColor: cat.iconColor || getContrastColor(cat.color || '#FFFFFF') };
    all[idx] = withIcon;
    await AsyncStorage.setItem(CAT_KEY, JSON.stringify(all));
    return withIcon;
  } catch (e) {
    console.warn('updateCategory error', e);
    throw e;
  }
}

export async function deleteCategory(id: string) {
  try {
    const all = await getCategories();
    const filtered = all.filter(c => c.id !== id);
    await AsyncStorage.setItem(CAT_KEY, JSON.stringify(filtered));
    // Optionally: reassign transactions using this category to 'other'
    const tx = await getTransactions();
    const updated = tx.map(t => t.category === id ? { ...t, category: 'other' } : t);
    await AsyncStorage.setItem(TX_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('deleteCategory error', e);
    throw e;
  }
}
