export const formatCurrency = (amount, currency = 'INR', compact = false) => {
  if (amount === null || amount === undefined) return '--';
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const opts = {
    style: 'currency',
    currency,
    ...(compact && Math.abs(amount) >= 1000 && {
      notation: 'compact',
      maximumFractionDigits: 1,
    }),
  };
  return new Intl.NumberFormat(locale, opts).format(amount);
};

export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '--';
  const formatted = Math.abs(value).toFixed(decimals);
  return `${value >= 0 ? '+' : '-'}${formatted}%`;
};

export const formatDate = (date, format = 'short') => {
  if (!date) return '--';
  const d = new Date(date);
  if (format === 'short') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (format === 'month') return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  if (format === 'relative') {
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString();
};

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const TRANSACTION_CATEGORIES = {
  EXPENSE: [
    'Rent/Mortgage', 'Groceries', 'Dining', 'Transportation', 'Utilities',
    'Healthcare', 'Insurance', 'Entertainment', 'Shopping', 'Education',
    'Personal Care', 'Travel', 'Gifts', 'Subscriptions', 'Other',
  ],
  INCOME: [
    'Salary', 'Freelance', 'Business', 'Dividends', 'Interest',
    'Rental Income', 'Capital Gains', 'Refund', 'Other',
  ],
};

export const ACCOUNT_TYPE_LABELS = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  BROKERAGE: 'Brokerage',
  CRYPTO: 'Crypto',
  REAL_ESTATE: 'Real Estate',
  RETIREMENT: 'Retirement',
  CREDIT_CARD: 'Credit Card',
  LOAN: 'Loan',
  OTHER: 'Other',
};

export const INVESTMENT_TYPE_LABELS = {
  STOCK: 'Stock',
  ETF: 'ETF',
  CRYPTO: 'Crypto',
  REAL_ESTATE: 'Real Estate',
  BOND: 'Bond',
  MUTUAL_FUND: 'Mutual Fund',
  OTHER: 'Other',
};

export const DEBT_TYPE_LABELS = {
  CREDIT_CARD: 'Credit Card',
  STUDENT_LOAN: 'Student Loan',
  MORTGAGE: 'Mortgage',
  CAR_LOAN: 'Car Loan',
  PERSONAL_LOAN: 'Personal Loan',
  MEDICAL: 'Medical',
  OTHER: 'Other',
};

export const PHYSICAL_ASSET_TYPE_LABELS = {
  HOUSE: 'House',
  LAND: 'Land',
  GOLD: 'Gold',
  SILVER: 'Silver',
  CAR: 'Car',
  BIKE: 'Bike',
  JEWELLERY: 'Jewellery',
  ELECTRONICS: 'Electronics',
  ART: 'Art',
  OTHER: 'Other',
};

export const INSURANCE_TYPE_LABELS = {
  HEALTH: 'Health',
  TERM_LIFE: 'Term Life',
  WHOLE_LIFE: 'Whole Life',
  CAR: 'Car',
  BIKE: 'Bike',
  HOME: 'Home',
  TRAVEL: 'Travel',
  OTHER: 'Other',
};
