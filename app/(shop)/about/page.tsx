import InfoPage from '@/components/shop/InfoPage';

export const metadata = { title: 'About Allrite' };

export default function About() {
  return (
    <InfoPage title="About Allrite" lead="One store for the clothes you wear and the rooms you live in.">
      <p>
        Allrite Boutique and Lifestyle brings fashion and furniture together under one roof. We choose every piece for how well it is made,
        how it feels to use, and how long it will last.
      </p>
      <p>
        Many of our pieces are made close to home. Our indigo silks are hand-dyed in Abeokuta, our iroko lounge chairs are built in Lagos,
        and our stoneware lamps are thrown in Ilorin. We place them beside work from Italy and further afield.
      </p>
      <h2>Shop the way you prefer</h2>
      <p>
        Browse and buy here, at any hour. Visit the store to see and try pieces in person. Or message our team on WhatsApp for advice on
        sizing, materials or delivery. The same stock is shown everywhere, so what you see online is what we have.
      </p>
      <p><a href="/visit">Plan a visit to the store</a></p>
    </InfoPage>
  );
}
