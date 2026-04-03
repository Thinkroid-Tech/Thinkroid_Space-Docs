export default {
  title: 'Thinkroid Space',
  description: 'Documentation for the gamified multi-agent orchestration platform',
  base: '/Thinkroid_Space-Docs/',
  ignoreDeadLinks: [/localhost/],
  head: [
    ['link', { rel: 'icon', href: '/logo.png' }]
  ],
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Thinkroid', link: 'https://www.thinkroid.com/' },
      { text: 'Thinkroid Space', link: 'https://www.thinkroid.space/' },
      { text: 'User Guide', link: '/user/getting-started' },
      { text: 'Developer', link: '/dev/architecture' },
    ],
    sidebar: {
      '/user/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Quick Start', link: '/user/getting-started' },
            { text: 'How It Works', link: '/user/how-it-works' },
          ]
        },
        {
          text: 'Managing Your Office',
          items: [
            { text: 'Agents', link: '/user/agents' },
            { text: 'Tasks & Projects', link: '/user/tasks' },
            { text: 'Communication', link: '/user/communication' },
            { text: 'Office & Rooms', link: '/user/office' },
          ]
        },
        {
          text: 'Advanced Features',
          items: [
            { text: 'Governance & Approvals', link: '/user/governance' },
            { text: 'Memory & Knowledge', link: '/user/memory' },
            { text: 'Skills & MCP', link: '/user/skills' },
            { text: 'Containers & Code', link: '/user/containers' },
            { text: 'External Channels', link: '/user/channels' },
            { text: 'Athena Assistant', link: '/user/athena' },
            { text: 'Settings', link: '/user/settings' },
          ]
        }
      ],
      '/dev/': [
        {
          text: 'Architecture',
          items: [
            { text: 'System Overview', link: '/dev/architecture' },
            { text: 'Frontend', link: '/dev/frontend' },
          ]
        },
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/dev/api-overview' },
            { text: 'Agents & Tasks', link: '/dev/api-agents' },
            { text: 'Settings & Config', link: '/dev/api-settings' },
            { text: 'Communication', link: '/dev/api-communication' },
            { text: 'Resources & Admin', link: '/dev/api-resources' },
          ]
        },
        {
          text: 'Internals',
          items: [
            { text: 'Agent Tools', link: '/dev/tools' },
            { text: 'Database Schema', link: '/dev/database' },
            { text: 'Hooks & Extensions', link: '/dev/hooks' },
          ]
        }
      ]
    },
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/anthropics/thinkroid-space' }
    ],
    footer: {
      message: 'Thinkroid Space Documentation',
      copyright: 'All rights reserved.'
    },
    outline: { level: [2, 3] }
  }
}
