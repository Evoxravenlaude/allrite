import bcrypt from 'bcryptjs';
import type { Query } from './db';
import { ean13, slugify } from './format';

type SeedVariant = { size?: string; colour?: string; stock: number };
type SeedProduct = {
  department: 'fashion' | 'furniture';
  category: string;
  name: string;
  shape: string;
  tone: number;
  price: number;
  description: string;
  details: string;
  care: string;
  isNew?: boolean;
  variants: SeedVariant[];
  furniture?: {
    w: number;
    d: number;
    h: number;
    materials: string;
    finishes: string;
    availability: 'ready' | 'made_to_order';
    lead?: number;
  };
};

const sizes = (list: string[], stocks: number[], colour: string) =>
  list.map((size, i) => ({ size, colour, stock: stocks[i] ?? 0 }));

export const DEMO_PRODUCTS: SeedProduct[] = [
  {
    department: 'fashion', category: 'Dresses', name: 'Adire Silk Shirt Dress', shape: 'dress', tone: 5, price: 285000, isNew: true,
    description: 'A relaxed shirt dress cut from silk crepe and hand-dyed in Abeokuta using the adire resist method. No two pieces carry exactly the same pattern.',
    details: '100% silk crepe. Hand-dyed indigo. Mother-of-pearl buttons. Falls to mid-calf on a model 1.75 m tall.',
    care: 'Dry clean only. Store away from direct sunlight to keep the indigo deep.',
    variants: sizes(['XS', 'S', 'M', 'L'], [1, 3, 2, 1], 'Indigo'),
  },
  {
    department: 'fashion', category: 'Dresses', name: 'Pleated Column Dress', shape: 'dress', tone: 0, price: 340000, isNew: true,
    description: 'A sleeveless column of fine knife pleats that moves with the body and holds its shape through a long evening.',
    details: 'Polyester georgette, permanently pleated. Concealed side zip. Fully lined bodice.',
    care: 'Hand wash cold and hang to dry. Do not iron the pleats.',
    variants: sizes(['XS', 'S', 'M', 'L'], [2, 2, 3, 0], 'Black'),
  },
  {
    department: 'fashion', category: 'Dresses', name: 'Linen Wrap Dress', shape: 'dress', tone: 2, price: 195000,
    description: 'An easy wrap dress in washed linen, made for warm afternoons. Ties at the waist and closes without buttons.',
    details: '100% European linen, garment washed for softness. Midi length.',
    care: 'Machine wash cold on a gentle cycle. Line dry.',
    variants: sizes(['S', 'M', 'L', 'XL'], [4, 5, 3, 2], 'Sand'),
  },
  {
    department: 'fashion', category: 'Shirts and tops', name: 'Oversized Poplin Shirt', shape: 'shirt', tone: 1, price: 98000,
    description: 'A crisp, generously cut shirt in heavy cotton poplin, with a dropped shoulder and a long back hem.',
    details: '100% cotton poplin. Horn-effect buttons. Unisex fit.',
    care: 'Machine wash at 30°C. Iron while slightly damp.',
    variants: sizes(['S', 'M', 'L', 'XL'], [6, 8, 5, 3], 'White'),
  },
  {
    department: 'fashion', category: 'Shirts and tops', name: 'Washed Silk Blouse', shape: 'shirt', tone: 3, price: 165000, isNew: true,
    description: 'A fluid blouse in sand-washed silk with a soft, matte finish. Wear it tucked or loose.',
    details: '100% silk. Covered buttons. Relaxed fit.',
    care: 'Hand wash cold or dry clean.',
    variants: sizes(['XS', 'S', 'M', 'L'], [2, 4, 4, 2], 'Ivory'),
  },
  {
    department: 'fashion', category: 'Trousers', name: 'Wide-Leg Linen Trousers', shape: 'trousers', tone: 2, price: 135000,
    description: 'High-waisted trousers with a full, straight leg and front pleats. Pair them with the matching wrap dress or a simple shirt.',
    details: '100% linen. Side pockets. Zip fly with hook closure.',
    care: 'Machine wash cold. Line dry.',
    variants: [...sizes(['S', 'M', 'L'], [3, 4, 2], 'Sand'), ...sizes(['S', 'M', 'L'], [2, 3, 1], 'Black')],
  },
  {
    department: 'fashion', category: 'Trousers', name: 'Tailored Wool Trousers', shape: 'trousers', tone: 4, price: 178000,
    description: 'Lightweight tropical wool trousers with a pressed crease, cut to sit just above the shoe.',
    details: 'Super 110s tropical wool. Half lined. Belt loops.',
    care: 'Dry clean only.',
    variants: sizes(['30', '32', '34', '36'], [2, 3, 3, 1], 'Charcoal'),
  },
  {
    department: 'fashion', category: 'Outerwear', name: 'Double-Faced Wool Coat', shape: 'coat', tone: 6, price: 465000, isNew: true,
    description: 'An unlined coat in double-faced wool, finished by hand at every seam so it is as clean inside as out.',
    details: '90% wool, 10% cashmere. Single breasted. Falls below the knee.',
    care: 'Dry clean only. Hang on a wide shoulder hanger.',
    variants: sizes(['XS', 'S', 'M', 'L'], [1, 2, 1, 1], 'Camel'),
  },
  {
    department: 'fashion', category: 'Outerwear', name: 'Cotton Trench Coat', shape: 'coat', tone: 1, price: 320000,
    description: 'A classic trench in water-resistant cotton gabardine with a storm flap and a removable belt.',
    details: '100% cotton gabardine. Cupro lining. Double breasted.',
    care: 'Dry clean only.',
    variants: sizes(['S', 'M', 'L'], [2, 2, 1], 'Stone'),
  },
  {
    department: 'fashion', category: 'Kaftans', name: 'Aso-Oke Trim Kaftan', shape: 'kaftan', tone: 3, price: 260000, isNew: true,
    description: 'A full-length kaftan in fine cotton voile, finished at the neck and cuffs with a band of hand-woven aso-oke.',
    details: 'Cotton voile body. Hand-woven aso-oke trim from Iseyin. Side slits.',
    care: 'Hand wash cold. Dry clean the trim when needed.',
    variants: sizes(['M', 'L', 'XL', 'XXL'], [2, 3, 2, 1], 'Ivory and indigo'),
  },
  {
    department: 'fashion', category: 'Kaftans', name: 'Silk Lounge Kaftan', shape: 'kaftan', tone: 0, price: 230000,
    description: 'A loose silk kaftan for long evenings at home or by the pool.',
    details: '100% silk satin. One size fits UK 8 to 18.',
    care: 'Hand wash cold or dry clean.',
    variants: [{ size: 'One size', colour: 'Black', stock: 5 }],
  },
  {
    department: 'fashion', category: 'Bags', name: 'Leather Day Tote', shape: 'bag', tone: 6, price: 390000, isNew: true,
    description: 'A structured tote in full-grain leather, large enough for a laptop and a change of shoes.',
    details: 'Full-grain calf leather. Suede lining. Inner zip pocket. 38 × 30 × 14 cm.',
    care: 'Wipe with a dry cloth. Store stuffed in the dust bag provided.',
    variants: [{ size: 'One size', colour: 'Black', stock: 2 }, { size: 'One size', colour: 'Tan', stock: 3 }],
  },
  {
    department: 'fashion', category: 'Bags', name: 'Top-Handle Bag', shape: 'bag', tone: 0, price: 445000,
    description: 'A compact top-handle bag with a single brass clasp and a detachable shoulder strap.',
    details: 'Box calf leather. Brass hardware. 24 × 17 × 9 cm.',
    care: 'Keep away from water. Store in the dust bag provided.',
    variants: [{ size: 'One size', colour: 'Black', stock: 2 }],
  },
  {
    department: 'fashion', category: 'Shoes', name: 'Leather Slingback', shape: 'shoe', tone: 2, price: 210000,
    description: 'A pointed slingback on a low 45 mm heel, comfortable enough for a full day.',
    details: 'Nappa leather upper and lining. Leather sole. Made in Italy.',
    care: 'Use a shoe tree. Polish with neutral cream.',
    variants: sizes(['37', '38', '39', '40', '41'], [1, 2, 2, 2, 1], 'Bone'),
  },
  {
    department: 'fashion', category: 'Shoes', name: 'Suede Loafer', shape: 'shoe', tone: 6, price: 185000,
    description: 'A soft, unlined penny loafer in suede that moulds to the foot after a few wears.',
    details: 'Calf suede. Leather sole with rubber heel.',
    care: 'Brush with a suede brush. Treat with a water repellent spray.',
    variants: sizes(['40', '41', '42', '43', '44', '45'], [1, 2, 3, 3, 2, 1], 'Chocolate'),
  },
  {
    department: 'fashion', category: 'Scarves', name: 'Hand-Dyed Silk Scarf', shape: 'scarf', tone: 5, price: 78000,
    description: 'A large square of silk twill, hand-dyed in indigo and finished with hand-rolled edges.',
    details: '100% silk twill. 90 × 90 cm.',
    care: 'Dry clean only.',
    variants: [{ size: 'One size', colour: 'Indigo', stock: 9 }],
  },
  {
    department: 'furniture', category: 'Seating', name: 'Iroko Lounge Chair', shape: 'armchair', tone: 7, price: 1250000, isNew: true,
    description: 'A low lounge chair with a solid iroko frame and a deep woven-leather seat. Made in Lagos by a workshop of four craftsmen.',
    details: 'Solid iroko frame. Hand-woven vegetable-tanned leather seat and back.',
    care: 'Dust with a soft cloth. Feed the leather with balm twice a year.',
    variants: [{ colour: 'Natural iroko', stock: 2 }, { colour: 'Smoked iroko', stock: 1 }],
    furniture: { w: 72, d: 84, h: 70, materials: 'Iroko, vegetable-tanned leather', finishes: 'Natural iroko, Smoked iroko', availability: 'ready' },
  },
  {
    department: 'furniture', category: 'Seating', name: 'Three-Seat Linen Sofa', shape: 'sofa', tone: 2, price: 3450000, isNew: true,
    description: 'A deep, low sofa with feather-wrapped cushions and removable linen covers. Each sofa is made to order in your chosen colour.',
    details: 'Kiln-dried hardwood frame. Feather and foam cushions. Removable, washable covers.',
    care: 'Plump the cushions weekly. Covers can be dry cleaned.',
    variants: [{ colour: 'Natural linen', stock: 0 }, { colour: 'Charcoal linen', stock: 0 }],
    furniture: { w: 240, d: 98, h: 72, materials: 'Hardwood frame, linen upholstery', finishes: 'Natural linen, Charcoal linen', availability: 'made_to_order', lead: 8 },
  },
  {
    department: 'furniture', category: 'Seating', name: 'Bouclé Two-Seat Sofa', shape: 'sofa', tone: 1, price: 2600000,
    description: 'A rounded two-seat sofa in thick wool bouclé, sized for an apartment living room or a study.',
    details: 'Solid beech frame. Wool bouclé upholstery. Oak feet.',
    care: 'Vacuum gently with an upholstery brush. Spot clean only.',
    variants: [{ colour: 'Ivory bouclé', stock: 1 }],
    furniture: { w: 180, d: 90, h: 74, materials: 'Beech, wool bouclé, oak', finishes: 'Ivory bouclé', availability: 'ready' },
  },
  {
    department: 'furniture', category: 'Tables', name: 'Travertine Dining Table', shape: 'dining', tone: 3, price: 2950000,
    description: 'A heavy, honed travertine top on twin pedestals. Seats eight comfortably.',
    details: 'Honed and sealed Italian travertine. Each slab has its own natural markings.',
    care: 'Wipe spills at once. Reseal the stone once a year.',
    variants: [{ colour: 'Classic travertine', stock: 0 }],
    furniture: { w: 240, d: 100, h: 75, materials: 'Travertine', finishes: 'Classic travertine', availability: 'made_to_order', lead: 10 },
  },
  {
    department: 'furniture', category: 'Tables', name: 'Walnut Dining Table', shape: 'dining', tone: 7, price: 1980000,
    description: 'A solid walnut table with softly rounded edges and tapered legs. Seats six.',
    details: 'Solid American black walnut. Oil finish.',
    care: 'Re-oil every six months. Use mats under hot dishes.',
    variants: [{ colour: 'Walnut', stock: 1 }],
    furniture: { w: 200, d: 95, h: 75, materials: 'Solid walnut', finishes: 'Walnut', availability: 'ready' },
  },
  {
    department: 'furniture', category: 'Tables', name: 'Round Marble Side Table', shape: 'side', tone: 4, price: 420000,
    description: 'A small round side table carved from a single block of marble.',
    details: 'Nero Marquina marble. Felt pads underneath.',
    care: 'Wipe with a damp cloth. Avoid acidic cleaners.',
    variants: [{ colour: 'Black marble', stock: 3 }, { colour: 'White marble', stock: 2 }],
    furniture: { w: 45, d: 45, h: 50, materials: 'Marble', finishes: 'Black marble, White marble', availability: 'ready' },
  },
  {
    department: 'furniture', category: 'Storage', name: 'Oak Sideboard', shape: 'sideboard', tone: 2, price: 1650000,
    description: 'A long, low sideboard with four push-to-open doors and adjustable shelves inside.',
    details: 'Solid white oak. Hand-rubbed oil finish. Cable outlet at the back.',
    care: 'Dust with a soft cloth. Re-oil once a year.',
    variants: [{ colour: 'Natural oak', stock: 0 }],
    furniture: { w: 200, d: 45, h: 70, materials: 'Solid white oak', finishes: 'Natural oak', availability: 'made_to_order', lead: 6 },
  },
  {
    department: 'furniture', category: 'Lighting', name: 'Ceramic Table Lamp', shape: 'lamp', tone: 3, price: 185000, isNew: true,
    description: 'A hand-thrown stoneware lamp with a pleated linen shade, made by a ceramicist in Ilorin.',
    details: 'Glazed stoneware base. Linen shade. E27 bulb holder, bulb not included.',
    care: 'Dust the shade with a soft brush.',
    variants: [{ colour: 'Speckled white', stock: 4 }, { colour: 'Earth brown', stock: 3 }],
    furniture: { w: 35, d: 35, h: 58, materials: 'Stoneware, linen', finishes: 'Speckled white, Earth brown', availability: 'ready' },
  },
  {
    department: 'furniture', category: 'Mirrors and objects', name: 'Arched Floor Mirror', shape: 'mirror', tone: 1, price: 540000,
    description: 'A tall arched mirror in a slim brass frame, to lean against a wall.',
    details: 'Brushed brass frame. 5 mm silvered glass.',
    care: 'Clean the glass with a soft cloth and glass cleaner.',
    variants: [{ colour: 'Brass', stock: 2 }],
    furniture: { w: 80, d: 3, h: 190, materials: 'Brass, glass', finishes: 'Brass', availability: 'ready' },
  },
  {
    department: 'furniture', category: 'Mirrors and objects', name: 'Carved Stool', shape: 'stool', tone: 7, price: 165000,
    description: 'A three-legged stool carved from a single piece of wood. Use it as a seat or a small side table.',
    details: 'Solid mahogany, hand carved.',
    care: 'Dust with a soft cloth.',
    variants: [{ colour: 'Mahogany', stock: 4 }],
    furniture: { w: 38, d: 38, h: 45, materials: 'Mahogany', finishes: 'Mahogany', availability: 'ready' },
  },
];

export const DEFAULT_SETTINGS = {
  storeName: 'Allrite Boutique and Lifestyle',
  address: '[Store address]',
  city: 'Lagos',
  phone: '+234 000 000 0000',
  whatsapp: '2340000000000',
  email: 'hello@allrite.example',
  hours: 'Monday to Saturday, 10:00 am to 7:00 pm',
  depositPercent: 50,
  reserveMinutes: 30,
  receiptFooter: 'Thank you for shopping with Allrite. Exchanges within 7 days with this receipt.',
};

export const DEMO_ZONES = [
  { name: 'Ikoyi, Victoria Island and Lekki Phase 1', fashion: 5000, furniture: 35000 },
  { name: 'Lekki to Ajah', fashion: 7000, furniture: 45000 },
  { name: 'Lagos Mainland', fashion: 8000, furniture: 50000 },
  { name: 'Abuja', fashion: 12000, furniture: 180000 },
  { name: 'Port Harcourt', fashion: 12000, furniture: 180000 },
  { name: 'Other states', fashion: 15000, furniture: 250000 },
];

function images(p: SeedProduct) {
  const alt = p.name;
  if (p.department === 'fashion') {
    return [
      { url: `/ph/${p.shape}/${p.tone}/front.svg`, alt, kind: 'studio' },
      { url: `/ph/${p.shape}/${(p.tone + 1) % 8}/back.svg`, alt: `${alt}, back view`, kind: 'studio' },
      { url: `/ph/${p.shape}/${p.tone}/detail.svg`, alt: `${alt}, detail`, kind: 'studio' },
      { url: `/ph/${p.shape}/${(p.tone + 2) % 8}/side.svg`, alt: `${alt}, side view`, kind: 'studio' },
    ];
  }
  return [
    { url: `/ph/${p.shape}/${p.tone}/front.svg`, alt, kind: 'studio' },
    { url: `/ph/${p.shape}/${p.tone}/room.svg`, alt: `${alt} in a furnished room`, kind: 'room' },
    { url: `/ph/${p.shape}/${p.tone}/detail.svg`, alt: `${alt}, detail`, kind: 'studio' },
  ];
}

export async function seed(query: Query, opts: { demoProducts?: boolean } = { demoProducts: true }) {
  await query(`insert into settings (key, value) values ('store', $1::text::jsonb) on conflict (key) do nothing`, [
    JSON.stringify(DEFAULT_SETTINGS),
  ]);

  const existingZones = await query(`select count(*)::int as n from delivery_zones`);
  if (existingZones[0].n === 0) {
    for (const [i, z] of DEMO_ZONES.entries()) {
      await query(`insert into delivery_zones (name, fashion_fee, furniture_fee, sort) values ($1, $2, $3, $4)`, [
        z.name, z.fashion, z.furniture, i,
      ]);
    }
  }

  const ownerEmail = (process.env.OWNER_EMAIL || 'owner@allrite.demo').toLowerCase();
  const ownerPassword = process.env.OWNER_PASSWORD || 'allrite-owner';
  const staff = [
    { name: process.env.OWNER_NAME || 'Owner', email: ownerEmail, password: ownerPassword, role: 'owner' },
    ...(opts.demoProducts
      ? [
          { name: 'Ada (manager)', email: 'manager@allrite.demo', password: 'allrite-manager', role: 'manager' },
          { name: 'Tunde (sales)', email: 'sales@allrite.demo', password: 'allrite-sales', role: 'sales' },
        ]
      : []),
  ];
  for (const s of staff) {
    await query(
      `insert into staff (name, email, password_hash, role) values ($1, $2, $3, $4) on conflict (email) do nothing`,
      [s.name, s.email, bcrypt.hashSync(s.password, 10), s.role],
    );
  }

  if (!opts.demoProducts) return;
  const existing = await query(`select count(*)::int as n from products`);
  if (existing[0].n > 0) return;

  let barcodeCounter = 1;
  let createdOffset = DEMO_PRODUCTS.length;
  for (const p of DEMO_PRODUCTS) {
    const f = p.furniture;
    const [row] = await query(
      `insert into products (slug, department, category, name, description, details, care, price, images,
        width_cm, depth_cm, height_cm, materials, finishes, availability, lead_time_weeks, allow_deposit, is_new, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9::text::jsonb,$10,$11,$12,$13,$14,$15,$16,$17,$18, now() - make_interval(hours => $19::int))
       returning id`,
      [
        slugify(p.name), p.department, p.category, p.name, p.description, p.details, p.care, p.price,
        JSON.stringify(images(p)),
        f?.w ?? null, f?.d ?? null, f?.h ?? null, f?.materials ?? '', f?.finishes ?? '',
        f?.availability ?? 'ready', f?.lead ?? null, p.department === 'furniture', !!p.isNew, createdOffset--,
      ],
    );
    for (const [i, v] of p.variants.entries()) {
      const barcode = ean13('2000000' + String(barcodeCounter++).padStart(5, '0'));
      await query(
        `insert into variants (product_id, size, colour, barcode, stock, low_stock_at, sort) values ($1,$2,$3,$4,$5,$6,$7)`,
        [row.id, v.size ?? '', v.colour ?? '', barcode, v.stock, p.department === 'furniture' ? 1 : 2, i],
      );
    }
  }
}
