# Thinkroid Space Documentation

Documentation site for [Thinkroid Space](https://www.thinkroid.space/) — the gamified multi-agent orchestration platform.

Built with [VitePress](https://vitepress.dev/).

## Structure

```
Thinkroid_Space-Docs/
├── docs/
│   ├── index.md            # Homepage
│   ├── user/               # User guide
│   ├── dev/                # Developer docs
│   ├── public/             # Static assets (icons, logo)
│   └── .vitepress/
│       ├── config.js       # VitePress config
│       └── theme/          # Custom theme
└── package.json
```

## Development

```bash
bun install
bun run docs:dev
```

## Build

```bash
bun run docs:build
bun run docs:preview
```

## License

[CC BY-SA 4.0](LICENSE)
