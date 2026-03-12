const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getInsurances = async (req, res) => {
  try {
    const insurances = await prisma.insurance.findMany({
      where: { userId: req.user.id, isActive: true },
      orderBy: { renewalDate: 'asc' },
    });
    const now = new Date();
    const withDays = insurances.map(p => ({
      ...p,
      daysUntilRenewal: Math.ceil((new Date(p.renewalDate) - now) / 86400000),
    }));
    res.json({ insurances: withDays });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch insurances' });
  }
};

const getUpcomingRenewals = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 60;
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    const insurances = await prisma.insurance.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
        renewalDate: { gte: now, lte: cutoff },
      },
      orderBy: { renewalDate: 'asc' },
    });

    const withDays = insurances.map(p => ({
      ...p,
      daysUntilRenewal: Math.ceil((new Date(p.renewalDate) - now) / 86400000),
    }));
    res.json({ reminders: withDays });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
};

const createInsurance = async (req, res) => {
  try {
    const { name, type, provider, policyNumber, premium, premiumInterval, coverageAmount, startDate, renewalDate, notes } = req.body;
    const insurance = await prisma.insurance.create({
      data: {
        userId: req.user.id,
        name,
        type,
        provider,
        policyNumber,
        premium: parseFloat(premium),
        premiumInterval: premiumInterval || 'yearly',
        coverageAmount: coverageAmount ? parseFloat(coverageAmount) : null,
        startDate: startDate ? new Date(startDate) : null,
        renewalDate: new Date(renewalDate),
        notes,
      },
    });
    res.status(201).json({ insurance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create insurance' });
  }
};

const updateInsurance = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.insurance.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Insurance not found' });

    const { name, type, provider, policyNumber, premium, premiumInterval, coverageAmount, startDate, renewalDate, notes, isActive } = req.body;
    const insurance = await prisma.insurance.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(provider !== undefined && { provider }),
        ...(policyNumber !== undefined && { policyNumber }),
        ...(premium !== undefined && { premium: parseFloat(premium) }),
        ...(premiumInterval !== undefined && { premiumInterval }),
        ...(coverageAmount !== undefined && { coverageAmount: coverageAmount ? parseFloat(coverageAmount) : null }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(renewalDate !== undefined && { renewalDate: new Date(renewalDate) }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json({ insurance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update insurance' });
  }
};

const deleteInsurance = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.insurance.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Insurance not found' });
    await prisma.insurance.delete({ where: { id } });
    res.json({ message: 'Insurance deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete insurance' });
  }
};

module.exports = { getInsurances, getUpcomingRenewals, createInsurance, updateInsurance, deleteInsurance };
