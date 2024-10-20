import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Adonis Jobs",
  description: "Job queues for your AdonisJS applications",
  base: "/adonis-jobs/",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    // nav: [
    //   {text: 'Home', link: '/'},
    //   {text: 'Examples', link: '/markdown-examples'}
    // ],

    sidebar: [
      {text: 'Why Adonis Jobs', link: '/pages/why'},
      {text: 'Getting Started', link: '/pages/getting-started'},
      {text: 'Configuration', link: '/pages/configuration'},
      {text: 'Writing Jobs', link: '/pages/writing-jobs'},
    ],

    socialLinks: [
      {icon: 'github', link: 'https://github.com/nemoengineering/adonis-jobs'}
    ],
  }
})
