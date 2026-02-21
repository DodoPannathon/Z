let store: Record<string, string> = {};

const AsyncStorageMock = {
  getItem: async (key: string) => {
    return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
  },
  setItem: async (key: string, value: string) => {
    store[key] = value;
    return null;
  },
  removeItem: async (key: string) => {
    delete store[key];
    return null;
  },
  clear: async () => {
    store = {};
    return null;
  },
  getAllKeys: async () => Object.keys(store),
};

export default AsyncStorageMock;
