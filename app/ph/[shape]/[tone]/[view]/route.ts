// Placeholder product images, drawn as SVG until the store's own photographs are uploaded.

const TONES: [string, string][] = [
  ['#E9E8E4', '#1F1F1F'],
  ['#DCD9D2', '#F5F4F0'],
  ['#ECEAE5', '#CDBFA8'],
  ['#E2DFD8', '#F3EFE7'],
  ['#EEEDEA', '#56575B'],
  ['#E6E7EA', '#27325A'],
  ['#E8E5DF', '#A9825A'],
  ['#E4E1DA', '#6E4B33'],
];

const HANGER = `<path d="M200 50c0-9 7-14 13-12s8 10 2 15l-15 12" fill="none" stroke="#8d8a83" stroke-width="3"/><path d="M128 96 200 64l72 32" fill="none" stroke="#8d8a83" stroke-width="3"/>`;

const SHAPES: Record<string, { body: (fg: string) => string; hanger?: boolean }> = {
  dress: { hanger: true, body: (c) => `<path d="M170 92h60l12 58-16 20 62 270H112l62-270-16-20z" fill="${c}"/>` },
  shirt: {
    hanger: true,
    body: (c) => `<path d="M152 94h96l60 44-18 58-24-12v232H134V184l-24 12-18-58z" fill="${c}"/><path d="M200 96v320" stroke="rgba(0,0,0,.08)" stroke-width="2"/>`,
  },
  trousers: { hanger: true, body: (c) => `<path d="M142 92h116l14 350h-58l-14-246-14 246h-58z" fill="${c}"/>` },
  coat: {
    hanger: true,
    body: (c) => `<path d="M150 92h100l50 38 18 302h-42l-6-206-4 230H134l-4-230-6 206H82l18-302z" fill="${c}"/><path d="M200 100v350" stroke="rgba(0,0,0,.1)" stroke-width="2"/>`,
  },
  kaftan: { hanger: true, body: (c) => `<path d="M152 92h96l100 76-20 40-66-28 16 270H122l16-270-66 28-20-40z" fill="${c}"/>` },
  bag: {
    body: (c) => `<path d="M150 220c0-70 22-96 50-96s50 26 50 96" fill="none" stroke="${c}" stroke-width="12"/><path d="M106 218h188l16 210H90z" fill="${c}"/>`,
  },
  shoe: {
    body: (c) => `<path d="M60 336c0-34 36-46 66-44l86 4c40 2 76 20 108 38l18 10c12 8 8 20-4 20H76c-10 0-16-10-16-28z" fill="${c}"/><path d="M280 364h40v30h-30z" fill="${c}"/>`,
  },
  scarf: {
    body: (c) => `<path d="M110 130h180v240H110z" fill="${c}"/><path d="M110 130 290 370" stroke="rgba(255,255,255,.25)" stroke-width="2"/><path d="M290 130 110 370" stroke="rgba(0,0,0,.08)" stroke-width="2"/>`,
  },
  armchair: {
    body: (c) => `<path d="M96 250c0-50 20-90 60-90h88c40 0 60 40 60 90v60H96z" fill="${c}"/><path d="M80 300h240v54H80z" fill="${c}"/><path d="M98 354h14l-6 66h-12zM288 354h14l4 66h-12z" fill="${c}"/>`,
  },
  sofa: {
    body: (c) => `<path d="M58 270c0-26 14-40 40-40h204c26 0 40 14 40 40v40H58z" fill="${c}"/><path d="M40 296h320v66H40z" fill="${c}"/><path d="M40 296h40v66H40zM320 296h40v66h-40z" fill="rgba(0,0,0,.08)"/><path d="M62 362h10v46H62zM328 362h10v46h-10z" fill="${c}"/>`,
  },
  dining: {
    body: (c) => `<path d="M40 252h320v18H40z" fill="${c}"/><path d="M70 270h14l8 150H78zM316 270h14l-8 150h-14z" fill="${c}"/>`,
  },
  side: {
    body: (c) => `<ellipse cx="200" cy="300" rx="96" ry="16" fill="${c}"/><path d="M180 304h40l10 116h-60z" fill="${c}"/>`,
  },
  sideboard: {
    body: (c) => `<path d="M50 250h300v140H50z" fill="${c}"/><path d="M125 256v128M200 256v128M275 256v128" stroke="rgba(0,0,0,.12)" stroke-width="2"/><path d="M62 390h10v30H62zM328 390h10v30h-10z" fill="${c}"/>`,
  },
  lamp: {
    body: (c) => `<path d="M138 150h124l30 104H108z" fill="${c}" opacity=".85"/><path d="M196 254h8v80h-8z" fill="${c}"/><path d="M160 334c0-14 18-24 40-24s40 10 40 24v86h-80z" fill="${c}"/>`,
  },
  mirror: {
    body: (c) => `<path d="M140 420V160c0-40 28-70 60-70s60 30 60 70v260z" fill="none" stroke="${c}" stroke-width="10"/><path d="M146 418V162c0-36 24-64 54-64s54 28 54 64v256z" fill="rgba(255,255,255,.35)"/>`,
  },
  stool: {
    body: (c) => `<ellipse cx="200" cy="300" rx="70" ry="14" fill="${c}"/><path d="M150 304h14l-20 116h-14zM236 304h14l20 116h-14zM194 306h12v114h-12z" fill="${c}"/>`,
  },
};

export async function GET(_req: Request, { params }: { params: Promise<{ shape: string; tone: string; view: string }> }) {
  const { shape, tone, view } = await params;
  const s = SHAPES[shape] ?? SHAPES.dress;
  const [bg, fg] = TONES[Number(tone) % TONES.length] ?? TONES[0];
  const kind = view.replace(/\.svg$/, '');
  let inner = (s.hanger ? HANGER : '') + s.body(fg);
  let background = `<rect width="400" height="500" fill="${bg}"/>`;

  if (kind === 'back') inner = `<g opacity=".88">${inner}</g>`;
  if (kind === 'side') inner = `<g transform="translate(40 0) scale(.8 1)">${inner}</g>`;
  if (kind === 'detail') inner = `<g transform="translate(-260 -330) scale(2.3)">${inner}</g>`;
  if (kind === 'room') {
    background = `<rect width="400" height="500" fill="#D9D4CA"/><rect x="236" y="40" width="120" height="190" fill="#EDEAE3"/><rect y="400" width="400" height="100" fill="#BDB3A3"/>`;
    inner = `<g transform="translate(40 100) scale(.8)">${inner}</g>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="800" height="1000">${background}${inner}</svg>`;
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400, immutable' },
  });
}
