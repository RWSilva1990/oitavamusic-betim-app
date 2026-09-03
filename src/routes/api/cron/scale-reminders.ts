import { createFileRoute } from '@tanstack/react-router';
import { runScaleReminderSweep } from '@/lib/notification-center.server';

export const Route = createFileRoute('/api/cron/scale-reminders')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.CRON_SECRET?.trim() || '';
        const authorization = request.headers.get('authorization') || '';
        if (!secret || authorization !== `Bearer ${secret}`) {
          return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        try {
          return Response.json(await runScaleReminderSweep());
        } catch (error) {
          console.error('[scale-reminders-cron]', error);
          return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Falha ao processar lembretes.',
          }, { status: 500 });
        }
      },
    },
  },
});
