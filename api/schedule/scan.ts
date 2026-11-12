/**
 * Private scheduled scan handler.
 *
 * `schedule/v1beta` makes this function unaddressable: no public URL exists, so
 * nobody can trigger expensive work. Vercel Schedules invokes it at minutes
 * 7/22/37/52; each invocation is a bounded slice of SCOUT → VERIFIER → CURATOR.
 */
import { handleSchedule } from '@vercel/schedules';
import { runTick } from '../_lib/tick';

export const maxDuration = 300;

export const POST = handleSchedule(async (metadata) => {
  const summary = await runTick();
  // Structured log line: visible in the Vercel function logs / schedule history.
  console.info(
    JSON.stringify({
      event: 'scan-tick',
      schedule: metadata.name,
      executionId: metadata.executionId,
      ...summary,
    }),
  );
});
