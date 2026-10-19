/** Tailwind build for trading-am-see.de.
 *  The compiled CSS is pasted into Timbaly as the site's custom CSS (inlined in <head>),
 *  so only classes that appear in the sources below end up in it. */
module.exports = {
  content: ['./pages/**/*.html', './blocks/**/*.html', './src/**/*.{html,js}'],
  // the cookie banner markup is rendered by the platform, not by our sources
  safelist: [
    'cc-banner', 'cc-banner-inner', 'cc-title', 'cc-desc', 'cc-btn', 'cc-btn-primary',
    'cc-btn-secondary', 'cc-btn-ghost', 'cc-panel', 'cc-panel-header', 'cc-panel-close',
  ],
  corePlugins: { container: false },
  theme: {
    screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    extend: {
      colors: {
        ink: '#070B12',
        night: '#0B1220',
        deep: '#0F1B2D',
        lake: '#16304A',
        mist: '#A9B6C4',
        gold: { DEFAULT: '#D4A24C', hi: '#F2C879', deep: '#9A6B1E' },
        ember: '#E0663C',
        paper: { DEFAULT: '#F4EFE6', 2: '#EAE2D3' },
        bull: '#2FBF8F',
        bear: '#E5484D',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      maxWidth: { wrap: '1240px' },
    },
  },
};
