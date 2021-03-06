
var qs = require('qs')

var _consumer = require('../consumer')


module.exports = function (config) {
  var app = {}

  function register (server, options) {
    var consumer = _consumer({
      config: Object.keys(options).length ? options : config
    })
    app.config = consumer.config

    server.route({
      method: ['GET', 'POST'],
      path: '/connect/{provider}/{override?}',
      handler: async (req, res) => {
        if (!(req.session || req.yar)) {
          throw new Error('Grant: register session plugin first')
        }

        var {error, url, session, state} = await consumer({
          method: req.method,
          params: req.params,
          query: qs.parse(req.query),
          body: qs.parse(req.payload), // #2985
          state: req.plugins.grant,
          session: (req.session || req.yar).get('grant'),
        })

        ;(req.session || req.yar).set('grant', session)
        req.plugins.grant = state
        return error ? res.response(error) : url ? res.redirect(url) : res.continue
      }
    })

    server.route({
      method: 'GET',
      path: '/connect/{provider}/callback',
      handler: async (req, res) => {
        var params = {
          provider: req.params.provider,
          override: 'callback'
        }

        var {error, url, session, state} = await consumer({
          method: req.method,
          params,
          query: qs.parse(req.query),
          body: qs.parse(req.payload), // #2985
          state: req.plugins.grant,
          session: (req.session || req.yar).get('grant'),
        })

        ;(req.session || req.yar).set('grant', session)
        req.plugins.grant = state
        return error ? res.response(error) : url ? res.redirect(url) : res.continue
      }
    })
  }

  app.pkg = require('../../package.json')

  app.register = register
  return app
}
