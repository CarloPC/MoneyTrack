import { useState, useEffect } from 'react';
import { useFinance } from './FinanceContext';
import styles from './EntryModal.module.css';
import { X } from 'lucide-react';

export default function EntryModal({ entry, onClose }) {
  const { addEntry, updateEntry } = useFinance();
  const isEdit = !!entry;

  const [form, setForm] = useState({
    details: '',
    amount: '',
    date: new Date().toLocaleDateString('en-CA'),
    reason: '',
    type: 'income',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entry) {
      setForm({
        details: entry.details,
        amount: Math.abs(Number(entry.amount)).toString(),
        date: entry.date,
        reason: entry.reason || '',
        type: Number(entry.amount) >= 0 ? 'income' : 'expense',
      });
    }
  }, [entry]);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const amount = form.type === 'expense' ? -Math.abs(Number(form.amount)) : Math.abs(Number(form.amount));
      if (isEdit) {
        await updateEntry(entry.id, { ...form, amount });
      } else {
        await addEntry({ ...form, amount });
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Unable to save entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? 'Edit Entry' : 'New Entry'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18}/></button>
        </div>

        <div className={styles.typeToggle}>
          <button
            className={form.type === 'income' ? styles.typeActive + ' ' + styles.typeIncome : styles.typeBtn}
            onClick={() => setForm({ ...form, type: 'income' })}
          >+ Income</button>
          <button
            className={form.type === 'expense' ? styles.typeActive + ' ' + styles.typeExpense : styles.typeBtn}
            onClick={() => setForm({ ...form, type: 'expense' })}
          >- Expense</button>
        </div>

        <form className={styles.form} onSubmit={handle}>
          <div className={styles.field}>
            <label>Details</label>
            <input
              required placeholder="e.g. Sent Gcash, Withdraw cash"
              value={form.details} onChange={e => setForm({ ...form, details: e.target.value })}
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Amount (₱)</label>
              <input
                type="number" required min="0.01" step="0.01" placeholder="0.00"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Date</label>
              <input
                type="date" required
                value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Reason <span className={styles.opt}>(optional)</span></label>
            <input
              placeholder="e.g. Paldo Scatter haha, Expenses sa bukid"
              value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <div className={styles.btns}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Entry')}
            </button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}