const express = require('express');
const app = express();
const { Cluster } = require('puppeteer-cluster');

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE, // share everything
    maxConcurrency: 2,
    puppeteerOptions: {
      defaultViewport: {
        width: 1280,
        height: 768,
      },
      args: ['--allow-file-access-from-files'],
    },
  });
  await cluster.task(async ({ page, data: query }) => {
    // make a screenshot
    // const base = `file:///${require.resolve('../public/remote.html').replace('\\', '/')}`;
    const base = 'http://localhost:8080/remote.html';
    const url = `${base}?${query}`;
    console.log(url);
    await page.goto(url);
    const elem = await page.waitForSelector('[data-screenshot=ready]', {
      timeout: 10000,
    });
    const bb = await elem.boundingBox();
    const screen = await page.screenshot({
      type: 'png',
      clip: bb,
    });
    return screen;
  });

  // setup server
  app.get('/', async function (req, res) {
    try {
      const screen = await cluster.execute(req.url.slice(req.url.indexOf('?') + 1));

      // respond with image
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': screen.length,
      });
      res.end(screen);
    } catch (err) {
      // catch error
      res.end('Error: ' + err.message);
    }
  });

  app.listen(3000, function () {
    console.log('Screenshot server listening on port 3000.');
  });
})();
