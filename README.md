# Allrite Boutique and Lifestyle

One website that is both the Allrite online shop and the selling system inside the store.

| Part | Address | Who uses it |
| --- | --- | --- |
| Online shop | `/` | Customers, on any phone or computer |
| Showroom screen | `/store/showroom` | Staff and customers on a tablet in the store |
| Counter sales screen | `/store/counter` | Staff at the till, with a barcode scanner and receipt printer |
| Owner's dashboard | `/admin` | Owner and managers |

All four read from one stock list. A sale anywhere lowers the count everywhere within a few seconds, so an item sold at the counter cannot be bought online a minute later.

## Run it on your computer (demo mode)

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no settings filled in, the site runs in demo mode:

- 26 sample products (16 fashion, 10 furniture) with drawn placeholder images
- payments are simulated on a stand-in screen, no money moves
- emails are written to the terminal instead of being sent
- data is kept in the `.data` folder; `npm run demo:reset` wipes it and starts again

Staff sign in at http://localhost:3000/staff/login

| Role | Email | Password |
| --- | --- | --- |
| Owner | owner@allrite.demo | allrite-owner |
| Manager | manager@allrite.demo | allrite-manager |
| Sales | sales@allrite.demo | allrite-sales |

To try the counter, scan or type a barcode such as `2000000000015` (Adire Silk Shirt Dress, XS). Every barcode is listed on the Stock page of the dashboard.

## What each role can do

| | Sales | Manager | Owner |
| --- | --- | --- | --- |
| Showroom and counter screens | yes | yes | yes |
| See orders, update their status | yes | yes | yes |
| Give discounts at the counter | | yes | yes |
| Add products, change prices and stock | | yes | yes |
| Cancel orders, see sales reports | | yes | yes |
| Manage staff, store details, delivery prices | | | yes |

## Deploying on Vercel

The site is set up for Vercel: `vercel.json` runs it in London (`lhr1`), the nearest Vercel region to Nigeria with a matching Supabase region.

**Plan:** Vercel's free Hobby plan is for non-commercial use only. A shop that takes payments, or a site built for a paying client, needs the Pro plan ($20 per month).

### Step 1: put the code on GitHub

```bash
cd allrite
git init
git add .
git commit -m "Allrite website"
```

Create an empty private repository on GitHub, then follow GitHub's instructions to push to it.

### Step 2: a preview the client can click through (about 10 minutes)

1. In Vercel, choose **Add New > Project** and import the GitHub repository. Vercel detects Next.js; leave the build settings as they are.
2. Before deploying, open **Environment Variables** and add:

   | Name | Value |
   | --- | --- |
   | `DEMO_MODE` | `1` |
   | `SESSION_SECRET` | a long random text: run `openssl rand -hex 32` |
   | `OWNER_EMAIL` | the email you will sign in with |
   | `OWNER_PASSWORD` | a strong password |

3. Choose **Deploy**. The preview loads the 26 sample products, simulates payments, and shows a black "Preview site" bar at the top. It is hidden from Google.

The preview keeps its data on Vercel's temporary disk. Orders, stock changes and uploaded photos disappear whenever Vercel restarts the server, and two visitors can sometimes see different copies. Use it to show the design and the flows, not to run the store.

### Step 3: the live shop

1. **Supabase.** Create a project in the London (eu-west-2) region. Under Storage, create a bucket named `products` and make it public. Copy the Transaction pooler connection string (port 6543) and, under Project settings > API, the project URL and service role key.
2. **Database.** On your computer, copy `.env.example` to `.env.local`, fill in `DATABASE_URL`, `OWNER_NAME`, `OWNER_EMAIL` and `OWNER_PASSWORD`, then run `npm install` and `npm run db:setup`. This creates the tables, the owner account and the sample delivery areas. Add `-- --demo` only for a test copy; the live shop starts with no products.
3. **Vercel variables.** In the Vercel project, open **Settings > Environment Variables**. Delete `DEMO_MODE`. Add `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SITE_URL` (the final address, for example `https://www.allrite.ng`). Keep `SESSION_SECRET`.
4. **Paystack.** In the Paystack dashboard, open Settings > API Keys and Webhooks. Add the **test** secret key to Vercel as `PAYSTACK_SECRET_KEY`. Set the webhook URL to `https://YOUR-DOMAIN/api/paystack/webhook`. Redeploy, place an order with a Paystack test card, and check it appears as paid in the dashboard. Then replace the key with the **live** secret key and redeploy. The preview bar disappears and Google may index the shop once the live key is in.
5. **Emails.** Create a Resend account, verify the store's domain, and add `RESEND_API_KEY` and `EMAIL_FROM` to Vercel.
6. **Domain.** In Vercel, open **Settings > Domains**, add the store's domain and follow the instructions for the domain registrar.
7. **Store details.** Sign in as the owner and open Store and delivery. Enter the real address, phone, WhatsApp number, opening hours and delivery prices.
8. **Products.** Add products in the dashboard, or ask us to load them from the spreadsheet. Print barcode labels from each product page.
9. **Google.** Create the free Google Business Profile for the store and submit `https://YOUR-DOMAIN/sitemap.xml` in Google Search Console.

After every change to environment variables, redeploy from the **Deployments** tab for it to take effect. The status panel at the top of Store and delivery shows whether payments, the database and emails are connected.

## Store equipment

- **Barcode scanner:** any USB or Bluetooth scanner that reads EAN-13 and works in keyboard mode (most do out of the box). Click into the scan box on the counter screen and scan.
- **Receipt printer:** any 80 mm thermal receipt printer that the counter computer can print to. Set it as the default printer. Receipts open in a new tab and print automatically.
- **Labels:** each product page in the dashboard has "Print barcode labels", sized 50 × 32 mm for sticker sheets or a label printer.
- **Internet:** both store screens need a connection. Keep a mobile data router as a backup.

## Before launch: replace the placeholders

| What | Where |
| --- | --- |
| Store address, phone, WhatsApp, email, hours | Dashboard > Store and delivery |
| Delivery areas and prices | Dashboard > Store and delivery |
| Product photographs (currently drawn shapes) | Dashboard > Products |
| Home page photograph | Replace `public/placeholders/hero.svg`, or change the image in `app/(shop)/page.tsx` |
| Returns rules | `app/(shop)/returns/page.tsx` (owner to confirm) |
| Privacy notice | `app/(shop)/privacy/page.tsx` (have it reviewed) |
| About text | `app/(shop)/about/page.tsx` |

## How payments and stock work

- When a customer goes to pay, their pieces are held for 30 minutes (changeable in the dashboard). If they do not pay in time, the pieces go back on sale. If a payment arrives after that, the site takes the stock again; if it has sold in the meantime, the order is flagged in red for a refund.
- Paystack confirms every payment twice: when the customer returns to the site, and through the webhook in case they close the browser. Confirming twice never charges or records twice.
- Furniture can be reserved with a deposit (50% by default). The customer pays the balance from their order page, or staff record it in the store.
- Made-to-order furniture never runs out of stock; its waiting time is shown instead.
- Every stock change is recorded with the staff member and order behind it.

## Project layout

```
app/(shop)      online shop pages
app/store       showroom, counter and receipt screens
app/admin       owner's dashboard
app/api         checkout, Paystack, stock and store screen endpoints
components      page parts for each area
lib/store.ts    every database query: products, stock, orders, reports
lib/db.ts       database connection (Supabase, or the built-in demo database)
db/schema.sql   database tables
scripts         database setup
```

Built with Next.js 15, React 19, Tailwind CSS and PostgreSQL. The demo database is PGlite, a full PostgreSQL that runs inside Node, so the demo runs the same SQL as the live site.
