import InfoPage from '@/components/shop/InfoPage';
import { getSettings } from '@/lib/store';

export const metadata = { title: 'Privacy notice' };

// Written to meet the Nigeria Data Protection Act 2023. The store owner should have it reviewed before launch.
export default async function Privacy() {
  const s = await getSettings();
  return (
    <InfoPage title="Privacy notice" lead="What we collect, why we collect it, and what you can ask us to do with it.">
      <p>{s.storeName} (“we”) is responsible for the personal details you give us through this website and in our store.</p>
      <h2>What we collect</h2>
      <p>
        Your name, email address, phone number and delivery address when you place an order or book a viewing. Your password, stored
        only in scrambled form, if you create an account. The pieces you save and the orders you place.
      </p>
      <h2>What we do not collect</h2>
      <p>
        We never see or store your card details. Card, bank transfer and USSD payments are handled by Paystack, which is licensed by the
        Central Bank of Nigeria.
      </p>
      <h2>Why we use your details</h2>
      <p>
        To take payment, deliver your order or prepare it for collection, send you order updates, arrange viewings, and serve you better
        when you return. We do not sell your details. We share them only with the courier delivering your order and with Paystack for
        payment.
      </p>
      <h2>How long we keep them</h2>
      <p>Order records are kept for 6 years for tax and accounting. You can ask us to delete your account at any time.</p>
      <h2>Your rights</h2>
      <p>
        Under the Nigeria Data Protection Act 2023 you can ask to see the details we hold about you, correct them, delete them, or stop us
        using them. Email <a href={`mailto:${s.email}`}>{s.email}</a> and we will respond within 30 days.
      </p>
      <h2>Cookies</h2>
      <p>We use only the cookies needed to keep you signed in and to remember your bag. We do not use advertising cookies.</p>
    </InfoPage>
  );
}
