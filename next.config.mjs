/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@electric-sql/pglite', 'postgres', 'bcryptjs'],
  images: { unoptimized: true },
  // Files read at run time that Vercel would otherwise leave out of the server bundle.
  outputFileTracingIncludes: {
    '/**': [
      './db/schema.sql',
      './node_modules/@electric-sql/pglite/dist/*.wasm',
      './node_modules/@electric-sql/pglite/dist/*.data',
    ],
  },
};
export default nextConfig;
