
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useFinance } from './FinanceContext';
import EntryModal from './EntryModal';
import AdminDashboard from './AdminDashboard';
import useInstallPrompt from './useInstallPrompt';
import styles from './Dashboard.module.css';
import { LogOut, Plus, TrendingUp, TrendingDown, Wallet, Edit2, Trash2, Search, ShieldCheck, Menu, X, Download, Check } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(n);

const parseTimestamp = (value) => {
  if (!value) return 0;
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }
  return new Date(value).getTime() || 0;
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { entries, deletedEntries, deleteEntry, restoreTransaction, total, income, expenses } = useFinance();
  const [modal, setModal] = useState(null); // null | 'add' | { entry }
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | income | expense
  const [showDeleted, setShowDeleted] = useState(false);
  const [showAdminView, setShowAdminView] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showInstallHint, setShowInstallHint] = useState(false);
  const isAdmin = user?.isAdmin === true;
  const { canInstall, promptInstall, isInstalled, platform } = useInstallPrompt();

  const installHintText = {
    ios: 'Tap the Share icon in Safari, then "Add to Home Screen".',
    android: 'Open the browser menu (⋮) and tap "Install app" or "Add to Home screen".',
    desktop: 'Click the install icon in your browser\'s address bar, or open the browser menu and choose "Install IponTrack…".',
    other: 'Open your browser menu and look for "Install app" or "Add to Home screen".',
  }[platform];

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 600;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleInstallClick = async () => {
    if (canInstall) {
      await promptInstall();
    } else {
      // No native prompt available (common on first visits, iOS Safari,
      // or plain-http/local testing) — show manual steps instead of doing
      // nothing.
      setShowInstallHint((current) => !current);
    }
  };

  const filtered = entries
    .filter(e => {
      if (filter === 'income') return Number(e.amount) > 0;
      if (filter === 'expense') return Number(e.amount) < 0;
      return true;
    })
    .filter(e =>
      e.details.toLowerCase().includes(search.toLowerCase()) ||
      (e.reason || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt));

  const deletedFiltered = deletedEntries
    .filter(e =>
      e.details.toLowerCase().includes(search.toLowerCase()) ||
      (e.reason || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt));

  const savingsRate = income > 0 ? ((income + expenses) / income * 100).toFixed(0) : 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.bgDeco} />
      {isMobile && sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarVisible : styles.sidebarHidden}`}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>₱</span>
          <span className={styles.brandName}>Ipon<span>Track</span></span>
        </div>

        <div className={styles.userCard}>
          <div className={styles.avatar}>{user.name[0].toUpperCase()}</div>
          <div>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userEmail}>{user.email}</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <button className={styles.navItem + ' ' + styles.navActive}><Wallet size={16}/>Overview</button>
        </nav>

        {!isInstalled && (
          <div className={styles.installWrap}>
            <button className={styles.installBtn} onClick={handleInstallClick}>
              <Download size={14}/> Install App
            </button>
            {showInstallHint && (
              <div className={styles.iosHint}>
                <p>{installHintText}</p>
                <button onClick={() => setShowInstallHint(false)}>Got it</button>
              </div>
            )}
          </div>
        )}
        {isInstalled && (
          <div className={styles.installedBadge}>
            <Check size={14}/> App installed
          </div>
        )}

        <button className={styles.logoutBtn} onClick={logout}><LogOut size={14}/> Sign Out</button>
      </aside>

      {/* Main */}
      <main className={`${styles.main} ${!sidebarOpen ? styles.mainNoSidebar : ''}`}>
      <div className={styles.mainInner}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.menuBtn} onClick={() => setSidebarOpen((current) => !current)}>
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <h1 className={styles.greeting}>Kumusta, <span>{user.name.split(' ')[0]}</span> 👋</h1>
              <p className={styles.subGreeting}>Here's your money overview</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            {isAdmin && (
              <button
                className={styles.adminBtn}
                onClick={() => setShowAdminView((current) => !current)}
              >
                <ShieldCheck size={16} /> {showAdminView ? 'Close Admin' : 'Admin Dashboard'}
              </button>
            )}
            {isAdmin && !showAdminView && (
              <button
                className={styles.filterBtn}
                onClick={() => setShowDeleted((current) => !current)}
              >
                {showDeleted ? 'Show Active' : 'Show Deleted'}
              </button>
            )}
            {!showAdminView && (
              <button className={styles.addBtn} onClick={() => setModal('add')}>
                <Plus size={16}/> Add Entry
              </button>
            )}
          </div>
        </header>

        {showAdminView ? (
          <AdminDashboard onClose={() => setShowAdminView(false)} useTransactionSubcollection={true} />
        ) : (
          <>
            {/* Stats */}
            <div className={styles.stats}>
              <div className={styles.statCard + ' ' + styles.statMain}>
                <div className={styles.statLabel}>Total Balance</div>
                <div className={styles.statValue + ' ' + (total >= 0 ? styles.pos : styles.neg)}>{fmt(total)}</div>
                <div className={styles.statSub}>Savings rate: {savingsRate}%</div>
                <div className={styles.statBar}>
                  <div className={styles.statBarFill} style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }} />
                </div>
              </div>
              <div className={styles.statCard}>
                <TrendingUp size={20} color="var(--green)" />
                <div className={styles.statLabel}>Total Income</div>
                <div className={styles.statValue + ' ' + styles.pos}>{fmt(income)}</div>
                <div className={styles.statSub}>{entries.filter(e => Number(e.amount) > 0).length} entries</div>
              </div>
              <div className={styles.statCard}>
                <TrendingDown size={20} color="var(--red)" />
                <div className={styles.statLabel}>Total Expenses</div>
                <div className={styles.statValue + ' ' + styles.neg}>{fmt(Math.abs(expenses))}</div>
                <div className={styles.statSub}>{entries.filter(e => Number(e.amount) < 0).length} entries</div>
              </div>
            </div>

            {/* Table */}
            <div className={styles.tableWrap}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>{showDeleted ? 'Deleted Transactions' : 'Transactions'}</h2>
            <div className={styles.tableControls}>
              <div className={styles.searchBox}>
                <Search size={14} color="var(--muted)" />
                <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className={styles.filterGroup}>
                {!showDeleted && ['all','income','expense'].map(f => (
                  <button key={f} className={filter === f ? styles.filterActive : styles.filterBtn} onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {showDeleted ? (
            deletedFiltered.length === 0 ? (
              <div className={styles.empty}>
                <span>No deleted transactions found.</span>
              </div>
            ) : (
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Details</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Reason</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedFiltered.map(entry => (
                      <tr key={entry.id} className={styles.row}>
                        <td className={styles.details}>{entry.details}</td>
                        <td className={Number(entry.amount) >= 0 ? styles.amtPos : styles.amtNeg}>
                          {Number(entry.amount) >= 0 ? '+' : ''}{fmt(entry.amount)}
                        </td>
                        <td className={styles.date}>{entry.date}</td>
                        <td className={styles.reason}>{entry.reason || '—'}</td>
                        <td className={styles.actions}>
                          <button className={styles.restoreBtn} onClick={() => restoreTransaction(entry.id)} title="Restore">Restore</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            filtered.length === 0 ? (
              <div className={styles.empty}>
                <span>No entries yet.</span>
                <button onClick={() => setModal('add')}>+ Add your first entry</button>
              </div>
            ) : (
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Details</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Reason</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(entry => (
                      <tr key={entry.id} className={styles.row}>
                        <td className={styles.details}>{entry.details}</td>
                        <td className={Number(entry.amount) >= 0 ? styles.amtPos : styles.amtNeg}>
                          {Number(entry.amount) >= 0 ? '+' : ''}{fmt(entry.amount)}
                        </td>
                        <td className={styles.date}>{entry.date}</td>
                        <td className={styles.reason}>{entry.reason || '—'}</td>
                        <td className={styles.actions}>
                          <button className={styles.editBtn} onClick={() => setModal({ entry })} title="Edit"><Edit2 size={14}/></button>
                          <button className={styles.delBtn} onClick={() => { if (confirm('Delete this entry?')) deleteEntry(entry.id); }} title="Delete"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
          </>
        )}
      </div>
      </main>

      {modal && (
        <EntryModal
          entry={modal !== 'add' ? modal.entry : null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
