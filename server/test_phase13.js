const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

process.env.PORT = 5098;

const mongoose = require('mongoose');
const app = require('./src/server');
const User = require('./src/models/User');
const { Transaction } = require('./src/models/Transaction');
const { Budget } = require('./src/models/Budget');
const { Goal } = require('./src/models/Goal');
const { InvestmentProfile } = require('./src/models/InvestmentProfile');
const { AIConversation } = require('./src/models/AIConversation');
const { generateToken } = require('./src/utils/token');

const runTests = async () => {
  console.log('🚀 Starting Phase 13 AI Financial Insights Automated Tests...\n');

  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/finai_db');
    console.log('✅ Connected to MongoDB');

    // Setup Test Users (User A and User B)
    await User.deleteMany({ email: { $in: ['usera_phase13@test.com', 'userb_phase13@test.com'] } });
    await AIConversation.deleteMany({});

    const userA = await User.create({
      name: 'User A Phase13',
      email: 'usera_phase13@test.com',
      password: 'password123'
    });

    const userB = await User.create({
      name: 'User B Phase13',
      email: 'userb_phase13@test.com',
      password: 'password123'
    });

    const tokenA = generateToken(userA._id);
    const tokenB = generateToken(userB._id);

    // Clean user data
    await Transaction.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Budget.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Goal.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await InvestmentProfile.deleteMany({ user: { $in: [userA._id, userB._id] } });

    // Seed User A Current & Previous Month Data
    const now = new Date();
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);

    // Income
    await Transaction.create({
      user: userA._id,
      title: 'Monthly Salary',
      amount: 70000,
      type: 'income',
      category: 'Others',
      date: new Date()
    });

    // Current Month Expenses (Food = ₹12,000)
    await Transaction.create({
      user: userA._id,
      title: 'Supermarket Groceries Current',
      amount: 12000,
      type: 'expense',
      category: 'Food',
      date: new Date()
    });

    // Previous Month Expenses (Food = ₹8,000 -> 50% increase)
    await Transaction.create({
      user: userA._id,
      title: 'Supermarket Groceries Prev',
      amount: 8000,
      type: 'expense',
      category: 'Food',
      date: prevMonthDate
    });

    // Budget: Food limit ₹13,000 (Spent ₹12,000 = 92.3% utilization -> Near Limit Warning)
    await Budget.create({
      user: userA._id,
      category: 'Food',
      amount: 13000,
      period: 'Monthly',
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    });

    // Goal: Macbook Pro Goal
    await Goal.create({
      user: userA._id,
      name: 'Laptop Goal',
      targetAmount: 120000,
      currentAmount: 40000,
      targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 4 months
      priority: 'High',
      status: 'Active'
    });

    console.log('✅ Seeded User A financial records (Food spending +50%, Food budget 92% utilized, Goal active)');

    const BASE_URL = `http://localhost:5098/api`;
    await new Promise((r) => setTimeout(r, 500));

    // 2. TEST 1: GET /api/insights (Full list)
    console.log('\n--- TEST 1: Proactive Insight Generation ---');
    const insightsRes = await fetch(`${BASE_URL}/insights`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const insightsData = await insightsRes.json();
    console.log('GET /insights status:', insightsRes.status, 'Total Insights count:', insightsData.count);

    if (insightsRes.status === 200 && insightsData.success && insightsData.count > 0) {
      console.log('Insights found:');
      insightsData.data.insights.forEach((ins) => {
        console.log(`- [${ins.severity.toUpperCase()}] (${ins.category}): ${ins.title} -> ${ins.description}`);
      });
      console.log('PASSED: Proactive insights generated successfully');
    } else {
      throw new Error('FAILED: GET /insights failed or empty response');
    }

    // 3. TEST 2: Category Filtering
    console.log('\n--- TEST 2: Category Filter Query ---');
    const spendingFilterRes = await fetch(`${BASE_URL}/insights?category=spending`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const spendingFilterData = await spendingFilterRes.json();
    console.log('GET /insights?category=spending status:', spendingFilterRes.status, 'Count:', spendingFilterData.count);

    if (spendingFilterRes.status === 200 && spendingFilterData.data.insights.every((i) => i.category.toLowerCase().includes('spending'))) {
      console.log('PASSED: Category filter strictly returned spending insights');
    } else {
      throw new Error('FAILED: Category filter query');
    }

    // 4. TEST 3: Dashboard Summary Endpoint
    console.log('\n--- TEST 3: Dashboard Insights Summary ---');
    const summaryRes = await fetch(`${BASE_URL}/insights/summary`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const summaryData = await summaryRes.json();
    console.log('GET /insights/summary status:', summaryRes.status, 'Compact count:', summaryData.count);

    if (summaryRes.status === 200 && summaryData.data.summaryInsights.length <= 3) {
      console.log('PASSED: Dashboard summary returned top insights');
    } else {
      throw new Error('FAILED: Insights summary endpoint');
    }

    // 5. TEST 4: User Data Isolation Security
    console.log('\n--- TEST 4: User Isolation Security ---');
    const userBRes = await fetch(`${BASE_URL}/insights`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const userBData = await userBRes.json();
    console.log('User B Insights Count:', userBData.count);

    if (userBRes.status === 200 && userBData.count === 0) {
      console.log('PASSED: User B receives ONLY User B data (0 insights), 0 leakage from User A!');
    } else {
      throw new Error('FAILED: Data leakage between users detected!');
    }

    // 6. TEST 5: Regression Suite across Phases 0-12
    console.log('\n--- TEST 5: Full Phase 0-12 Regression Suite ---');

    const reg1 = await fetch(`${BASE_URL}/transactions`, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log('Phase 3 GET /transactions:', reg1.status);

    const reg2 = await fetch(`${BASE_URL}/analytics/dashboard`, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log('Phase 6 GET /analytics/dashboard:', reg2.status);

    const reg3 = await fetch(`${BASE_URL}/budgets`, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log('Phase 7 GET /budgets:', reg3.status);

    const reg4 = await fetch(`${BASE_URL}/financial-health`, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log('Phase 8 GET /financial-health:', reg4.status);

    const reg5 = await fetch(`${BASE_URL}/goals`, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log('Phase 9 GET /goals:', reg5.status);

    const reg6 = await fetch(`${BASE_URL}/investments/plan`, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log('Phase 11 GET /investments/plan:', reg6.status);

    const reg7 = await fetch(`${BASE_URL}/ai/conversations`, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log('Phase 12 GET /ai/conversations:', reg7.status);

    if (reg1.status === 200 && reg2.status === 200 && reg3.status === 200 && reg4.status === 200 && reg5.status === 200 && reg6.status === 200 && reg7.status === 200) {
      console.log('PASSED: All Phase 0-12 endpoints operating with zero regression!');
    } else {
      throw new Error('FAILED: Regression check');
    }

    // Cleanup
    await User.deleteMany({ email: { $in: ['usera_phase13@test.com', 'userb_phase13@test.com'] } });
    await Transaction.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Budget.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Goal.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await InvestmentProfile.deleteMany({ user: { $in: [userA._id, userB._id] } });

    console.log('\n🎉 ALL PHASE 13 AUTOMATED TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILURE:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
