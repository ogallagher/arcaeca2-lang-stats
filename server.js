/**
 * Webserver.
 */

const express = require('express')

function imports() {
    return Promise.all([
        import('express')
    ])
}

function main() {
    const port = 80
    const PUBLIC_DIR = '.'

    const server = express()
    server.set('port', port)
    server.use(express.static(PUBLIC_DIR))

    server.get('/', function(req, res) {
        console.log('info serve home page')
        res.sendFile(`${PUBLIC_DIR}/main.html`, {
            root: PUBLIC_DIR
        })
    })

    server.listen(server.get('port'), function() {
        console.log('info started webserver. view page at http://localhost')
    })
}

imports()
.then(
    // import pass
    function(modules) {
        // store imports (pending)

        return main()
    },

    // import error
    function (err) {
        console.log(`error import failure. ${err.stack.join('\n')}`)
    }
)
