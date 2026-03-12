const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const targetYear = parseInt(year) || now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const [transactions, budgets] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.user.id, date: { gte: startDate, lte: endDate } },
      }),
      prisma.budget.findMany({
        where: { userId: req.user.id, month: targetMonth, year: targetYear },
      }),
    ]);

    const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    // Category breakdown
    const categorySpending = {};
    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      if (!categorySpending[t.category]) categorySpending[t.category] = 0;
      categorySpending[t.category] += t.amount;
    });

    const categoryIncome = {};
    transactions.filter(t => t.type === 'INCOME').forEach(t => {
      if (!categoryIncome[t.category]) categoryIncome[t.category] = 0;
      categoryIncome[t.category] += t.amount;
    });

    // Budget comparison
    const budgetMap = {};
    budgets.forEach(b => { budgetMap[b.category] = b.monthlyLimit; });

    const categoryBreakdown = Object.entries(categorySpending).map(([category, spent]) => ({
      category,
      spent,
      budget: budgetMap[category] || null,
      overBudget: budgetMap[category] ? spent > budgetMap[category] : false,
    })).sort((a, b) => b.spent - a.spent);

    res.json({
      period: { month: targetMonth, year: targetYear },
      summary: { income, expenses, savings, savingsRate },
      categoryBreakdown,
      incomeBreakdown: Object.entries(categoryIncome).map(([category, amount]) => ({ category, amount })),
      transactionCount: transactions.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
};

const getAnnualReport = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id, date: { gte: startDate, lte: endDate } },
    });

    // Monthly breakdown
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expenses: 0,
    }));

    transactions.forEach(t => {
      const month = new Date(t.date).getMonth();
      if (t.type === 'INCOME') monthlyData[month].income += t.amount;
      else if (t.type === 'EXPENSE') monthlyData[month].expenses += t.amount;
    });

    monthlyData.forEach(m => {
      m.savings = m.income - m.expenses;
      m.savingsRate = m.income > 0 ? (m.savings / m.income) * 100 : 0;
    });

    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

    // Top categories
    const categorySpending = {};
    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      if (!categorySpending[t.category]) categorySpending[t.category] = 0;
      categorySpending[t.category] += t.amount;
    });

    const topCategories = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, amount]) => ({ category, amount }));

    res.json({
      year: targetYear,
      summary: {
        totalIncome,
        totalExpenses,
        totalSavings: totalIncome - totalExpenses,
        avgMonthlySavings: (totalIncome - totalExpenses) / 12,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      },
      monthlyBreakdown: monthlyData,
      topSpendingCategories: topCategories,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate annual report' });
  }
};

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Last 6 months for chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const [
      accounts,
      recentTransactions,
      monthlyTransactions,
      chartTransactions,
      investments,
      debts,
      goals,
      physicalAssets,
      upcomingInsurances,
    ] = await Promise.all([
      prisma.account.findMany({ where: { userId, isActive: true } }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 10,
        include: { account: { select: { name: true } } },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: sixMonthsAgo } },
      }),
      prisma.investment.findMany({ where: { userId } }),
      prisma.debt.findMany({ where: { userId, isPaidOff: false } }),
      prisma.goal.findMany({ where: { userId, isCompleted: false }, take: 4 }),
      prisma.physicalAsset.findMany({ where: { userId, isActive: true } }),
      prisma.insurance.findMany({
        where: { userId, isActive: true, renewalDate: { gte: now, lte: sixtyDaysFromNow } },
        orderBy: { renewalDate: 'asc' },
      }),
    ]);

    const totalAssets = accounts.reduce((s, a) => s + Math.max(0, a.balance), 0)
      + investments.reduce((s, i) => s + i.shares * i.currentPrice, 0)
      + physicalAssets.reduce((s, a) => s + a.currentValue, 0);
    const totalLiabilities = debts.reduce((s, d) => s + d.balance, 0);

    const monthlyIncome = monthlyTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

    // Build monthly chart data (last 6 months)
    const monthlyChart = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0, 23, 59, 59);

      const filtered = chartTransactions.filter(t => {
        const td = new Date(t.date);
        return td >= start && td <= end;
      });

      monthlyChart.push({
        month: d.toLocaleString('default', { month: 'short' }),
        income: filtered.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
        expenses: filtered.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
      });
    }

    res.json({
      netWorth: totalAssets - totalLiabilities,
      totalAssets,
      totalLiabilities,
      monthlyIncome,
      monthlyExpenses,
      recentTransactions,
      monthlyChart,
      goals: goals.map(g => ({
        ...g,
        progress: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
      })),
      investmentSummary: {
        totalValue: investments.reduce((s, i) => s + i.shares * i.currentPrice, 0),
        count: investments.length,
      },
      insuranceReminders: upcomingInsurances.map(p => ({
        ...p,
        daysUntilRenewal: Math.ceil((new Date(p.renewalDate) - now) / 86400000),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

module.exports = { getMonthlyReport, getAnnualReport, getDashboardData };
