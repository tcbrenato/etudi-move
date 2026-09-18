import { sendEmail } from '../_shared/email.ts';

const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')!;

Deno.serve(async (req) => {
  if (req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const p = await req.json();
  if (!p.driver_email) {
    return new Response('Missing payload', { status: 400 });
  }

  const when = new Date(p.departure_time).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Porto-Novo',
  });

  const methodLabels: Record<string, string> = {
    mtn_momo: 'MTN MoMo',
    moov_money: 'Moov Money',
    celtiis_cash: 'Celtiis Cash',
    cash: 'Espèces',
  };
  const fare = `${Number(p.fare).toLocaleString('fr-FR')} F`;
  const paymentLine = p.payment_status === 'paid'
    ? `${fare} — payé par ${methodLabels[p.payment_method] ?? p.payment_method} (réf. ${p.payment_reference})`
    : `${fare} — à régler en espèces au moment du trajet`;

  await sendEmail(
    p.driver_email,
    'Nouvelle demande de réservation',
    `<h2>Nouvelle demande de réservation</h2>
     <p><strong>${p.passenger_first_name} ${p.passenger_last_name}</strong> (${p.passenger_phone}) souhaite réserver votre trajet :</p>
     <p>${p.origin_address} → ${p.destination_address}<br>Départ : ${when}</p>
     <p><strong>Tarif :</strong> ${paymentLine}</p>
     <p>Connecte-toi à Étudi'Move pour accepter ou refuser cette demande.</p>`,
  );

  return new Response('ok', { status: 200 });
});
