import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'Adonis Jobs',
  description: 'BullMQ Integration with AdonisJS',
  iconUrl: { light: '/favicon.svg', dark: '/favicon.svg' },

  editLink: {
    pattern: 'https://github.com/nemoengineering/adonis-jobs/edit/main/docs/:path',
    text: 'Edit on GitHub',
  },
  ogImageUrl: {
    '/': 'https://vocs.dev/api/og?title=AdonisJS%20Jobs&description=BullMQ%20Integration%20with%20AdonisJS&logo=https://raw.githubusercontent.com/nemoengineering/adonis-jobs/main/assets/logo.png',
    '/docs': 'https://vocs.dev/api/og?logo=%logo&title=%title&description=%description',
  },
  theme: {
    colorScheme: 'dark',
    accentColor: "#EDCA2E",
  },
  socials: [
    {
      icon: 'github',
      link: 'https://github.com/nemoengineering/adonis-jobs',
    },
  ],
  sidebar: [
    {
      text: 'Getting Started',
      collapsed: false,
      items: [
        {
          text: 'Introduction',
          link: '/guides/introduction',
        },
        {
          text: 'Installation',
          link: '/guides/installation',
        },
        {
          text: 'Configuration',
          link: '/guides/configuration',
        },
      ],
    },
    {
      text: 'Guides',
      collapsed: false,
      items: [
        {
          text: 'Creating Jobs',
          link: '/guides/creating-jobs',
        },
        {
          text: 'Dispatching Jobs',
          link: '/guides/dispatching-jobs',
        },
        {
          text: 'Queue Management',
          link: '/guides/queue-management',
        },
        {
          text: 'Queue Dashboard',
          link: '/guides/queue-dashboard',
        },
        {
          text: 'Observability',
          link: '/guides/observability',
        },
      ],
    },
    {
      text: 'Reference',
      link: '/reference',
    },
  ],
  topNav: [
    {
      text: 'Guides & API',
      link: '/guides/introduction',
    },
  ],
})
