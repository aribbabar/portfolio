import { getCanonicalUrl } from '../lib/seo';

export const prerender = true;

export function GET({ site }: { site: URL }) {
	const lastmod = new Date().toISOString();
	const homeUrl = getCanonicalUrl('/', site);
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${homeUrl}</loc>
		<lastmod>${lastmod}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>1.0</priority>
	</url>
</urlset>
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
		},
	});
}
