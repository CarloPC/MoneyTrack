import('./src/FinanceContext.jsx').then(m => console.log(Object.keys(m))).catch(e => { console.error(e); process.exit(1); });
