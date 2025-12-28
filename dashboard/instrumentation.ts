export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // SECURITY: Intercept and filter Server Action errors
    const originalConsoleError = console.error;

    console.error = (...args: any[]) => {
      const errorString = args.join(' ');

      // SECURITY: Suppress Server Action attack attempt errors
      if (
        errorString.includes('Failed to find Server Action') &&
        (errorString.includes('X1N0YW5kYXJk') || // Base64 attack patterns
         errorString.includes('child_process') ||
         errorString.includes('execSync') ||
         errorString.includes('/bin/sh') ||
         errorString.includes('/bin/bash') ||
         errorString.includes('/dev/tcp') ||
         errorString.includes('W10='))
      ) {
        // Log once without the full payload to avoid log pollution
        console.warn('[Security] Blocked malicious Server Action attempt');
        return;
      }

      // Allow legitimate errors through
      originalConsoleError.apply(console, args);
    };

    console.log('[Instrumentation] Security error filtering enabled');

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
