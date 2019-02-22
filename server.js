const fs = require('fs')
const jsonServer = require('json-server')
const killable = require('killable')
const nodeWatch = require('node-watch')
const path = require('path')

const watch = process.argv.includes('watch')
const port = 4000
let httpServer = null

const getData = () => {
  const dataPath = path.join(__dirname, 'data')
  const files = fs.readdirSync(dataPath)
  return files.reduce((acc, file) => {
    const fileContents = fs.readFileSync(path.join(dataPath, file)).toString()
    let json = {}
    try {
      json[path.basename(file).replace('.json', '')] = JSON.parse(fileContents)
    } catch (error) {
      console.log(`Invalid JSON format in ${path.join(dataPath, file)}`)
    }
    return {
      ...acc,
      ...json
    }
  }, {})
}

const isAuthorized = req => {
  return true
}

const startServer = () => {
  const server = jsonServer.create()
  const middlewares = jsonServer.defaults()
  const router = jsonServer.router(getData())
  server.use(middlewares)
  server.use((req, res, next) => {
    if (isAuthorized(req)) {
      next()
    } else {
      res.sendStatus(401)
    }
  })
  server.use(router)
  httpServer = server.listen(port, () => {
    console.log(`JSON Server is running on ${port}.`)
  })
  if (watch) {
    killable(httpServer)
  }
}

startServer()

if (watch) {
  nodeWatch('data', {}, () => {
    console.log(`JSON Server is restarting on ${port}.`)
    httpServer.kill(() => {
      startServer()
    })
  })
}
