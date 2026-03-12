const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAccounts = async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ accounts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

const createAccount = async (req, res) => {
  try {
    const { name, type, balance, currency, institution, accountNumber } = req.body;
    const account = await prisma.account.create({
      data: {
        userId: req.user.id,
        name,
        type,
        balance: parseFloat(balance) || 0,
        currency: currency || 'INR',
        institution,
        accountNumber,
      },
    });
    res.status(201).json({ account });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account' });
  }
};

const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.account.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Account not found' });

    const { name, type, balance, currency, institution, accountNumber, isActive } = req.body;
    const account = await prisma.account.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(balance !== undefined && { balance: parseFloat(balance) }),
        ...(currency !== undefined && { currency }),
        ...(institution !== undefined && { institution }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json({ account });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update account' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.account.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Account not found' });

    await prisma.account.delete({ where: { id } });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

const getAccountSummary = async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user.id, isActive: true },
    });

    const summary = {
      totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
      byType: {},
    };

    accounts.forEach(a => {
      if (!summary.byType[a.type]) summary.byType[a.type] = 0;
      summary.byType[a.type] += a.balance;
    });

    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
};

module.exports = { getAccounts, createAccount, updateAccount, deleteAccount, getAccountSummary };
