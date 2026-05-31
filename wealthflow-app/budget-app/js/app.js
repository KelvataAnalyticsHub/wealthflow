// ============================================================
//  WealthFlow – Main App Logic
// ============================================================

let state = {
  user: null,
  transactions: [],
  budgets: {},
  goals: [],
  currentView: 'dashboard',
  txFilter: 'all',
  currentTxType: 'expense',
  selectedCategory: null,
  selectedGoalIcon: GOAL_ICONS[0],
  currentReport: 'monthly',
};

let deferredInstallPrompt = null;

// ============================================================
//  INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  buildCurrencyGrid();
  buildSettingsCurrencySelect();
  setTodayDate();

  const user = Store.getUser();
  if (user) {
    state.user = user;
    state.transactions = Store.getTx();
    state.budgets = Store.getBudgets();
    state.goals = Store.getGoals();
    loadApp();
  }

  // PWA install
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    showInstallBanner();
  });

  // Update month badge
  document.getElementById('monthBadge').textContent =
    new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});

// ============================================================
//  CURRENCY
// ============================================================
function buildCurrencyGrid() {
  const grid = document.getElementById('currencyGrid');
  grid.innerHTML = '';
  CURRENCIES.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'currency-chip' + (i === 0 ? ' selected' : '');
    el.dataset.code = c.code;
    el.innerHTML = `<div class="cc-code">${c.code} ${c.symbol}</div><div class="cc-name">${c.name}</div>`;
    el.onclick = () => selectCurrency(el, c);
    grid.appendChild(el);
  });
}

function selectCurrency(el, currency) {
  document.querySelectorAll('.currency-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedCurrency = currency;
  const sym = currency.symbol;
  document.getElementById('currencySymbolIncome').textContent = sym;
}

function getSelectedCurrencyFromGrid() {
  const sel = document.querySelector('.currency-chip.selected');
  if (!sel) return CURRENCIES[0];
  return CURRENCIES.find(c => c.code === sel.dataset.code) || CURRENCIES[0];
}

function buildSettingsCurrencySelect() {
  const sel = document.getElementById('settingCurrency');
  sel.innerHTML = CURRENCIES.map(c =>
    `<option value="${c.code}">${c.code} — ${c.symbol} — ${c.name}</option>`
  ).join('');
}

function getCurrencySymbol() {
  return state.user ? state.user.currency.symbol : '$';
}

function fmt(amount) {
  const sym = getCurrencySymbol();
  const abs = Math.abs(amount);
  const formatted = abs >= 1000
    ? abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : abs.toFixed(2);
  return sym + formatted;
}

// ============================================================
//  SETUP
// ============================================================
function setupUser() {
  const name = document.getElementById('userName').value.trim();
  const income = parseFloat(document.getElementById('monthlyIncome').value) || 0;
  const currency = getSelectedCurrencyFromGrid();

  if (!name) { showToast('Please enter your name', 'error'); return; }

  state.user = { name, income, currency };
  Store.setUser(state.user);
  loadApp();
}

function loadApp() {
  document.getElementById('splash').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');
  applyUserToUI();
  buildCatGrid('expense');
  buildGoalIconGrid();
  renderAll();
}

function applyUserToUI() {
  const u = state.user;
  document.getElementById('sidebarName').textContent = u.name;
  document.getElementById('sidebarAvatar').textContent = u.name[0].toUpperCase();
  document.getElementById('sidebarCurrency').textContent = `${u.currency.code} — ${u.currency.symbol}`;

  // Settings
  document.getElementById('settingName').value = u.name;
  document.getElementById('settingIncome').value = u.income;
  document.getElementById('settingCurrency').value = u.currency.code;

  // Currency symbols in modals
  const sym = u.currency.symbol;
  ['modalCurrencySymbol','budgetCurrencySymbol','goalCurrencySymbol','goalCurrencySymbol2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = sym;
  });
}

// ============================================================
//  NAVIGATION
// ============================================================
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`[data-view="${name}"]`)?.classList.add('active');

  const titles = { dashboard:'Dashboard', transactions:'Transactions', budgets:'Budgets', goals:'Goals', reports:'Reports', settings:'Settings' };
  document.getElementById('topbarTitle').textContent = titles[name] || name;

  state.currentView = name;
  closeSidebar();

  if (name === 'reports') renderReports();
  if (name === 'budgets') renderBudgets();
  if (name === 'goals') renderGoals();
}

// ============================================================
//  SIDEBAR
// ============================================================
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('overlay');
  sb.classList.toggle('open');
  ov.classList.toggle('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
}

// ============================================================
//  RENDER ALL
// ============================================================
function renderAll() {
  renderDashboard();
  renderTxList('dashboardTxList', state.transactions.slice(0,5));
  renderTxList('allTxList', getFilteredTx());
  renderBudgets();
  renderGoals();
  if (state.currentView === 'reports') renderReports();
}

// ============================================================
//  DASHBOARD
// ============================================================
function renderDashboard() {
  const u = state.user;
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const monthTx = state.transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const totalIncome = u.income + monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalSpent  = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance     = totalIncome - totalSpent;
  const pct         = totalIncome > 0 ? Math.min(100, Math.round((totalSpent / totalIncome) * 100)) : 0;

  const greeting = getGreeting();
  document.getElementById('heroGreeting').textContent = `${greeting}, ${u.name} 👋`;
  document.getElementById('heroBalance').textContent = fmt(Math.max(0, balance));
  document.getElementById('heroIncome').textContent = fmt(totalIncome);
  document.getElementById('heroSpent').textContent = fmt(totalSpent);
  document.getElementById('heroSaved').textContent = fmt(Math.max(0, balance));
  document.getElementById('heroPct').textContent = pct + '%';
  document.getElementById('heroSub').innerHTML = `of <span id="heroIncome">${fmt(totalIncome)}</span> monthly income`;

  setTimeout(() => {
    document.getElementById('heroBar').style.width = pct + '%';
  }, 100);

  // Category rings
  renderCategoryRings(monthTx.filter(t => t.type === 'expense'), totalSpent);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function renderCategoryRings(expenses, total) {
  const container = document.getElementById('categoryRings');
  if (!expenses.length) {
    container.innerHTML = '<div class="empty-state">No expenses this month</div>';
    return;
  }

  const grouped = {};
  expenses.forEach(tx => {
    if (!grouped[tx.category]) grouped[tx.category] = 0;
    grouped[tx.category] += tx.amount;
  });

  const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const radius = 20, circ = 2 * Math.PI * radius;

  container.innerHTML = sorted.map(([catId, amount]) => {
    const cat = CATEGORY_MAP[catId] || EXPENSE_CATEGORIES.find(c => c.id === 'other');
    const pct = total > 0 ? (amount / total) * 100 : 0;
    const dash = (pct / 100) * circ;

    return `
      <div class="cat-ring-card">
        <div class="ring-wrap">
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="${radius}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="5"/>
            <circle cx="26" cy="26" r="${radius}" fill="none" stroke="${cat.color}" stroke-width="5"
              stroke-dasharray="${dash} ${circ}" stroke-linecap="round"
              style="transition:stroke-dasharray 1s ease;transform-origin:center;transform:rotate(-90deg)"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1rem;">${cat.icon}</div>
        </div>
        <div>
          <div class="ring-label">${cat.label}</div>
          <div class="ring-amount" style="color:${cat.color}">${fmt(amount)}</div>
          <div class="ring-pct">${pct.toFixed(1)}%</div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
//  TRANSACTIONS
// ============================================================
function renderTxList(containerId, txArr) {
  const el = document.getElementById(containerId);
  if (!txArr.length) {
    el.innerHTML = '<div class="empty-state">No transactions yet</div>';
    return;
  }

  el.innerHTML = txArr.map((tx, i) => {
    const cat = CATEGORY_MAP[tx.category] || EXPENSE_CATEGORIES.find(c => c.id === 'other');
    const sign = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄';
    const amtClass = tx.type;
    const bg = cat ? `background:${cat.color}22` : 'background:rgba(255,255,255,0.05)';
    const icon = cat ? cat.icon : '📌';

    return `
      <div class="tx-item" style="animation-delay:${i * 0.04}s">
        <div class="tx-icon" style="${bg}">${icon}</div>
        <div class="tx-info">
          <div class="tx-desc">${escHtml(tx.description)}</div>
          <div class="tx-meta">${formatDate(tx.date)}${tx.note ? ' · ' + escHtml(tx.note) : ''}</div>
        </div>
        <div class="tx-amount ${amtClass}">${sign}${fmt(tx.amount)}</div>
        <button class="tx-delete" onclick="deleteTx('${tx.id}')" title="Delete">×</button>
      </div>
    `;
  }).join('');
}

function getFilteredTx() {
  const sorted = [...state.transactions].sort((a,b) => new Date(b.date)-new Date(a.date));
  if (state.txFilter === 'all') return sorted;
  return sorted.filter(t => t.type === state.txFilter);
}

function filterTx(btn, filter) {
  state.txFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTxList('allTxList', getFilteredTx());
}

function deleteTx(id) {
  state.transactions = state.transactions.filter(t => t.id !== id);
  Store.setTx(state.transactions);
  renderAll();
  showToast('Transaction deleted', 'success');
}

// ============================================================
//  ADD TRANSACTION MODAL
// ============================================================
function openAddModal(type = 'expense') {
  state.currentTxType = type;
  state.selectedCategory = null;
  setTodayDate();

  document.getElementById('txAmount').value = '';
  document.getElementById('txDesc').value = '';
  document.getElementById('txNote').value = '';

  // Set active tab
  document.querySelectorAll('.tt').forEach(t => t.classList.remove('active'));
  const tabs = document.querySelectorAll('#typeTabs .tt');
  const map = { expense: 0, income: 1, transfer: 2 };
  tabs[map[type]]?.classList.add('active');

  buildCatGrid(type);
  document.getElementById('categoryGroup').style.display = type === 'transfer' ? 'none' : 'block';

  openModal('addModal');
}

function setTxType(btn, type) {
  state.currentTxType = type;
  state.selectedCategory = null;
  document.querySelectorAll('#typeTabs .tt').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  buildCatGrid(type);
  document.getElementById('categoryGroup').style.display = type === 'transfer' ? 'none' : 'block';
}

function buildCatGrid(type) {
  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const grid = document.getElementById('catGrid');
  grid.innerHTML = cats.map(c => `
    <div class="cat-chip" data-id="${c.id}" onclick="selectCat(this,'${c.id}')">
      <span class="chip-icon">${c.icon}</span>
      <span class="chip-label">${c.label}</span>
    </div>
  `).join('');
}

function selectCat(el, id) {
  document.querySelectorAll('#catGrid .cat-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedCategory = id;
}

function saveTransaction() {
  const amount = parseFloat(document.getElementById('txAmount').value);
  const desc   = document.getElementById('txDesc').value.trim();
  const date   = document.getElementById('txDate').value;
  const note   = document.getElementById('txNote').value.trim();
  const type   = state.currentTxType;

  if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
  if (!desc) { showToast('Enter a description', 'error'); return; }
  if (!date) { showToast('Select a date', 'error'); return; }
  if (type !== 'transfer' && !state.selectedCategory) { showToast('Select a category', 'error'); return; }

  const tx = {
    id: 'tx_' + Date.now(),
    type,
    amount,
    description: desc,
    category: state.selectedCategory || 'other',
    date,
    note,
    createdAt: new Date().toISOString(),
  };

  state.transactions.unshift(tx);
  Store.setTx(state.transactions);
  closeModal('addModal');
  renderAll();
  showToast('Transaction saved ✓', 'success');
}

function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  const el = document.getElementById('txDate');
  if (el) el.value = today;
}

// ============================================================
//  BUDGETS
// ============================================================
function openBudgetModal() {
  const sel = document.getElementById('budgetCategory');
  sel.innerHTML = EXPENSE_CATEGORIES.map(c =>
    `<option value="${c.id}">${c.icon} ${c.label}</option>`
  ).join('');
  document.getElementById('budgetAmount').value = '';
  document.getElementById('budgetCurrencySymbol').textContent = getCurrencySymbol();
  openModal('budgetModal');
}

function saveBudget() {
  const cat    = document.getElementById('budgetCategory').value;
  const amount = parseFloat(document.getElementById('budgetAmount').value);

  if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }

  state.budgets[cat] = amount;
  Store.setBudgets(state.budgets);
  closeModal('budgetModal');
  renderBudgets();
  showToast('Budget saved ✓', 'success');
}

function renderBudgets() {
  const container = document.getElementById('budgetList');
  const now = new Date();
  const month = now.getMonth(), year = now.getFullYear();

  const monthExpenses = state.transactions.filter(tx => {
    const d = new Date(tx.date);
    return tx.type === 'expense' && d.getMonth() === month && d.getFullYear() === year;
  });

  const cats = Object.keys(state.budgets);
  if (!cats.length) {
    container.innerHTML = '<div class="empty-state">No budgets set. Tap "+ Set Budget" to begin.</div>';
    return;
  }

  container.innerHTML = cats.map(catId => {
    const limit = state.budgets[catId];
    const cat   = EXPENSE_CATEGORIES.find(c => c.id === catId) || { icon: '📌', label: catId, color: '#94a3b8' };
    const spent = monthExpenses.filter(t => t.category === catId).reduce((s,t) => s + t.amount, 0);
    const pct   = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    const color = pct >= 90 ? '#f87171' : pct >= 70 ? '#fbbf24' : cat.color;
    const remaining = Math.max(0, limit - spent);

    return `
      <div class="budget-card">
        <div class="budget-top">
          <div class="budget-cat">
            <span class="budget-cat-icon">${cat.icon}</span>
            <span>${cat.label}</span>
          </div>
          <div class="budget-amounts">
            <div class="budget-spent">${fmt(spent)}</div>
            <div class="budget-limit">of ${fmt(limit)}</div>
          </div>
        </div>
        <div class="budget-bar-wrap">
          <div class="budget-bar" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="budget-footer">
          <span>${pct.toFixed(0)}% used</span>
          <span>${pct >= 100 ? '⚠️ Over budget' : fmt(remaining) + ' left'}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
//  GOALS
// ============================================================
function buildGoalIconGrid() {
  const grid = document.getElementById('goalIconGrid');
  grid.innerHTML = GOAL_ICONS.map((icon, i) => `
    <div class="cat-chip ${i === 0 ? 'selected' : ''}" onclick="selectGoalIcon(this,'${icon}')">
      <span class="chip-icon">${icon}</span>
    </div>
  `).join('');
}

function selectGoalIcon(el, icon) {
  document.querySelectorAll('#goalIconGrid .cat-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedGoalIcon = icon;
}

function openGoalModal() {
  document.getElementById('goalName').value = '';
  document.getElementById('goalTarget').value = '';
  document.getElementById('goalSaved').value = '';
  document.getElementById('goalDate').value = '';
  ['goalCurrencySymbol','goalCurrencySymbol2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = getCurrencySymbol();
  });
  openModal('goalModal');
}

function saveGoal() {
  const name   = document.getElementById('goalName').value.trim();
  const target = parseFloat(document.getElementById('goalTarget').value) || 0;
  const saved  = parseFloat(document.getElementById('goalSaved').value) || 0;
  const date   = document.getElementById('goalDate').value;

  if (!name) { showToast('Enter a goal name', 'error'); return; }
  if (!target) { showToast('Enter a target amount', 'error'); return; }

  const goal = {
    id: 'g_' + Date.now(),
    name, target, saved, date,
    icon: state.selectedGoalIcon || '🎯',
    createdAt: new Date().toISOString(),
  };

  state.goals.push(goal);
  Store.setGoals(state.goals);
  closeModal('goalModal');
  renderGoals();
  showToast('Goal created ✓', 'success');
}

function addToGoal(goalId) {
  const amount = parseFloat(prompt(`How much to add? (${getCurrencySymbol()})`));
  if (!amount || amount <= 0) return;
  const goal = state.goals.find(g => g.id === goalId);
  if (!goal) return;
  goal.saved = Math.min(goal.target, goal.saved + amount);
  Store.setGoals(state.goals);
  renderGoals();
  showToast(`${fmt(amount)} added to "${goal.name}" ✓`, 'success');
}

function renderGoals() {
  const container = document.getElementById('goalList');
  if (!state.goals.length) {
    container.innerHTML = '<div class="empty-state">No goals yet. Tap "+ New Goal" to start saving.</div>';
    return;
  }

  container.innerHTML = state.goals.map(g => {
    const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
    const daysLeft = g.date ? Math.ceil((new Date(g.date) - new Date()) / 86400000) : null;

    return `
      <div class="goal-card">
        <div class="goal-top">
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="goal-icon-wrap">${g.icon}</div>
            <div>
              <div class="goal-name">${escHtml(g.name)}</div>
              <div class="goal-dates">${g.date ? (daysLeft > 0 ? daysLeft + ' days left' : 'Target reached!') : 'No deadline'}</div>
            </div>
          </div>
          <div class="goal-amounts">
            <div class="goal-saved-val">${fmt(g.saved)}</div>
            <div class="goal-target-val">of ${fmt(g.target)}</div>
          </div>
        </div>
        <div class="goal-bar-wrap">
          <div class="goal-bar" style="width:${pct}%"></div>
        </div>
        <div class="goal-pct">
          <span>${pct.toFixed(1)}% complete</span>
          <span>${fmt(Math.max(0, g.target - g.saved))} to go</span>
        </div>
        <button class="goal-add-btn" onclick="addToGoal('${g.id}')">+ Add Funds</button>
      </div>
    `;
  }).join('');
}

// ============================================================
//  REPORTS
// ============================================================
function switchReport(btn, type) {
  state.currentReport = type;
  document.querySelectorAll('.rt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderReports();
}

function renderReports() {
  const container = document.getElementById('reportContent');
  const txs = state.transactions;

  if (state.currentReport === 'monthly') {
    renderMonthlyReport(container, txs);
  } else if (state.currentReport === 'category') {
    renderCategoryReport(container, txs);
  } else {
    renderTrendReport(container, txs);
  }
}

function renderMonthlyReport(container, txs) {
  const now = new Date();
  const month = now.getMonth(), year = now.getFullYear();
  const monthTx = txs.filter(t => { const d=new Date(t.date); return d.getMonth()===month && d.getFullYear()===year; });

  const income  = monthTx.filter(t => t.type==='income').reduce((s,t) => s+t.amount, 0) + (state.user?.income || 0);
  const expense = monthTx.filter(t => t.type==='expense').reduce((s,t) => s+t.amount, 0);
  const net     = income - expense;
  const rate    = income > 0 ? ((income - expense) / income * 100) : 0;

  container.innerHTML = `
    <div class="report-card">
      <div style="font-family:var(--font-display);font-weight:700;font-size:1rem;margin-bottom:16px">
        ${now.toLocaleDateString('en-US',{month:'long',year:'numeric'})}
      </div>
      <div class="report-row">
        <span class="report-label">Total Income</span>
        <span class="report-val" style="color:var(--green)">${fmt(income)}</span>
      </div>
      <div class="report-row">
        <span class="report-label">Total Expenses</span>
        <span class="report-val" style="color:var(--red)">${fmt(expense)}</span>
      </div>
      <div class="report-row">
        <span class="report-label">Net Savings</span>
        <span class="report-val" style="color:${net>=0?'var(--green)':'var(--red)'}">${fmt(net)}</span>
      </div>
      <div class="report-row">
        <span class="report-label">Savings Rate</span>
        <span class="report-val">${rate.toFixed(1)}%</span>
      </div>
      <div class="report-row">
        <span class="report-label">Transactions</span>
        <span class="report-val">${monthTx.length}</span>
      </div>
    </div>
  `;
}

function renderCategoryReport(container, txs) {
  const grouped = {};
  txs.filter(t => t.type === 'expense').forEach(t => {
    if (!grouped[t.category]) grouped[t.category] = 0;
    grouped[t.category] += t.amount;
  });

  const total = Object.values(grouped).reduce((s,v) => s+v, 0);
  const sorted = Object.entries(grouped).sort((a,b) => b[1]-a[1]);

  if (!sorted.length) {
    container.innerHTML = '<div class="empty-state">No expense data yet</div>';
    return;
  }

  container.innerHTML = `
    <div class="report-card">
      <div style="font-family:var(--font-display);font-weight:700;font-size:1rem;margin-bottom:16px">All-time by Category</div>
      ${sorted.map(([catId, amount]) => {
        const cat = EXPENSE_CATEGORIES.find(c=>c.id===catId)||{icon:'📌',label:catId,color:'#94a3b8'};
        const pct = total>0?(amount/total*100):0;
        return `
          <div class="report-row" style="flex-direction:column;align-items:stretch;gap:8px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="display:flex;align-items:center;gap:8px">${cat.icon} <span>${cat.label}</span></span>
              <span class="report-val" style="color:${cat.color}">${fmt(amount)}</span>
            </div>
            <div style="background:var(--bg3);border-radius:99px;height:6px;overflow:hidden">
              <div style="width:${pct}%;height:100%;background:${cat.color};border-radius:99px;transition:width 1s ease"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderTrendReport(container, txs) {
  // Last 6 months
  const months = [];
  const now = new Date();
  for (let i=5; i>=0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('en-US',{month:'short'}) });
  }

  const data = months.map(m => {
    const mTx = txs.filter(t => { const d=new Date(t.date); return d.getMonth()===m.month && d.getFullYear()===m.year; });
    return {
      label: m.label,
      income: mTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0) + (state.user?.income||0),
      expense: mTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0),
    };
  });

  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);

  container.innerHTML = `
    <div class="report-card">
      <div style="font-family:var(--font-display);font-weight:700;font-size:1rem;margin-bottom:16px">6-Month Trend</div>
      <div style="display:flex;gap:16px;margin-bottom:12px;font-size:0.75rem">
        <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:var(--green);display:inline-block"></span>Income</span>
        <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:var(--red);display:inline-block"></span>Expenses</span>
      </div>
      <div class="chart-bars">
        ${data.map(d => {
          const incH = Math.round((d.income/maxVal)*110);
          const expH = Math.round((d.expense/maxVal)*110);
          return `
            <div class="chart-bar-wrap">
              <div style="display:flex;gap:3px;align-items:flex-end;height:110px">
                <div class="chart-bar" style="background:var(--green);height:${incH}px;flex:1"></div>
                <div class="chart-bar" style="background:var(--red);height:${expH}px;flex:1"></div>
              </div>
              <div class="chart-bar-label">${d.label}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ============================================================
//  SETTINGS
// ============================================================
function updateCurrencyFromSettings() {
  const code = document.getElementById('settingCurrency').value;
  const cur  = CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
  document.getElementById('settingCurrency').value = code;
  state.user.currency = cur;
}

function saveSettings() {
  const name   = document.getElementById('settingName').value.trim();
  const income = parseFloat(document.getElementById('settingIncome').value) || 0;
  const code   = document.getElementById('settingCurrency').value;
  const cur    = CURRENCIES.find(c => c.code === code) || state.user.currency;

  if (!name) { showToast('Name cannot be empty', 'error'); return; }

  state.user = { name, income, currency: cur };
  Store.setUser(state.user);
  applyUserToUI();
  renderAll();
  showToast('Settings saved ✓', 'success');
}

function exportCSV() {
  const rows = [['Date','Type','Category','Description','Amount','Currency','Note']];
  state.transactions.forEach(t => {
    const cat = CATEGORY_MAP[t.category]?.label || t.category;
    rows.push([t.date, t.type, cat, t.description, t.amount, state.user.currency.code, t.note||'']);
  });
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  downloadFile(csv, 'wealthflow-export.csv', 'text/csv');
  showToast('CSV exported ✓', 'success');
}

function exportJSON() {
  const data = { user: state.user, transactions: state.transactions, budgets: state.budgets, goals: state.goals, exportedAt: new Date().toISOString() };
  downloadFile(JSON.stringify(data, null, 2), 'wealthflow-backup.json', 'application/json');
  showToast('JSON exported ✓', 'success');
}

function downloadFile(content, filename, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function resetApp() {
  if (!confirm('Are you sure? This will delete ALL your data.')) return;
  ['wf_user','wf_transactions','wf_budgets','wf_goals'].forEach(k => localStorage.removeItem(k));
  location.reload();
}

// ============================================================
//  MODALS
// ============================================================
function openModal(id) {
  document.getElementById(id + 'Backdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id + 'Backdrop').classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================================
//  TOAST
// ============================================================
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ============================================================
//  PWA INSTALL
// ============================================================
function showInstallBanner() {
  const existing = document.getElementById('installBanner');
  if (existing) return;

  const banner = document.createElement('div');
  banner.id = 'installBanner';
  banner.className = 'install-banner';
  banner.innerHTML = `
    <p><strong>Install WealthFlow</strong> on your device for offline access</p>
    <button class="install-btn" onclick="installApp()">Install</button>
  `;

  const dashboard = document.getElementById('view-dashboard');
  dashboard.insertBefore(banner, dashboard.firstChild);
}

async function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    document.getElementById('installBanner')?.remove();
    showToast('WealthFlow installed! 🎉', 'success');
  }
  deferredInstallPrompt = null;
}

// ============================================================
//  UTILS
// ============================================================
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
