import { sendEmail } from '../_shared/email.ts';

const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')!;
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')!;

Deno.serve(async (req) => {
  if (req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await req.json();
  const profile = payload.record;
  if (!profile) {
    return new Response('Missing record', { status: 400 });
  }

  const roleLabel = profile.role === 'driver' ? 'Conducteur' : 'Étudiant';

  await sendEmail(
    ADMIN_EMAIL,
    `Nouvelle inscription : ${profile.first_name} ${profile.last_name}`,
    `<h2>Nouvelle inscription sur Étudi'Move</h2>
     <p><strong>Nom :</strong> ${profile.first_name} ${profile.last_name}</p>
     <p><strong>Email :</strong> ${profile.email}</p>
     <p><strong>Téléphone :</strong> ${profile.phone}</p>
     <p><strong>Rôle :</strong> ${roleLabel}</p>`,
  );

  await sendEmail(
    profile.email,
    "Bienvenue sur Étudi'Move !",
    `<h2>Bienvenue ${profile.first_name} !</h2>
     <p>Ton compte Étudi'Move a bien été créé en tant que ${roleLabel.toLowerCase()}.</p>
     <p>Tu peux dès maintenant te connecter et ${
       profile.role === 'driver' ? 'publier tes trajets' : 'rechercher un trajet'
     }.</p>`,
  );

  return new Response('ok', { status: 200 });
});
