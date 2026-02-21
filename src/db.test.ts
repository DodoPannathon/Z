import { initDatabase, getTransactions, addTransaction, updateTransaction, deleteTransaction, getCategories, addCategory, updateCategory, deleteCategory, DEFAULT_CATEGORIES, Transaction, Category } from './db';

describe('db module basic flow', () => {
  beforeEach(async () => {
    // clear mock storage
    const mock = require('@react-native-async-storage/async-storage').default;
    await mock.clear();
  });

  test('initDatabase creates default keys', async () => {
    await initDatabase();
    const cats = await getCategories();
    expect(cats).toEqual(expect.arrayContaining(DEFAULT_CATEGORIES));
    const tx = await getTransactions();
    expect(tx).toEqual([]);
  });

  test('add, update, delete transaction', async () => {
    await initDatabase();
    const added = await addTransaction('Test', 100, 'expense', 'other');
    expect(added.title).toBe('Test');

    let tx = await getTransactions();
    expect(tx.length).toBe(1);

    const updated: Transaction = { ...added, title: 'Updated' };
    await updateTransaction(updated);
    tx = await getTransactions();
    expect(tx[0].title).toBe('Updated');

    await deleteTransaction(added.id);
    tx = await getTransactions();
    expect(tx.length).toBe(0);
  });

  test('add, update, delete category', async () => {
    await initDatabase();
    const cat: Category = { id: 't1', name: 'T1', icon: '🧪', color: '#fff', type: 'expense', iconColor: '#000' };
    await addCategory(cat);
    let cats = await getCategories();
    expect(cats.find(c => c.id === 't1')).toBeDefined();

    const updated = { ...cat, name: 'T1-up' };
    await updateCategory(updated);
    cats = await getCategories();
    expect(cats.find(c => c.id === 't1')?.name).toBe('T1-up');

    await deleteCategory('t1');
    cats = await getCategories();
    expect(cats.find(c => c.id === 't1')).toBeUndefined();
  });
});
