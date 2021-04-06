/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// This middleware should execute as last one
// since it captures everything and tries to
// render the page with Vue
import configure from 'backend'
import { ssrMiddleware } from 'quasar/wrappers'

export default ssrMiddleware(async ({ app, render, serve }) => {
  const nest = await configure({
    app,
    async render ({ req, res }) {
      res.setHeader('Content-Type', 'text/html')

      try {
        const html = await render({ req, res })
        // now let's send the rendered html to the client
        res.send(html)
      } catch (err) {
        // oops, we had an error while rendering the page
        if (err.url) {
          if (err.code) {
            res.redirect(err.code, err.url)
          }
          else {
            res.redirect(err.url)
          }
        }
        // hmm, Vue Router could not find the requested route
        else if (err.code === 404) {
          // Should reach here only if no "catch-all" route
          // is defined in /src/routes
          res.status(404).send('404 | Page Not Found')
        }
        // well, we treat any other code as error;
        // if we're in dev mode, then we can use Quasar CLI
        // to display a nice error page that contains the stack
        // and other useful information
        else if (process.env.DEV) {
          // serve.error is available on dev only
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          serve.error({ err, req, res })
        }
        // we're in production, so we should have another method
        // to display something to the client when we encounter an error
        // (for security reasons, it's not ok to display the same wealth
        // of information as we do in development)
        else {
          // Render Error Page on production or
          // create a route (/src/routes) for an error page and redirect to it
          res.status(500).send('500 | Internal Server Error')
        }
        // we were told to redirect to another URL
      }
    }
  });
  await nest.init()
});
