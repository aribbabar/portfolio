import { getSiteUrl } from '../lib/seo';

export const prerender = true;

export function GET({ site }: { site: URL }) {
	const siteUrl = getSiteUrl(site);
	const sitemapUrl = new URL('/sitemap.xml', `${siteUrl}/`).toString();

	return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
}
