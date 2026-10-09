import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  title: 'vroooom',
  description: 'Zero-knowledge vehicle tracking application',
  lang: 'en-US',

  // Base URL for GitHub Pages (https://kuroidoruido.github.io/vroooom/)
  base: '/vroooom/',

  // Source directory (current folder)
  srcDir: '.',

  // Clean URLs (no .html extension)
  cleanUrls: true,

  // Theme configuration
  themeConfig: {
    // Logo (optional, can be added later in .vitepress/public/)
    // logo: '/logo.svg',

    // Navigation bar
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/MAIN' },
      { text: 'GitHub', link: 'https://github.com/kuroidoruido/vroooom' }
    ],

    // Sidebar
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Overview', link: '/MAIN' },
          { text: 'Architecture', link: '/ARCHI' },
          { text: 'Roadmap', link: '/ROADMAP' },
        ]
      },
      {
        text: 'Technical',
        items: [
          { text: 'Security (Zero-Knowledge)', link: '/SECURITY' },
          { text: 'Data Models & Storage', link: '/DATA' },
          { text: 'Architecture', link: '/ARCHI' },
          { text: 'Tech Stack', link: '/STACK' },
          { text: 'API Reference', link: '/API' },
          { text: 'Business Rules', link: '/BUSINESS' },
        ]
      },
      {
        text: 'Guides',
        items: [
          { text: 'Development Setup', link: '/DEVELOPMENT' },
          { text: 'Deployment', link: '/DEPLOYMENT' },
          { text: 'Testing Strategy', link: '/TESTING' },
        ]
      },
      {
        text: 'Resources',
        items: [
          { text: 'FAQ', link: '/FAQ' },
          { text: 'Lexicon', link: '/LEXICON' },
        ]
      }
    ],

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kuroidoruido/vroooom' }
    ],

    // Footer
    footer: {
      message: 'Released under the GPL v3 License.',
      copyright: 'Copyright © 2026 vroooom contributors'
    },

    // Edit link (if source is on GitHub)
    editLink: {
      pattern: 'https://github.com/kuroidoruido/vroooom/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    // Last updated
    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    }
  },

  // Markdown configuration
  markdown: {
    // Line numbers in code blocks
    lineNumbers: true,

    // Theme for code blocks
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  },

  // Vite configuration (optional)
  vite: {
    server: {
      port: 5173,
      open: true
    }
  }
}))
