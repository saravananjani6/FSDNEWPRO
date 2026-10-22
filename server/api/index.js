const dotenv = require('dotenv');

dotenv.config();

const app = require('../src/app');

module.exports = (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.searchParams.get('path');

  // Vercel rewrites every nested /api URL to this single function. Restore
  // the original API path before Express routes the request.
  if (path) {
    url.searchParams.delete('path');
    const query = url.searchParams.toString();
    req.url = `/api/${path}${query ? `?${query}` : ''}`;
  }

  return app(req, res);
};
