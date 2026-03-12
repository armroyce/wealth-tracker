const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('demo1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@wealthtracker.com' },
    update: {},
    create: {
      email: 'demo@wealthtracker.com',
      passwordHash,
      name: 'Demo User',
      currency: 'USD',
    },
  });

  // Accounts
  const checking = await prisma.account.create({
    data: { userId: user.id, name: 'Chase Checking', type: 'CHECKING', balance: 4250.00 },
  });
  const savings = await prisma.account.create({
    data: { userId: user.id, name: 'High-Yield Savings', type: 'SAVINGS', balance: 18500.00 },
  });
  const brokerage = await prisma.account.create({
    data: { userId: user.id, name: 'Fidelity Brokerage', type: 'BROKERAGE', balance: 42000.00 },
  });
  const retirement = await prisma.account.create({
    data: { userId: user.id, name: '401(k)', type: 'RETIREMENT', balance: 85000.00 },
  });

  // Investments
  await prisma.investment.createMany({
    data: [
      { userId: user.id, ticker: 'AAPL', name: 'Apple Inc.', shares: 25, purchasePrice: 145.00, currentPrice: 178.50, type: 'STOCK' },
      { userId: user.id, ticker: 'VTI', name: 'Vanguard Total Stock ETF', shares: 50, purchasePrice: 200.00, currentPrice: 228.00, type: 'ETF' },
      { userId: user.id, ticker: 'BTC', name: 'Bitcoin', shares: 0.5, purchasePrice: 35000.00, currentPrice: 52000.00, type: 'CRYPTO' },
      { userId: user.id, ticker: 'MSFT', name: 'Microsoft Corp.', shares: 15, purchasePrice: 280.00, currentPrice: 415.00, type: 'STOCK' },
    ],
  });

  // Transactions (last 3 months)
  const now = new Date();
  const transactions = [];
  const expenseCategories = ['Groceries', 'Rent', 'Utilities', 'Dining', 'Entertainment', 'Transport', 'Healthcare', 'Shopping'];
  const incomeCategories = ['Salary', 'Freelance', 'Dividends'];

  for (let i = 0; i < 3; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    // Salary
    transactions.push({
      userId: user.id,
      accountId: checking.id,
      amount: 6500,
      category: 'Salary',
      type: 'INCOME',
      date: new Date(month.getFullYear(), month.getMonth(), 1),
      merchant: 'Employer Inc.',
    });
    // Expenses
    transactions.push(
      { userId: user.id, accountId: checking.id, amount: 1800, category: 'Rent', type: 'EXPENSE', date: new Date(month.getFullYear(), month.getMonth(), 1), merchant: 'Landlord LLC' },
      { userId: user.id, accountId: checking.id, amount: 320 + Math.random() * 80, category: 'Groceries', type: 'EXPENSE', date: new Date(month.getFullYear(), month.getMonth(), 8), merchant: 'Whole Foods' },
      { userId: user.id, accountId: checking.id, amount: 89.99, category: 'Utilities', type: 'EXPENSE', date: new Date(month.getFullYear(), month.getMonth(), 10), merchant: 'Electric Co.' },
      { userId: user.id, accountId: checking.id, amount: 150 + Math.random() * 50, category: 'Dining', type: 'EXPENSE', date: new Date(month.getFullYear(), month.getMonth(), 15), merchant: 'Various Restaurants' },
      { userId: user.id, accountId: checking.id, amount: 55, category: 'Entertainment', type: 'EXPENSE', date: new Date(month.getFullYear(), month.getMonth(), 20), merchant: 'Netflix + Spotify' },
      { userId: user.id, accountId: checking.id, amount: 120, category: 'Transport', type: 'EXPENSE', date: new Date(month.getFullYear(), month.getMonth(), 22), merchant: 'Uber / Gas' },
    );
  }

  await prisma.transaction.createMany({ data: transactions });

  // Budgets
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  await prisma.budget.createMany({
    data: [
      { userId: user.id, category: 'Groceries', monthlyLimit: 400, month: currentMonth, year: currentYear },
      { userId: user.id, category: 'Dining', monthlyLimit: 200, month: currentMonth, year: currentYear },
      { userId: user.id, category: 'Entertainment', monthlyLimit: 100, month: currentMonth, year: currentYear },
      { userId: user.id, category: 'Transport', monthlyLimit: 150, month: currentMonth, year: currentYear },
      { userId: user.id, category: 'Shopping', monthlyLimit: 300, month: currentMonth, year: currentYear },
    ],
  });

  // Debts
  await prisma.debt.createMany({
    data: [
      { userId: user.id, name: 'Student Loan', balance: 18500, originalBalance: 35000, interestRate: 4.5, minimumPayment: 280, type: 'STUDENT_LOAN' },
      { userId: user.id, name: 'Chase Sapphire Card', balance: 2300, originalBalance: 2300, interestRate: 22.99, minimumPayment: 75, type: 'CREDIT_CARD' },
      { userId: user.id, name: 'Car Loan', balance: 11200, originalBalance: 18000, interestRate: 5.9, minimumPayment: 320, type: 'CAR_LOAN' },
    ],
  });

  // Goals
  await prisma.goal.createMany({
    data: [
      { userId: user.id, name: 'Emergency Fund', targetAmount: 20000, currentAmount: 18500, deadline: new Date(now.getFullYear(), now.getMonth() + 3, 1), category: 'Savings' },
      { userId: user.id, name: 'Europe Vacation', targetAmount: 5000, currentAmount: 1800, deadline: new Date(now.getFullYear() + 1, 5, 1), category: 'Travel' },
      { userId: user.id, name: 'Down Payment', targetAmount: 80000, currentAmount: 25000, deadline: new Date(now.getFullYear() + 3, 0, 1), category: 'Real Estate' },
      { userId: user.id, name: 'New Car', targetAmount: 30000, currentAmount: 8000, deadline: new Date(now.getFullYear() + 2, 0, 1), category: 'Vehicle' },
    ],
  });

  // Net worth snapshots (last 6 months)
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
    const growth = 1 + (5 - i) * 0.02;
    await prisma.netWorthSnapshot.create({
      data: {
        userId: user.id,
        totalAssets: 148000 * growth,
        totalLiabilities: 32000 * (1 - (5 - i) * 0.02),
        liquidAssets: 22500 * growth,
        investments: 85000 * growth,
        realEstate: 0,
        date,
      },
    });
  }

  console.log('Seed complete! Demo user: demo@wealthtracker.com / demo1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
