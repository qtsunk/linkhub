/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,svelte}'],
  darkMode: 'class',
  theme: {
    extend: {
      /* 自定义柔和阴影效果 */
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 4px 12px -4px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 4px 16px -4px rgba(0, 0, 0, 0.1), 0 8px 24px -8px rgba(0, 0, 0, 0.08)',
      },
      /* 自定义过渡时长 */
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
}

