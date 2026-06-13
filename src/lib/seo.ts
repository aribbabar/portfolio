export const SITE_TITLE = 'Arib Farooqui | Software Engineer';

export const SITE_NAME = 'Arib Farooqui Portfolio';

export const SITE_AUTHOR = 'Arib Farooqui';

export const SITE_DESCRIPTION =
	'Arib Farooqui is a software engineer building interactive web experiences, developer tools, SaaS workflows, and privacy-first utilities with TypeScript, React, Astro, ASP.NET, and Cloudflare.';

export const SITE_KEYWORDS = [
	'Arib Farooqui',
	'software engineer',
	'full stack developer',
	'TypeScript developer',
	'React developer',
	'Astro developer',
	'ASP.NET developer',
	'Cloudflare developer',
	'developer tools',
	'portfolio',
];

export const SITE_SOCIALS = [
	'https://github.com/aribbabar',
	'https://www.linkedin.com/in/aribfarooqui/',
];

export const DEFAULT_SOCIAL_IMAGE = '/og-image.png';

const FALLBACK_SITE_URL = 'https://aribfarooqui.dev';

export function getSiteUrl(site?: URL | string | null) {
	const configuredSite = site?.toString() || import.meta.env.PUBLIC_SITE_URL || FALLBACK_SITE_URL;

	return configuredSite.replace(/\/+$/, '');
}

export function getCanonicalUrl(pathname = '/', site?: URL | string | null) {
	return new URL(pathname, `${getSiteUrl(site)}/`).toString();
}
