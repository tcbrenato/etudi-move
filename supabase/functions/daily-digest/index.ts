import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendEmail } from '../_shared/email.ts';

const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET')!;
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: newUsers }, { count: newTrips }, { count: newMessages }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('trips').select('*', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', since),
  ]);

  await sendEmail(
    ADMIN_EMAIL,
    'Récap quotidien Étudi\'Move',
    `<h2>Récap des dernières 24h</h2>
     <ul>
       <li>Nouvelles inscriptions : ${newUsers ?? 0}</li>
       <li>Trajets publiés : ${newTrips ?? 0}</li>
       <li>Messages échangés : ${newMessages ?? 0}</li>
     </ul>`,
  );

  const now = new Date().toISOString();
  const soon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: trips } = await supabase
    .from('trips_with_driver')
    .select('*')
    .eq('is_available', true)
    .gte('departure_time', now)
    .lte('departure_time', soon)
    .order('departure_time', { ascending: true });

  if (trips && trips.length > 0) {
    const { data: users } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('role', 'user')
      .eq('status', 'active');

    const tripsHtml = trips
      .map(
        (t) =>
          `<li>${t.origin_address} → ${t.destination_address} — ${
            new Date(t.departure_time).toLocaleString('fr-FR', { timeZone: 'Africa/Porto-Novo' })
          } (conducteur : ${t.driver_first_name})</li>`,
      )
      .join('');

    for (const user of users ?? []) {
      await sendEmail(
        user.email,
        "Trajets disponibles sur Étudi'Move",
        `<h2>Bonjour ${user.first_name},</h2>
         <p>Voici les trajets disponibles dans les prochaines 24h :</p>
         <ul>${tripsHtml}</ul>`,
      );
    }
  }

  return new Response('ok', { status: 200 });
});
