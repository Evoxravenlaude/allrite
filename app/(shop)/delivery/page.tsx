import InfoPage from '@/components/shop/InfoPage';
import { getSettings, listZones } from '@/lib/store';
import { naira } from '@/lib/format';

export const metadata = { title: 'Delivery' };

export default async function Delivery() {
  const [zones, s] = await Promise.all([listZones(), getSettings()]);
  return (
    <InfoPage title="Delivery" lead="Prices are set by area. Fashion and furniture are priced separately because furniture needs our own van and team.">
      <table className="w-full text-[14px] border-t border-stone">
        <thead>
          <tr className="text-left text-ash">
            <th className="py-3 font-normal">Area</th>
            <th className="py-3 font-normal text-right">Fashion</th>
            <th className="py-3 font-normal text-right">Furniture</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone border-y border-stone">
          {zones.map((z) => (
            <tr key={z.id}>
              <td className="py-3 pr-4">{z.name}</td>
              <td className="py-3 text-right">{naira(z.fashion_fee)}</td>
              <td className="py-3 text-right">{naira(z.furniture_fee)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[13px] text-ash">An order with both fashion and furniture pays both charges for its area. Collection from the store is always free.</p>
      <h2>When it arrives</h2>
      <p>
        In-stock fashion is usually delivered within 1 to 3 working days in Lagos and 3 to 5 working days elsewhere. In-stock furniture is
        delivered on an agreed date, usually within 7 working days. Made-to-order pieces show their waiting time on the product page.
      </p>
      <h2>Following your order</h2>
      <p>You receive an email when we receive your order, and a page that shows each stage: Received, Being prepared, Sent out and Delivered.</p>
      <p><a href="/order">Track an order</a></p>
      <h2>Furniture deposits</h2>
      <p>
        Furniture can be reserved with a {s.depositPercent}% deposit. The balance is paid before delivery, online from your order page or in
        the store.
      </p>
    </InfoPage>
  );
}
