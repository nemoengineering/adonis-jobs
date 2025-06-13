// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightNextjsTheme from 'starlight-nextjs-theme'

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
      plugins: [starlightNextjsTheme()],
			title: '@nemoventures/adonis-jobs',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/nemoengineering/adonis-jobs' }],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'guides/introduction' },
						{ label: 'Installation', slug: 'guides/installation' },
						{ label: 'Configuration', slug: 'guides/configuration' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Creating Jobs', slug: 'guides/creating-jobs' },
						{ label: 'Dispatching Jobs', slug: 'guides/dispatching-jobs' },
						{ label: 'Queue Management', slug: 'guides/queue-management' },
						{ label: 'Queue Dashboard', slug: 'guides/queue-dashboard' },
						{ label: 'Observability', slug: 'guides/observability' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
});
