import config from 'super-configs/commitlint';

export default {
  ...config,
  rules: {
    ...config.rules,
    'header-max-length': [2, 'always', 120],
    'body-max-line-length': [0],
  },
};
