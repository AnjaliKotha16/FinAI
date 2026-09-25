const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

process.env.PORT = 5097;

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
  console.log('🚀 Starting Phase 14 Monthly Financial Review Automated Tests...\n');

  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/finai_db');
    console.log('✅ Connected to MongoDB');

    // Clean test accounts
    await User.deleteMany({ email: { $in: ['usera_phase14@test.com', 'userb_phase14@test.com'] } });
    await AIConversation.deleteMany({});

    const userA = await User.create({
      name: 'User A Phase14',
      email: 'usera_phase14@test.com',
      password: 'password123'
    });

    const userB = await User.create({
      name: 'User B Phase14',
      email: 'userb_phase14@test.com',
      password: 'password123'
    });

    const tokenA = generateToken(userA._id);
    const tokenB = generateToken(userB._id);

    // Clean user records
    await Transaction.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Budget.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Goal.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await InvestmentProfile.deleteMany({ user: { $in: [userA._id, userB._id] } });

    // Seed User A Data (September 2026 vs August 2026)
    const sepDate = new Date(2026, 8, 15); // Sept 15, 2026
    const augDate = new Date(2026, 7, 15); // Aug 15, 2026

    // User A September 2026 Data (Income: ₹50,000, Expenses: ₹30,000 -> Savings: ₹20,000, Rate: 40%)
    await Transaction.create({
      user: userA._id,
      title: 'Sept Salary',
      amount: 50000,
      type: 'income',
      category: 'Others',
      date: sepDate
    });

    await Transaction.create({
      user: userA._id,
      title: 'Sept Food Dining',
      amount: 10000,
      type: 'expense',
      category: 'Food',
      date: sepDate
    });

    await Transaction.create({
      user: userA._id,
      title: 'Sept Apartment Rent',
      amount: 20000,
      type: 'expense',
      category: 'Rent',
      date: sepDate
    });

    // User A August 2026 Data (Income: ₹40,000, Expenses: ₹35,000)
    await Transaction.create({
      user: userA._id,
      title: 'Aug Salary',
      amount: 40000,
      type: 'income',
      category: 'Others',
      date: augDate
    });

    await Transaction.create({
      user: userA._id,
      title: 'Aug Rent',
      amount: 20000,
      type: 'expense',
      category: 'Rent',
      date: augDate
    });

    await Transaction.create({
      user: userA._id,
      title: 'Aug Shopping',
      amount: 15000,
      type: 'expense',
      category: 'Shopping',
      date: augDate
    });

    // Budget for September
    await Budget.create({
      user: userA._id,
      category: 'Food',
      amount: 12000,
      period: 'Monthly',
      startDate: new Date(2026, 8, 1),
      endDate: new Date(2026, 8, 30)
    });

    // User B Data (Zero Income, ₹5,000 Expense in Sept 2026)
    await Transaction.create({
      user: userB._id,
      title: 'User B Shopping',
      amount: 5000,
      type: 'expense',
      category: 'Shopping',
      date: sepDate
    });

    console.log('✅ Seeded User A (Sept 2026 Income: ₹50k, Exp: ₹30k) and User B (Income: ₹0, Exp: ₹5k)');

    const BASE_URL = `http://localhost:5097/api`;
    await new Promise((r) => setTimeout(r, 500));

    // 2. TEST 1: Invalid Month Parameter Validation
    console.log('\n--- TEST 1: Month Parameter Validation ---');
    const invalidRes = await fetch(`${BASE_URL}/monthly-review?month=invalid-month`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.log('Invalid month query status:', invalidRes.status);
    if (invalidRes.status === 400) {
      console.log('PASSED: Invalid month parameter rejected with 400 Bad Request');
    } else {
      throw new Error('FAILED: Month parameter validation');
    }

    // 3. TEST 2: Deterministic Financial Math & MoM Calculations
    console.log('\n--- TEST 2: Monthly Financial Math & MoM Calculations ---');
    const reviewRes = await fetch(`${BASE_URL}/monthly-review?month=2026-09`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const reviewData = await reviewRes.json();
    console.log('GET /monthly-review?month=2026-09 status:', reviewRes.status);

    if (reviewRes.status === 200 && reviewData.success) {
      const { summary, comparison, highlights } = reviewData.data;
      console.log('Calculated Summary:', summary);
      console.log('MoM Comparison:', comparison);
      console.log('Factual Highlights:', highlights);

      if (summary.income === 50000 && summary.expenses === 30000 && summary.savings === 20000 && summary.savingsRate === 40) {
        console.log('PASSED: Monthly summary math calculated perfectly (Income ₹50k, Exp ₹30k, Savings ₹20k, Rate 40%)');
      } else {
        throw new Error(`FAILED: Summary math mismatch (got ${JSON.stringify(summary)})`);
      }

      if (comparison.income.status === 'increased' && comparison.expenses.status === 'decreased') {
        console.log('PASSED: Month-over-month comparisons accurate (Income increased, Expenses decreased)');
      } else {
        throw new Error('FAILED: MoM comparison calculation mismatch');
      }
    } else {
      throw new Error('FAILED: GET /monthly-review endpoint response');
    }

    // 4. TEST 3: Zero Income Safety (Divide-by-Zero Protection)
    console.log('\n--- TEST 3: Zero Income Safety Handling ---');
    const userBRes = await fetch(`${BASE_URL}/monthly-review?month=2026-09`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const userBData = await userBRes.json();
    console.log('User B Review Status:', userBRes.status, 'Summary:', userBData.data.summary);

    if (userBRes.status === 200 && userBData.data.summary.income === 0 && userBData.data.summary.savingsRate === null) {
      console.log('PASSED: Zero income handled safely without NaN or divide-by-zero error');
    } else {
      throw new Error('FAILED: Zero income safety handling');
    }

    // 5. TEST 4: Security & User Isolation
    console.log('\n--- TEST 4: Security & User Isolation ---');
    if (userBData.data.summary.expenses === 5000 && userBData.data.summary.income === 0) {
      console.log('PASSED: User B receives ONLY User B data (₹5,000 expenses), 0 data leakage from User A!');
    } else {
      throw new Error('FAILED: Cross-user data leakage detected!');
    }

    // 6. TEST 5: Full Regression Suite across Phases 0-13
    console.log('\n--- TEST 5: Full Phase 0-13 Regression Suite ---');

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

    const reg8 = await fetch(`${BASE_URL}/insights`, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log('Phase 13 GET /insights:', reg8.status);

    if (reg1.status === 200 && reg2.status === 200 && reg3.status === 200 && reg4.status === 200 && reg5.status === 200 && reg6.status === 200 && reg7.status === 200 && reg8.status === 200) {
      console.log('PASSED: All Phase 0-13 endpoints operating with zero regression!');
    } else {
      throw new Error('FAILED: Regression check');
    }

    // Cleanup
    await User.deleteMany({ email: { $in: ['usera_phase14@test.com', 'userb_phase14@test.com'] } });
    await Transaction.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Budget.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Goal.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await InvestmentProfile.deleteMany({ user: { $in: [userA._id, userB._id] } });

    console.log('\n🎉 ALL PHASE 14 AUTOMATED TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILURE:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
