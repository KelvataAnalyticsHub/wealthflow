// ============================================================
//  WealthFlow – Data Layer
// ============================================================

const CURRENCIES = [
  { code: 'USD', symbol: '$',  name: 'US Dollar' },
  { code: 'EUR', symbol: '€',  name: 'Euro' },
  { code: 'GBP', symbol: '£',  name: 'British Pound' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'UGX', symbol: 'USh', name: 'Uganda Shilling' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzania Shilling' },
  { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira' },
  { code: 'GHS', symbol: '₵',  name: 'Ghanaian Cedi' },
  { code: 'ZAR', symbol: 'R',  name: 'South African Rand' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹',  name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$',  name: 'Mexican Peso' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼',  name: 'Saudi Riyal' },
];

const EXPENSE_CATEGORIES = [
  { id: 'food',        label: 'Food',        icon: '🍔', color: '#fb923c' },
  { id: 'transport',   label: 'Transport',   icon: '🚗', color: '#60a5fa' },
  { id: 'housing',     label: 'Housing',     icon: '🏠', color: '#a78bfa' },
  { id: 'health',      label: 'Health',      icon: '💊', color: '#34d399' },
  { id: 'education',   label: 'Education',   icon: '📚', color: '#fbbf24' },
  { id: 'shopping',    label: 'Shopping',    icon: '🛍️', color: '#f472b6' },
  { id: 'entertainment', label: 'Fun',       icon: '🎮', color: '#818cf8' },
  { id: 'utilities',   label: 'Utilities',   icon: '💡', color: '#2dd4bf' },
  { id: 'savings',     label: 'Savings',     icon: '💰', color: '#4ade80' },
  { id: 'clothing',    label: 'Clothing',    icon: '👗', color: '#e879f9' },
  { id: 'travel',      label: 'Travel',      icon: '✈️', color: '#38bdf8' },
  { id: 'insurance',   label: 'Insurance',   icon: '🛡️', color: '#64748b' },
  { id: 'gifts',       label: 'Gifts',       icon: '🎁', color: '#fb7185' },
  { id: 'other',       label: 'Other',       icon: '📌', color: '#94a3b8' },
];

const INCOME_CATEGORIES = [
  { id: 'salary',      label: 'Salary',      icon: '💼', color: '#34d399' },
  { id: 'freelance',   label: 'Freelance',   icon: '💻', color: '#60a5fa' },
  { id: 'business',    label: 'Business',    icon: '🏢', color: '#a78bfa' },
  { id: 'investment',  label: 'Investment',  icon: '📈', color: '#fbbf24' },
  { id: 'rental',      label: 'Rental',      icon: '🏘️', color: '#fb923c' },
  { id: 'gift',        label: 'Gift',        icon: '🎁', color: '#f472b6' },
  { id: 'other',       label: 'Other',       icon: '💵', color: '#94a3b8' },
];

const GOAL_ICONS = ['🏠','🚗','✈️','💍','🎓','🏖️','💻','📱','🎸','⛵','🌍','👶','🐕','🏋️','🎯'];

const CATEGORY_MAP = {};
[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].forEach(c => { CATEGORY_MAP[c.id] = c; });

// ============================================================
//  Storage helpers
// ============================================================
const Store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem('wf_' + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem('wf_' + key, JSON.stringify(val)); } catch {}
  },
  remove(key) { localStorage.removeItem('wf_' + key); },

  // App state
  getUser()   { return this.get('user', null); },
  setUser(u)  { this.set('user', u); },
  getTx()     { return this.get('transactions', []); },
  setTx(arr)  { this.set('transactions', arr); },
  getBudgets(){ return this.get('budgets', {}); },
  setBudgets(b){ this.set('budgets', b); },
  getGoals()  { return this.get('goals', []); },
  setGoals(g) { this.set('goals', g); },
};
