/**
 * ==============================================================================
 * Script Guard — Accidental Production Database Mutation Blocker
 * ==============================================================================
 *
 * Prevents seed scripts, destructive test suites, and scratch scripts from
 * executing against a live production database unless explicitly confirmed.
 */

export function assertSafeScriptExecution(scriptName: string): void {
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.CONTEXT === "production" ||
    process.env.VERCEL_ENV === "production";

  const hasConfirmedFlag = process.argv.includes("--confirm-production");
  const hasConfirmedEnv = process.env.ALLOW_PRODUCTION_SCRIPTS === "true";

  if (isProduction && !hasConfirmedFlag && !hasConfirmedEnv) {
    console.error("\n========================================================");
    console.error(`🛑 BLOCKED DANGEROUS SCRIPT EXECUTION: ${scriptName}`);
    console.error("========================================================");
    console.error(
      `Current environment is detected as '${process.env.NODE_ENV}'.`
    );
    console.error(
      "Safety rule: Seed and destructive scripts are blocked from modifying"
    );
    console.error(
      "a production database without explicit confirmation."
    );
    console.error(
      "If you INTENTIONALLY wish to run this script in production, execute:"
    );
    console.error(`   npx tsx ${scriptName} --confirm-production`);
    console.error("========================================================\n");
    throw new Error(
      `Execution of ${scriptName} blocked in production without --confirm-production flag.`
    );
  }
}
