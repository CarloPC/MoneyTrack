import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Users } from 'lucide-react';
import {
  fetchNonAdminUsers,
  fetchUserTransactions,
  restoreUserTransaction,
} from './adminService';
import styles from './Dashboard.module.css';

export default function AdminDashboard({ onClose, useTransactionSubcollection = true }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [activeTransactions, setActiveTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadTransactions(selectedUserId);
    } else {
      setActiveTransactions([]);
      setDeletedTransactions([]);
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      setError('');
      setLoadingUsers(true);
      const list = await fetchNonAdminUsers();
      setUsers(list);
      if (list.length) {
        setSelectedUserId(list[0].id);
      }
    } catch (err) {
      setError(err?.message || 'Unable to load users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadTransactions = async (userId) => {
    try {
      setError('');
      setLoadingTransactions(true);
      const [active, deleted] = await Promise.all([
        fetchUserTransactions(userId, false, { useSubcollection: useTransactionSubcollection }),
        fetchUserTransactions(userId, true, { useSubcollection: useTransactionSubcollection }),
      ]);
      setActiveTransactions(active);
      setDeletedTransactions(deleted);
    } catch (err) {
      setError(err?.message || 'Unable to load transactions.');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const selectedUser = users.find((user) => user.id === selectedUserId);

  const totals = activeTransactions.reduce(
    (summary, entry) => {
      const amount = Number(entry.amount) || 0;
      summary.total += amount;
      if (amount > 0) summary.income += amount;
      if (amount < 0) summary.expenses += amount;
      return summary;
    },
    { total: 0, income: 0, expenses: 0 }
  );

  const handleRestore = async (transactionId) => {
    if (!selectedUserId) return;
    try {
      setError('');
      await restoreUserTransaction(transactionId, selectedUserId, { useSubcollection: useTransactionSubcollection });
      await loadTransactions(selectedUserId);
    } catch (err) {
      setError(err?.message || 'Unable to restore the transaction.');
    }
  };

  return (
    <div className={styles.adminPanel}>
      <div className={styles.adminHeader}>
        <button className={styles.adminBackBtn} onClick={onClose}>
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h2 className={styles.tableTitle}>Admin Dashboard</h2>
          <p className={styles.adminMessage}>Browse non-admin users and restore deleted transactions instantly.</p>
        </div>
      </div>

      <div className={styles.adminControls}>
        <label className={styles.adminLabel}>
          <span>Select user</span>
          <select
            className={styles.adminSelect}
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            disabled={loadingUsers}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
        </label>

        <button className={styles.adminActionBtn} onClick={() => loadUsers()} disabled={loadingUsers}>
          <RefreshCw size={16} /> Refresh users
        </button>
      </div>

      {selectedUser && (
        <div className={styles.adminSummary}>
          <div className={styles.adminSummaryItem}>
            <div className={styles.adminSummaryLabel}>User</div>
            <div className={styles.adminSummaryValue}>{selectedUser.name || selectedUser.email}</div>
          </div>
          <div className={styles.adminSummaryItem}>
            <div className={styles.adminSummaryLabel}>Total Balance</div>
            <div className={styles.adminSummaryValue}>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(totals.total)}</div>
          </div>
          <div className={styles.adminSummaryItem}>
            <div className={styles.adminSummaryLabel}>Income</div>
            <div className={styles.adminSummaryValue} style={{ color: 'var(--green)' }}>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(totals.income)}</div>
          </div>
          <div className={styles.adminSummaryItem}>
            <div className={styles.adminSummaryLabel}>Expenses</div>
            <div className={styles.adminSummaryValue} style={{ color: 'var(--red)' }}>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(Math.abs(totals.expenses))}</div>
          </div>
        </div>
      )}

      {error && <div className={styles.adminError}>{error}</div>}

      {loadingTransactions ? (
        <div className={styles.empty}>Loading transactions…</div>
      ) : (
        <>
          <div className={styles.adminSection}>
            <div className={styles.adminSectionHeader}>
              <h3 className={styles.adminSectionTitle}>Active Transactions</h3>
              <span className={styles.adminSectionMeta}>{activeTransactions.length} active</span>
            </div>
            <div className={styles.tableWrap}>
              {activeTransactions.length === 0 ? (
                <div className={styles.empty}>No active transactions found.</div>
              ) : (
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Details</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTransactions.map((entry) => (
                        <tr key={entry.id} className={styles.row}>
                          <td className={styles.details}>{entry.details}</td>
                          <td className={Number(entry.amount) >= 0 ? styles.amtPos : styles.amtNeg}>
                            {Number(entry.amount) >= 0 ? '+' : ''}{entry.amount}
                          </td>
                          <td className={styles.date}>{entry.date}</td>
                          <td className={styles.reason}>{entry.reason || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className={styles.adminSection}>
            <div className={styles.adminSectionHeader}>
              <h3 className={styles.adminSectionTitle}>Deleted / Trash Bin</h3>
              <span className={styles.adminSectionMeta}>{deletedTransactions.length} deleted</span>
            </div>
            <div className={styles.tableWrap}>
              {deletedTransactions.length === 0 ? (
                <div className={styles.empty}>No deleted transactions found.</div>
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
                      {deletedTransactions.map((entry) => (
                        <tr key={entry.id} className={styles.row}>
                          <td className={styles.details}>{entry.details}</td>
                          <td className={Number(entry.amount) >= 0 ? styles.amtPos : styles.amtNeg}>
                            {Number(entry.amount) >= 0 ? '+' : ''}{entry.amount}
                          </td>
                          <td className={styles.date}>{entry.date}</td>
                          <td className={styles.reason}>{entry.reason || '—'}</td>
                          <td className={styles.actions}>
                            <button className={styles.restoreBtn} onClick={() => handleRestore(entry.id)}>
                              Restore
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

