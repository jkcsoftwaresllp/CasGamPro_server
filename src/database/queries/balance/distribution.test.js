import { strict as assert } from 'assert';
import { db } from '../../../config/db.js';
import { distributeHierarchyProfits } from './distribute.js';
import { users, user_limits_commissions, ledger } from '../../schema.js';
import { eq } from 'drizzle-orm';

describe('Profit Distribution Tests', () => {
  const testData = {
    admin: {
      id: 'ADMIN123',
      role: 'ADMIN',
      balance: 10000,
      first_name: "Zebra",
      password: "BLAH@123",
      blocking_levels: "NONE",
      parent_id: null
    },
    superAgent: {
      id: 'SA123',
      role: 'SUPERAGENT',
      balance: 5000,
      first_name: "Zebra",
      password: "BLAH@123",
      blocking_levels: "NONE",
      parent_id: 'ADMIN123'
    },
    agent: {
      id: 'AG123',
      role: 'AGENT',
      balance: 2000,
      first_name: "Zebra",
      password: "BLAH@123",
      blocking_levels: "NONE",
      parent_id: 'SA123'
    },
    player: {
      id: 'PL123',
      role: 'PLAYER',
      balance: 1000,
      first_name: "Zebra",
      password: "BLAH@123",
      blocking_levels: "NONE",
      parent_id: 'AG123'
    }
  };

  const commissionData = {
    agent: {
      user_id: 'AG123',
      max_share: 10,
      max_casino_commission: 3
    },
    superAgent: {
      user_id: 'SA123',
      max_share: 20,
      max_casino_commission: 2
    }
  };

  beforeEach(async () => {
    // Setup
    await db.delete(ledger);
    await db.delete(user_limits_commissions);
    await db.delete(users);

    await db.insert(users).values([
      testData.admin,
      testData.superAgent,
      testData.agent,
      testData.player
    ]);

    await db.insert(user_limits_commissions).values([
      commissionData.agent,
      commissionData.superAgent
    ]);
  });

  afterEach(async () => {
    // Cleanup
    await db.delete(ledger);
    await db.delete(user_limits_commissions);
    await db.delete(users);
  });

  it('should distribute correctly when player wins', async () => {
    const playerId = testData.player.id;
    const betAmount = 100;
    const winAmount = 150;
    const netAmount = winAmount - betAmount; // 50 profit

    await distributeHierarchyProfits(playerId, betAmount, netAmount);

    const agentResult = await db
      .select()
      .from(users)
      .where(eq(users.id, testData.agent.id))
      .limit(1);

    const expectedAgentCommission = betAmount * (commissionData.agent.max_casino_commission / 100);
    const expectedAgentShare = -(netAmount * (commissionData.agent.max_share / 100));
    const expectedAgentBalance = testData.agent.balance + expectedAgentCommission + expectedAgentShare;

    assert.equal(agentResult[0].balance, expectedAgentBalance);
  });

  it('should distribute correctly when player loses', async () => {
    const playerId = testData.player.id;
    const betAmount = 100;
    const winAmount = 50;
    const netAmount = winAmount - betAmount; // -50 loss

    await distributeHierarchyProfits(playerId, betAmount, netAmount);

    const agentResult = await db
      .select()
      .from(users)
      .where(eq(users.id, testData.agent.id))
      .limit(1);

    const expectedAgentCommission = betAmount * (commissionData.agent.max_casino_commission / 100);
    const expectedAgentShare = Math.abs(netAmount) * (commissionData.agent.max_share / 100);
    const expectedAgentBalance = testData.agent.balance + expectedAgentCommission + expectedAgentShare;

    assert.equal(agentResult[0].balance, expectedAgentBalance);

    const agentLedger = await db
      .select()
      .from(ledger)
      .where(eq(ledger.user_id, testData.agent.id));

    assert.equal(agentLedger.length, 2);
    assert(agentLedger.some(entry => entry.transaction_type === 'COMMISSION'));
    assert(agentLedger.some(entry => entry.transaction_type === 'PROFIT_SHARE'));
  });
});
