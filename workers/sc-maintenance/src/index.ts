/**
 * SC Maintenance Worker
 *
 * Scheduled worker for data retention enforcement.
 * Runs daily at 2 AM UTC via cron trigger.
 *
 * Data retention rules (per spec Section 3.5):
 * - event_log.user_agent: Anonymize after 90 days (PII-adjacent)
 * - event_log.*: Keep 2 years (audit trail)
 * - leads.*: Indefinite (business records)
 * - payments.*: 7 years (financial compliance)
 * - experiments.*: Indefinite (historical reference)
 */

interface Env {
  DB: D1Database;
}

interface MaintenanceResult {
  task: string;
  rowsAffected: number;
  durationMs: number;
}

export default {
  /**
   * Scheduled event handler - runs on cron trigger
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Maintenance worker started', {
      scheduledTime: event.scheduledTime,
      cron: event.cron,
    });

    const results: MaintenanceResult[] = [];
    const startTime = Date.now();

    try {
      // Task 1: Anonymize user_agent in event_log after 90 days
      const userAgentResult = await anonymizeUserAgents(env.DB);
      results.push(userAgentResult);

      const totalDuration = Date.now() - startTime;

      console.log('Maintenance worker completed', {
        totalDurationMs: totalDuration,
        results,
      });
    } catch (error) {
      console.error('Maintenance worker failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        results,
      });

      // Re-throw to mark the scheduled event as failed
      throw error;
    }
  },

  /**
   * HTTP handler for manual triggering (useful for testing)
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Only allow manual trigger via POST /trigger
    if (request.method === 'POST' && url.pathname === '/trigger') {
      const startTime = Date.now();

      try {
        const result = await anonymizeUserAgents(env.DB);
        const totalDuration = Date.now() - startTime;

        return Response.json({
          success: true,
          data: {
            results: [result],
            totalDurationMs: totalDuration,
          },
        });
      } catch (error) {
        return Response.json(
          {
            success: false,
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          },
          { status: 500 }
        );
      }
    }

    // Health check
    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        worker: 'sc-maintenance',
        timestamp: Date.now(),
      });
    }

    return Response.json(
      {
        success: false,
        error: { message: 'Not found' },
      },
      { status: 404 }
    );
  },
};

/**
 * Anonymize user_agent in event_log for records older than 90 days
 *
 * Per spec Section 3.5:
 * - user_agent is PII-adjacent data
 * - Must be anonymized (set to NULL) after 90 days
 */
async function anonymizeUserAgents(db: D1Database): Promise<MaintenanceResult> {
  const taskStart = Date.now();
  const task = 'anonymize_user_agent';

  // Calculate cutoff timestamp (90 days ago in milliseconds)
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

  console.log('Anonymizing user_agent data', {
    task,
    cutoffTimestamp: ninetyDaysAgo,
    cutoffDate: new Date(ninetyDaysAgo).toISOString(),
  });

  // Update records where:
  // - created_at is older than 90 days
  // - user_agent is not already NULL
  const result = await db
    .prepare(
      'UPDATE event_log SET user_agent = NULL WHERE created_at < ? AND user_agent IS NOT NULL'
    )
    .bind(ninetyDaysAgo)
    .run();

  const rowsAffected = result.meta.changes || 0;
  const durationMs = Date.now() - taskStart;

  console.log('User agent anonymization complete', {
    task,
    rowsAffected,
    durationMs,
  });

  return {
    task,
    rowsAffected,
    durationMs,
  };
}
