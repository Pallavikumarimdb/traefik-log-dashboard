export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { backgroundScheduler } = await import('./lib/services/background-scheduler');
    const { initDatabase, syncEnvAgents } = await import('./lib/db/database');

    // Initialize DB and sync env agents
    initDatabase();
    syncEnvAgents();

    // PERFORMANCE FIX: Allow disabling background scheduler via env var
    const schedulerEnabled = process.env.ENABLE_BACKGROUND_SCHEDULER !== 'false';

    if (schedulerEnabled) {
      console.log('[Instrumentation] Starting background scheduler (30min interval)...');
      backgroundScheduler.start();
    } else {
      console.log('[Instrumentation] Background scheduler DISABLED via ENABLE_BACKGROUND_SCHEDULER=false');
    }
  }
}
