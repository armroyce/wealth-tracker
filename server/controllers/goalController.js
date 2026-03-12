const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getGoals = async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = goals.map(goal => {
      const progress = goal.targetAmount > 0
        ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
        : 0;
      const remaining = goal.targetAmount - goal.currentAmount;
      let monthsToGoal = null;

      if (goal.deadline && !goal.isCompleted) {
        const now = new Date();
        const deadline = new Date(goal.deadline);
        const monthsDiff = (deadline.getFullYear() - now.getFullYear()) * 12
          + (deadline.getMonth() - now.getMonth());
        monthsToGoal = Math.max(0, monthsDiff);
      }

      return { ...goal, progress, remaining, monthsToGoal };
    });

    res.json({ goals: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

const createGoal = async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, deadline, category, notes } = req.body;

    const goal = await prisma.goal.create({
      data: {
        userId: req.user.id,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: deadline ? new Date(deadline) : null,
        category,
        notes,
      },
    });

    res.status(201).json({ goal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.goal.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Goal not found' });

    const { name, targetAmount, currentAmount, deadline, category, notes, isCompleted } = req.body;

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(targetAmount !== undefined && { targetAmount: parseFloat(targetAmount) }),
        ...(currentAmount !== undefined && { currentAmount: parseFloat(currentAmount) }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(category !== undefined && { category }),
        ...(notes !== undefined && { notes }),
        ...(isCompleted !== undefined && { isCompleted }),
      },
    });

    res.json({ goal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.goal.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Goal not found' });

    await prisma.goal.delete({ where: { id } });
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};

const contributeToGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const existing = await prisma.goal.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Goal not found' });

    const newAmount = existing.currentAmount + parseFloat(amount);
    const isCompleted = newAmount >= existing.targetAmount;

    const goal = await prisma.goal.update({
      where: { id },
      data: { currentAmount: newAmount, isCompleted },
    });

    res.json({ goal, message: isCompleted ? 'Goal completed! 🎉' : 'Contribution added' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal, contributeToGoal };
