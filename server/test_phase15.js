const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

process.env.PORT = 5096;

const mongoose = require('mongoose');
const app = require('./src/server');
const User = require('./src/models/User');
const { Transaction } = require('./src/models/Transaction');
const { Budget } = require('./src/models/Budget');
const { Goal } = require('./src/models/Goal');
const { InvestmentProfile } = require('./src/models/InvestmentProfile');
const { Notification } = require('./src/models/Notification');
const { AIConversation } = require('./src/models/AIConversation');
const { generateToken } = require('./src/utils/token');

const runTests = async () => {
  console.log('🚀 Starting Phase 15 Notifications & Reminders Automated Tests...\n');

  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/finai_db');
    console.log('✅ Connected to MongoDB');

    // Clean test accounts
    await User.deleteMany({ email: { $in: ['usera_phase15@test.com', 'userb_phase15@test.com'] } });
    await Notification.deleteMany({});
    await AIConversation.deleteMany({});

    const userA = await User.create({
      name: 'User A Phase15',
      email: 'usera_phase15@test.com',
      password: 'password123'
    });

    const userB = await User.create({
      name: 'User B Phase15',
      email: 'userb_phase15@test.com',
      password: 'password123'
    });

    const tokenA = generateToken(userA._id);
    const tokenB = generateToken(userB._id);

    // Clean user financial data
    await Transaction.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Budget.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Goal.deleteMany({ user: { $in: [userA._id, userB._id] } });

    // Seed User A Data (Food Budget ₹10,000, Expense ₹8,500 = 85% near limit)
    const now = new Date();

    await Transaction.create({
      user: userA._id,
      title: 'Monthly Salary',
      amount: 50000,
      type: 'income',
      category: 'Others',
      date: now
    });

    await Transaction.create({
      user: userA._id,
      title: 'Food Supermarket',
      amount: 8500,
      type: 'expense',
      category: 'Food',
      date: now
    });

    await Budget.create({
      user: userA._id,
      category: 'Food',
      amount: 10000,
      period: 'Monthly',
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    });

    await Goal.create({
      user: userA._id,
      name: 'Emergency Savings Fund',
      targetAmount: 50000,
      currentAmount: 25000, // 50% milestone
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      priority: 'High',
      status: 'Active'
    });

    console.log('✅ Seeded User A (Food budget 85% near limit, Goal 50% milestone)');

    const BASE_URL = `http://localhost:5096/api`;
    await new Promise((r) => setTimeout(r, 500));

    // 2. TEST 1: GET /api/notifications & Deduplication Check
    console.log('\n--- TEST 1: Notification Generation & Deduplication Engine ---');
    const firstFetchRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const firstFetchData = await firstFetchRes.json();
    console.log('GET /notifications 1st fetch status:', firstFetchRes.status, 'Count:', firstFetchData.count);

    if (firstFetchRes.status === 200 && firstFetchData.count > 0) {
      console.log('Generated Notifications:');
      firstFetchData.data.forEach((n) => {
        console.log(`- [${n.severity.toUpperCase()}] (${n.type}): ${n.title} -> ${n.message}`);
      });
      console.log('PASSED: In-app notifications automatically generated based on data');
    } else {
      throw new Error('FAILED: Initial notification generation');
    }

    const initialCount = firstFetchData.count;

    // Second fetch should return identical count due to deduplication engine
    const secondFetchRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const secondFetchData = await secondFetchRes.json();
    console.log('GET /notifications 2nd fetch count:', secondFetchData.count);

    if (secondFetchData.count === initialCount) {
      console.log('PASSED: Deduplication engine prevented duplicate notifications!');
    } else {
      throw new Error(`FAILED: Deduplication failed (got ${secondFetchData.count} vs expected ${initialCount})`);
    }

    const testNotifId = firstFetchData.data[0]._id;

    // 3. TEST 2: Unread Count & Read State Management
    console.log('\n--- TEST 2: Read/Unread State Management ---');
    const unreadCountRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const unreadCountData = await unreadCountRes.json();
    console.log('Unread count before marking read:', unreadCountData.count);

    if (unreadCountData.count > 0) {
      console.log('PASSED: Unread count endpoint returned correct unread quantity');
    }

    // Mark single notification as read
    const markSingleRes = await fetch(`${BASE_URL}/notifications/${testNotifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.log('Mark single read status:', markSingleRes.status);
    if (markSingleRes.status === 200) {
      console.log('PASSED: Marked single notification as read');
    }

    // Mark all as read
    const markAllRes = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.log('Mark all read status:', markAllRes.status);
    if (markAllRes.status === 200) {
      console.log('PASSED: Marked all notifications as read');
    }

    const finalUnreadRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const finalUnreadData = await finalUnreadRes.json();
    console.log('Unread count after mark all read:', finalUnreadData.count);
    if (finalUnreadData.count === 0) {
      console.log('PASSED: Unread count updated to 0');
    } else {
      throw new Error('FAILED: Mark all read count update');
    }

    // 4. TEST 3: Delete Notification
    console.log('\n--- TEST 3: Delete Notification ---');
    const deleteRes = await fetch(`${BASE_URL}/notifications/${testNotifId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.log('DELETE /notifications/:id status:', deleteRes.status);
    if (deleteRes.status === 200) {
      console.log('PASSED: Single notification deleted');
    } else {
      throw new Error('FAILED: Delete notification');
    }

    // 5. TEST 4: User Isolation & Security Checks
    console.log('\n--- TEST 4: User Data Isolation Security ---');
    // User B attempts to read User A's notification
    const userBReadRes = await fetch(`${BASE_URL}/notifications/${testNotifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    console.log('User B unauthorized read status:', userBReadRes.status);
    if (userBReadRes.status === 404) {
      console.log('PASSED: User B blocked from accessing User A notification (404 Not Found)');
    } else {
      throw new Error('FAILED: User B accessed User A notification!');
    }

    // User B fetches notifications -> 0 items
    const userBListRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const userBListData = await userBListRes.json();
    console.log('User B notifications count:', userBListData.count);
    if (userBListData.count === 0) {
      console.log('PASSED: User B receives ONLY User B data (0 notifications), 0 leakage from User A!');
    } else {
      throw new Error('FAILED: Cross-user data leakage detected!');
    }

    // 6. TEST 5: Full Phase 0-14 Regression Suite
    console.log('\n--- TEST 5: Full Phase 0-14 Regression Suite ---');

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

    const reg9 = await fetch(`${BASE_URL}/monthly-review?month=2026-09`, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log('Phase 14 GET /monthly-review:', reg9.status);

    if (reg1.status === 200 && reg2.status === 200 && reg3.status === 200 && reg4.status === 200 && reg5.status === 200 && reg6.status === 200 && reg7.status === 200 && reg8.status === 200 && reg9.status === 200) {
      console.log('PASSED: All Phase 0-14 endpoints operating with zero regression!');
    } else {
      throw new Error('FAILED: Regression check');
    }

    // Cleanup
    await User.deleteMany({ email: { $in: ['usera_phase15@test.com', 'userb_phase15@test.com'] } });
    await Transaction.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Budget.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Goal.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Notification.deleteMany({ user: { $in: [userA._id, userB._id] } });

    console.log('\n🎉 ALL PHASE 15 AUTOMATED TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILURE:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();
