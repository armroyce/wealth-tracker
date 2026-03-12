const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getNetWorth = async (req, res) => {
  try {
    const userId = req.user.id;

    const [accounts, investments, debts] = await Promise.all([
      prisma.account.findMany({ where: { userId, isActive: true } }),
      prisma.investment.findMany({ where: { userId } }),
      prisma.debt.findMany({ where: { userId, isPaidOff: false } }),
    ]);

    const liquidAssets = accounts
      .filter(a => ['CHECKING', 'SAVINGS'].includes(a.type))
      .reduce((s, a) => s + a.balance, 0);

    const investmentValue = investments.reduce((s, i) => s + i.shares * i.currentPrice, 0);

    const realEstate = accounts
      .filter(a => a.type === 'REAL_ESTATE')
      .reduce((s, a) => s + a.balance, 0);

    const retirement = accounts
      .filter(a => a.type === 'RETIREMENT')
      .reduce((s, a) => s + a.balance, 0);

    const otherAssets = accounts
      .filter(a => !['CHECKING', 'SAVINGS', 'REAL_ESTATE', 'RETIREMENT'].includes(a.type))
      .reduce((s, a) => s + Math.max(0, a.balance), 0);

    const totalAssets = liquidAssets + investmentValue + realEstate + retirement + otherAssets;
    const totalLiabilities = debts.reduce((s, d) => s + d.balance, 0);
    const netWorth = totalAssets - totalLiabilities;

    res.json({
      netWorth,
      totalAssets,
      totalLiabilities,
      breakdown: {
        liquidAssets,
        investments: investmentValue,
        realEstate,
        retirement,
        otherAssets,
        debts: totalLiabilities,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate net worth' });
  }
};

const getHistory = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const snapshots = await prisma.netWorthSnapshot.findMany({
      where: {
        userId: req.user.id,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    res.json({ history: snapshots });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch net worth history' });
  }
};

const takeSnapshot = async (req, res) => {
  try {
    const userId = req.user.id;

    const [accounts, investments, debts] = await Promise.all([
      prisma.account.findMany({ where: { userId, isActive: true } }),
      prisma.investment.findMany({ where: { userId } }),
      prisma.debt.findMany({ where: { userId, isPaidOff: false } }),
    ]);

    const liquidAssets = accounts
      .filter(a => ['CHECKING', 'SAVINGS'].includes(a.type))
      .reduce((s, a) => s + a.balance, 0);

    const investmentValue = investments.reduce((s, i) => s + i.shares * i.currentPrice, 0);
    const realEstate = accounts
      .filter(a => a.type === 'REAL_ESTATE')
      .reduce((s, a) => s + a.balance, 0);

    const totalAssets = accounts.reduce((s, a) => s + Math.max(0, a.balance), 0) + investmentValue;
    const totalLiabilities = debts.reduce((s, d) => s + d.balance, 0);

    const snapshot = await prisma.netWorthSnapshot.create({
      data: {
        userId,
        totalAssets,
        totalLiabilities,
        liquidAssets,
        investments: investmentValue,
        realEstate,
      },
    });

    res.status(201).json({ snapshot });
  } catch (err) {
    res.status(500).json({ error: 'Failed to take snapshot' });
  }
};

module.exports = { getNetWorth, getHistory, takeSnapshot };
