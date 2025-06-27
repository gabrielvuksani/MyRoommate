export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      overrideBrowserslist: [
        'defaults',
        'not IE 11',
        'not dead',
        'not op_mini all'
      ],
      grid: 'autoplace',
      flexbox: 'no-2009'
    },
  },
}
