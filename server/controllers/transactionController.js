const { PrismaClient } = require('@prisma/client');
const { createObjectCsvWriter } = require('csv-writer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      type,
      accountId,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const where = { userId: req.user.id };
    if (category) where.category = category;
    if (type) where.type = type;
    if (accountId) where.accountId = accountId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { notes: { contains: search, mode: 'insensitive' } },
        { merchant: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { account: { select: { name: true, type: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

const createTransaction = async (req, res) => {
  try {
    const { amount, category, type, date, notes, merchant, accountId, isRecurring, recurringInterval } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        amount: parseFloat(amount),
        category,
        type,
        date: new Date(date),
        notes,
        merchant,
        accountId: accountId || null,
        isRecurring: isRecurring || false,
        recurringInterval: recurringInterval || null,
      },
      include: { account: { select: { name: true, type: true } } },
    });

    // Update account balance
    if (accountId) {
      const account = await prisma.account.findFirst({ where: { id: accountId, userId: req.user.id } });
      if (account) {
        const delta = type === 'INCOME' ? parseFloat(amount) : -parseFloat(amount);
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: account.balance + delta },
        });
      }
    }

    res.status(201).json({ transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.transaction.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Transaction not found' });

    const { amount, category, type, date, notes, merchant, isRecurring, recurringInterval } = req.body;

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(category !== undefined && { category }),
        ...(type !== undefined && { type }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(notes !== undefined && { notes }),
        ...(merchant !== undefined && { merchant }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurringInterval !== undefined && { recurringInterval }),
      },
      include: { account: { select: { name: true, type: true } } },
    });

    res.json({ transaction });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.transaction.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Transaction not found' });

    await prisma.transaction.delete({ where: { id } });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      select: { category: true },
      distinct: ['category'],
    });
    res.json({ categories: categories.map(c => c.category) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const exportCSV = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      include: { account: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });

    const csvData = transactions.map(t => ({
      date: t.date.toISOString().split('T')[0],
      type: t.type,
      category: t.category,
      amount: t.amount,
      merchant: t.merchant || '',
      notes: t.notes || '',
      account: t.account?.name || '',
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');

    const headers = Object.keys(csvData[0] || {});
    const csvLines = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h]}"`).join(',')),
    ];

    res.send(csvLines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
};

const importCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const results = [];
    const errors = [];

    const parseCSV = () =>
      new Promise((resolve) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', resolve);
      });

    await parseCSV();

    const transactions = [];
    for (const row of results) {
      try {
        transactions.push({
          userId: req.user.id,
          date: new Date(row.date),
          type: row.type?.toUpperCase() || 'EXPENSE',
          category: row.category || 'Other',
          amount: parseFloat(row.amount) || 0,
          merchant: row.merchant || null,
          notes: row.notes || null,
        });
      } catch (e) {
        errors.push(row);
      }
    }

    await prisma.transaction.createMany({ data: transactions });
    fs.unlinkSync(req.file.path);

    res.json({ imported: transactions.length, errors: errors.length });
  } catch (err) {
    res.status(500).json({ error: 'Import failed' });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  exportCSV,
  importCSV,
};
