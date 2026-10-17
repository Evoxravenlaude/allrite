'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useShop } from './state';

export default function WhatsAppButton({ number }: { number: string }) {
  const { whatsappTopic } = useShop();
  const pathname = usePathname();
  if (pathname.startsWith('/checkout')) return null;
  const text = whatsappTopic
    ? `Hello Allrite, I have a question about the ${whatsappTopic}. ${typeof window !== 'undefined' ? window.location.href : ''}`
    : 'Hello Allrite, I have a question.';
  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent(text.trim())}`}
      target="_blank"
      rel="noreferrer"
      className="no-print fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 h-11 pl-3 pr-4 bg-white border border-stone flex items-center gap-2 text-[13px] hover:border-ink transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#000"
          d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-1.3-.6-2.3-1.4-3-2.6-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.9 2.3 1 2.5c.1.2 1.7 2.6 4.1 3.6 1.5.7 2.1.7 2.9.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.4Z"
        />
      </svg>
      WhatsApp us
    </a>
  );
}

export function WhatsAppTopic({ topic }: { topic: string }) {
  const { setWhatsappTopic } = useShop();
  useEffect(() => {
    setWhatsappTopic(topic);
    return () => setWhatsappTopic(null);
  }, [topic, setWhatsappTopic]);
  return null;
}
