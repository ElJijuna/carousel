/**
 * Babel for the example app.
 *
 * This is the only Babel root Metro sees — the repo's own `babel.config.js` is
 * never consulted for this app, so the library's TypeScript source is compiled
 * by `babel-preset-expo` here, exactly the way a consumer's own build would
 * compile it.
 */
module.exports = (api) => {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
