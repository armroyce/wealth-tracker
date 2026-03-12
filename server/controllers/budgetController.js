const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getBudgets = async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const targetYear = parseInt(year) || now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: { userId: req.user.id, month: targetMonth, year: targetYear },
    });

    // Fetch spending for each budget category
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const spending = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId: req.user.id,
        type: 'EXPENSE',
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const spendingMap = {};
    spending.forEach(s => {
      spendingMap[s.category] = s._sum.amount || 0;
    });

    const enriched = budgets.map(b => ({
      ...b,
      spent: spendingMap[b.category] || 0,
      remaining: b.monthlyLimit - (spendingMap[b.category] || 0),
      percentage: b.monthlyLimit > 0
        ? Math.min(((spendingMap[b.category] || 0) / b.monthlyLimit) * 100, 100)
        : 0,
    }));

    res.json({ budgets: enriched, month: targetMonth, year: targetYear });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

const createBudget = async (req, res) => {
  try {
    const { category, monthlyLimit, month, year } = req.body;
    const now = new Date();

    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month_year: {
          userId: req.user.id,
          category,
          month: parseInt(month) || now.getMonth() + 1,
          year: parseInt(year) || now.getFullYear(),
        },
      },
      update: { monthlyLimit: parseFloat(monthlyLimit) },
      create: {
        userId: req.user.id,
        category,
        monthlyLimit: parseFloat(monthlyLimit),
        month: parseInt(month) || now.getMonth() + 1,
        year: parseInt(year) || now.getFullYear(),
      },
    });

    res.status(201).json({ budget });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create budget' });
  }
};

const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.budget.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Budget not found' });

    const { monthlyLimit } = req.body;
    const budget = await prisma.budget.update({
      where: { id },
      data: { monthlyLimit: parseFloat(monthlyLimit) },
    });

    res.json({ budget });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update budget' });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.budget.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Budget not found' });

    await prisma.budget.delete({ where: { id } });
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
