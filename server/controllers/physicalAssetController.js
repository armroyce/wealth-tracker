const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPhysicalAssets = async (req, res) => {
  try {
    const assets = await prisma.physicalAsset.findMany({
      where: { userId: req.user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    const totalCurrentValue = assets.reduce((s, a) => s + a.currentValue, 0);
    const totalPurchaseValue = assets.reduce((s, a) => s + (a.purchaseValue || 0), 0);
    res.json({ assets, totalCurrentValue, totalPurchaseValue });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
};

const createPhysicalAsset = async (req, res) => {
  try {
    const { name, type, currentValue, purchaseValue, purchaseDate, notes } = req.body;
    const asset = await prisma.physicalAsset.create({
      data: {
        userId: req.user.id,
        name,
        type,
        currentValue: parseFloat(currentValue),
        purchaseValue: purchaseValue ? parseFloat(purchaseValue) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        notes,
      },
    });
    res.status(201).json({ asset });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create asset' });
  }
};

const updatePhysicalAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.physicalAsset.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Asset not found' });

    const { name, type, currentValue, purchaseValue, purchaseDate, notes, isActive } = req.body;
    const asset = await prisma.physicalAsset.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(currentValue !== undefined && { currentValue: parseFloat(currentValue) }),
        ...(purchaseValue !== undefined && { purchaseValue: purchaseValue ? parseFloat(purchaseValue) : null }),
        ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json({ asset });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update asset' });
  }
};

const deletePhysicalAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.physicalAsset.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Asset not found' });
    await prisma.physicalAsset.delete({ where: { id } });
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete asset' });
  }
};

module.exports = { getPhysicalAssets, createPhysicalAsset, updatePhysicalAsset, deletePhysicalAsset };
