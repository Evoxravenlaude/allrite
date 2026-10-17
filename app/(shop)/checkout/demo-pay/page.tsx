import { notFound } from 'next/navigation';
import { getOrder, getPayment } from '@/lib/store';
import { paystackLive } from '@/lib/paystack';
import { naira } from '@/lib/format';
import DemoPayButton from '@/components/shop/DemoPayButton';

export const metadata = { title: 'Demo payment', robots: { index: false } };

export default async function DemoPay({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  if (paystackLive()) notFound();
  const { reference } = await searchParams;
  const payment = reference ? await getPayment(reference) : null;
  if (!payment) notFound();
  const order = await getOrder(payment.order_id);
  if (!order) notFound();
  return (
    <div className="page-x mx-auto max-w-[560px] py-16">
      <p className="text-[13px] text-ash">Demo mode</p>
      <h1 className="display text-[36px] mt-2 leading-tight">This screen stands in for Paystack.</h1>
      <p className="mt-4 text-[15px] text-ash">
        Once the store&apos;s Paystack key is added, customers see Paystack&apos;s secure payment page here instead, with card, bank transfer and USSD.
        No money moves in demo mode.
      </p>
      <div className="mt-8 bg-white p-6 text-[15px]">
        <div className="flex justify-between"><span>Order</span><span>{order.number}</span></div>
        <div className="flex justify-between mt-2"><span>Amount</span><span>{naira(payment.amount)}</span></div>
        <div className="flex justify-between mt-2 text-ash"><span>Customer</span><span>{order.email}</span></div>
      </div>
      <DemoPayButton reference={payment.reference} />
    </div>
  );
}
