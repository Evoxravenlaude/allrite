import InfoPage from '@/components/shop/InfoPage';

export const metadata = { title: 'Returns and exchanges' };

// The store owner should confirm or change these rules before launch.
export default function Returns() {
  return (
    <InfoPage title="Returns and exchanges" lead="If something is not right, tell us within 7 days of receiving it.">
      <h2>Fashion</h2>
      <p>
        Unworn pieces with their tags attached can be exchanged or returned within 7 days of delivery or collection. Bring them to the
        store, or message us on WhatsApp to arrange a collection.
      </p>
      <h2>Furniture</h2>
      <p>
        Check your furniture when it is delivered and tell our team before they leave if anything is damaged. In-stock furniture can be
        returned within 7 days if it is unused and in its original condition. A collection charge equal to the delivery charge applies.
      </p>
      <p>Made-to-order pieces are built for you and cannot be returned unless they arrive faulty.</p>
      <h2>Refunds</h2>
      <p>Refunds go back to the card or account you paid with, within 10 working days of us receiving the item.</p>
      <h2>Faulty items</h2>
      <p>If a piece is faulty, we repair, replace or refund it at no cost to you, including any delivery charges.</p>
    </InfoPage>
  );
}
