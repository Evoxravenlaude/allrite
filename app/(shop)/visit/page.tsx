import InfoPage from '@/components/shop/InfoPage';
import { getSettings } from '@/lib/store';

export const metadata = { title: 'Visit the store' };

export default async function Visit() {
  const s = await getSettings();
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.storeName}, ${s.address}, ${s.city}`)}`;
  return (
    <InfoPage title="Visit the store" lead={`${s.address}, ${s.city}`}>
      <h2>Opening hours</h2>
      <p>{s.hours}</p>
      <h2>Finding us</h2>
      <p><a href={map} target="_blank" rel="noreferrer">Open the store in Google Maps</a></p>
      <h2>Private appointments</h2>
      <p>
        To see a furniture piece in person, open its page and choose “Book a viewing in the store”. Pick a date and time and we will
        confirm it with you by phone or WhatsApp within one working day.
      </p>
      <p>For a fashion fitting, message us on WhatsApp with the pieces you would like to try and we will have them ready.</p>
      <h2>Collecting an online order</h2>
      <p>Choose “Collect from the store” at checkout. We will message you when your order is ready. Bring your order number.</p>
      <h2>Contact</h2>
      <p>
        <a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a><br />
        <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a><br />
        <a href={`mailto:${s.email}`}>{s.email}</a>
      </p>
    </InfoPage>
  );
}
