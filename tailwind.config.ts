import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: { navy: '#0A4D8C', green: '#2E8B57' } } },
  plugins: []
}

export default config
