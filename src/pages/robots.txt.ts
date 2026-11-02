export async function GET(context) {
  const base = import.meta.env.BASE_URL;
  const sitemap = new URL(`${base}sitemap-index.xml`, context.site).href;
  return new Response(
    [
      'User-agent: *',
      'Allow: /',
      '',
      `sitemap: ${sitemap}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}
