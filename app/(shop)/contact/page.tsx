import InfoPage from '@/components/shop/InfoPage';
import { getSettings } from '@/lib/store';

export const metadata = { title: 'Contact' };

export default async function Contact() {
  const s = await getSettings();
  return (
    <InfoPage title="Contact" lead="The fastest way to reach us is WhatsApp. We reply during opening hours.">
      <h2>WhatsApp</h2>
      <p><a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer">Start a chat with our team</a></p>
      <h2>Phone</h2>
      <p><a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a></p>
      <h2>Email</h2>
      <p><a href={`mailto:${s.email}`}>{s.email}</a></p>
      <h2>The store</h2>
      <p>{s.address}, {s.city}<br />{s.hours}</p>
      <h2>About an order</h2>
      <p>Have your order number ready. It starts with AR and is in your confirmation email. <a href="/order">Track an order</a>.</p>
    </InfoPage>
  );
}
