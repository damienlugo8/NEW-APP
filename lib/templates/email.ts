/**
 * Three opening emails a notary can paste into Gmail / Outlook. They're
 * deliberately short, warm, and specific. The notary fills in the bracketed
 * fields. We pre-fill {{company}} from the contact record.
 *
 * Tone rule: nothing that reads like a SaaS sales email. Notaries call title
 * companies the way a contractor calls a general contractor — peer-to-peer.
 */

export type EmailTemplate = {
  id: string;
  label: string;
  description: string;
  subject: string;
  body: string;
};

export const EMAIL_TEMPLATES: ReadonlyArray<EmailTemplate> = [
  {
    id: "intro",
    label: "First intro",
    description: "First email to a title company you haven't worked with.",
    subject: "Mobile notary in your area",
    body: `Hi {{contact_first_name}},

I'm a mobile notary based in your area and I wanted to introduce myself in case you ever need a backup or a same-day signer.

A few things about me:
• Available evenings and weekends
• Loan packages, refis, sellers, reverses — all the usual
• Background-checked and NNA-certified

If it ever helps, my number is [phone]. I'm reliable about confirming and texting when I'm on the way.

Thanks for considering me.
[your name]`,
  },
  {
    id: "followup",
    label: "Polite follow-up",
    description: "Two weeks after first contact, no reply.",
    subject: "Quick follow-up",
    body: `Hi {{contact_first_name}},

Following up on my note from a couple weeks back. No pressure — just keeping my name in front of you in case anything comes up.

Happy to grab a coffee if you ever want to put a face to the name. Either way, here whenever you need a signer.

[your name]`,
  },
  {
    id: "reengage",
    label: "Re-engage cold client",
    description: "Active client who's gone quiet for 60+ days.",
    subject: "Still around when you need me",
    body: `Hi {{contact_first_name}},

It's been a quiet stretch on my end with {{company}} and I wanted to check in. Anything change on your side?

Either way, I'm still mobile, still flexible, and still happy to help on short notice.

[your name]`,
  },
];

export function renderTemplate(
  tpl: EmailTemplate,
  vars: { company: string; contact_first_name: string }
) {
  const sub = tpl.subject
    .replace(/\{\{company\}\}/g, vars.company)
    .replace(/\{\{contact_first_name\}\}/g, vars.contact_first_name);
  const body = tpl.body
    .replace(/\{\{company\}\}/g, vars.company)
    .replace(/\{\{contact_first_name\}\}/g, vars.contact_first_name);
  return { subject: sub, body };
}

export function mailtoHref({
  to,
  subject,
  body,
}: {
  to?: string | null;
  subject: string;
  body: string;
}) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  return `mailto:${to ?? ""}?${params.toString()}`;
}
