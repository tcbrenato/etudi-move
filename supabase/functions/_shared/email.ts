const EMAILJS_SERVICE_ID = Deno.env.get('EMAILJS_SERVICE_ID')!;
const EMAILJS_TEMPLATE_ID = Deno.env.get('EMAILJS_TEMPLATE_ID')!;
const EMAILJS_PUBLIC_KEY = Deno.env.get('EMAILJS_PUBLIC_KEY')!;
const EMAILJS_PRIVATE_KEY = Deno.env.get('EMAILJS_PRIVATE_KEY')!;

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email: to,
        subject,
        message_html: html,
      },
    }),
  });

  if (!res.ok) {
    console.error(`EmailJS error sending to ${to}: ${res.status} ${await res.text()}`);
  }
  return res.ok;
}
