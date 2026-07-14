import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Memoir",
  description: "Give AI game NPCs persistent, long-term memory across sessions",
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&family=Outfit:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap', rel: 'stylesheet' }]
  ],
  themeConfig: {
    logo: {
      light: '/logo-black.svg',
      dark: '/logo-white.svg'
    },
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/memoir' },
      { text: 'Examples', link: '/examples/basic-npc' }
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'How It Works', link: '/guide/how-it-works' },
          { text: 'Error Handling', link: '/guide/error-handling' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Memoir Class', link: '/api/memoir' },
          { text: 'NpcHandle Class', link: '/api/npc-handle' },
          { text: 'Errors', link: '/api/errors' }
        ]
      },
      {
        text: 'Examples',
        items: [
          { text: 'Basic NPC (Aldric)', link: '/examples/basic-npc' },
          { text: 'Multi-NPC Contexts', link: '/examples/multi-npc' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/supermemoryai/supermemory' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Memoir Contributors'
    }
  }
})
