const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDebts = async (req, res) => {
  try {
    const debts = await prisma.debt.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = debts.map(debt => ({
      ...debt,
      monthlyInterest: (debt.balance * debt.interestRate) / 100 / 12,
      payoffMonths: calculatePayoffMonths(debt.balance, debt.interestRate, debt.minimumPayment),
    }));

    const totalDebt = debts.filter(d => !d.isPaidOff).reduce((s, d) => s + d.balance, 0);
    const totalMinPayment = debts.filter(d => !d.isPaidOff).reduce((s, d) => s + d.minimumPayment, 0);

    res.json({ debts: enriched, summary: { totalDebt, totalMinPayment } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch debts' });
  }
};

const calculatePayoffMonths = (balance, annualRate, monthlyPayment) => {
  if (monthlyPayment <= 0 || balance <= 0) return null;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return Math.ceil(balance / monthlyPayment);
  if (monthlyPayment <= balance * monthlyRate) return null; // Will never pay off

  return Math.ceil(
    -Math.log(1 - (balance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate)
  );
};

const getPayoffPlan = async (req, res) => {
  try {
    const { method = 'avalanche', extraPayment = 0 } = req.query;
    const debts = await prisma.debt.findMany({
      where: { userId: req.user.id, isPaidOff: false },
    });

    // Sort debts based on method
    const sorted = [...debts].sort((a, b) => {
      if (method === 'avalanche') return b.interestRate - a.interestRate; // Highest rate first
      return a.balance - b.balance; // Snowball: lowest balance first
    });

    const plan = sorted.map((debt, index) => ({
      ...debt,
      priority: index + 1,
      payoffMonths: calculatePayoffMonths(
        debt.balance,
        debt.interestRate,
        debt.minimumPayment + (index === 0 ? parseFloat(extraPayment) : 0)
      ),
      totalInterest: calculateTotalInterest(
        debt.balance,
        debt.interestRate,
        debt.minimumPayment + (index === 0 ? parseFloat(extraPayment) : 0)
      ),
    }));

    res.json({ plan, method });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate payoff plan' });
  }
};

const calculateTotalInterest = (balance, annualRate, monthlyPayment) => {
  const months = calculatePayoffMonths(balance, annualRate, monthlyPayment);
  if (!months) return null;
  return (monthlyPayment * months) - balance;
};

const createDebt = async (req, res) => {
  try {
    const { name, balance, originalBalance, interestRate, minimumPayment, type, dueDate, notes } = req.body;

    const debt = await prisma.debt.create({
      data: {
        userId: req.user.id,
        name,
        balance: parseFloat(balance),
        originalBalance: originalBalance ? parseFloat(originalBalance) : parseFloat(balance),
        interestRate: parseFloat(interestRate),
        minimumPayment: parseFloat(minimumPayment),
        type,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
      },
    });

    res.status(201).json({ debt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create debt' });
  }
};

const updateDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.debt.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Debt not found' });

    const { name, balance, interestRate, minimumPayment, type, dueDate, notes, isPaidOff } = req.body;

    const debt = await prisma.debt.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(balance !== undefined && { balance: parseFloat(balance) }),
        ...(interestRate !== undefined && { interestRate: parseFloat(interestRate) }),
        ...(minimumPayment !== undefined && { minimumPayment: parseFloat(minimumPayment) }),
        ...(type !== undefined && { type }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(notes !== undefined && { notes }),
        ...(isPaidOff !== undefined && { isPaidOff }),
      },
    });

    res.json({ debt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update debt' });
  }
};

const deleteDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.debt.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Debt not found' });

    await prisma.debt.delete({ where: { id } });
    res.json({ message: 'Debt deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete debt' });
  }
};

module.exports = { getDebts, createDebt, updateDebt, deleteDebt, getPayoffPlan };
