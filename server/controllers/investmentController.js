const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

// Fetch price from Alpha Vantage (free tier) or Yahoo Finance fallback
const fetchLivePrice = async (ticker) => {
  if (!process.env.ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY === 'your-alpha-vantage-api-key') {
    return null;
  }

  return new Promise((resolve) => {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
    https.get(url, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const price = parseFloat(parsed['Global Quote']?.['05. price']);
          resolve(isNaN(price) ? null : price);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
};

const getInvestments = async (req, res) => {
  try {
    const investments = await prisma.investment.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = investments.map(inv => ({
      ...inv,
      totalValue: inv.shares * inv.currentPrice,
      totalCost: inv.shares * inv.purchasePrice,
      gainLoss: (inv.currentPrice - inv.purchasePrice) * inv.shares,
      gainLossPercent: inv.purchasePrice > 0
        ? ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100
        : 0,
    }));

    const totalValue = enriched.reduce((s, i) => s + i.totalValue, 0);
    const totalCost = enriched.reduce((s, i) => s + i.totalCost, 0);
    const totalGainLoss = totalValue - totalCost;

    res.json({
      investments: enriched,
      summary: {
        totalValue,
        totalCost,
        totalGainLoss,
        totalGainLossPercent: totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
};

const createInvestment = async (req, res) => {
  try {
    const { ticker, name, shares, purchasePrice, type, purchaseDate, notes } = req.body;

    // Try to fetch live price
    let currentPrice = parseFloat(purchasePrice) || 0;
    const livePrice = await fetchLivePrice(ticker?.toUpperCase());
    if (livePrice) currentPrice = livePrice;

    const investment = await prisma.investment.create({
      data: {
        userId: req.user.id,
        ticker: ticker?.toUpperCase(),
        name,
        shares: parseFloat(shares),
        purchasePrice: parseFloat(purchasePrice),
        currentPrice,
        type,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        notes,
      },
    });

    res.status(201).json({ investment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create investment' });
  }
};

const updateInvestment = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.investment.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Investment not found' });

    const { ticker, name, shares, purchasePrice, currentPrice, type, purchaseDate, notes } = req.body;

    const investment = await prisma.investment.update({
      where: { id },
      data: {
        ...(ticker !== undefined && { ticker: ticker.toUpperCase() }),
        ...(name !== undefined && { name }),
        ...(shares !== undefined && { shares: parseFloat(shares) }),
        ...(purchasePrice !== undefined && { purchasePrice: parseFloat(purchasePrice) }),
        ...(currentPrice !== undefined && { currentPrice: parseFloat(currentPrice) }),
        ...(type !== undefined && { type }),
        ...(purchaseDate !== undefined && { purchaseDate: new Date(purchaseDate) }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json({ investment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update investment' });
  }
};

const deleteInvestment = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.investment.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Investment not found' });

    await prisma.investment.delete({ where: { id } });
    res.json({ message: 'Investment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete investment' });
  }
};

const refreshPrices = async (req, res) => {
  try {
    const investments = await prisma.investment.findMany({
      where: { userId: req.user.id },
    });

    const updates = [];
    for (const inv of investments) {
      const price = await fetchLivePrice(inv.ticker);
      if (price !== null) {
        updates.push(
          prisma.investment.update({
            where: { id: inv.id },
            data: { currentPrice: price },
          })
        );
      }
    }

    await Promise.all(updates);
    res.json({ updated: updates.length, message: 'Prices refreshed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh prices' });
  }
};

const getAllocation = async (req, res) => {
  try {
    const investments = await prisma.investment.findMany({
      where: { userId: req.user.id },
    });

    const byType = {};
    investments.forEach(inv => {
      const value = inv.shares * inv.currentPrice;
      if (!byType[inv.type]) byType[inv.type] = 0;
      byType[inv.type] += value;
    });

    const total = Object.values(byType).reduce((s, v) => s + v, 0);
    const allocation = Object.entries(byType).map(([type, value]) => ({
      type,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }));

    res.json({ allocation, totalValue: total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch allocation' });
  }
};

module.exports = {
  getInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  refreshPrices,
  getAllocation,
};
