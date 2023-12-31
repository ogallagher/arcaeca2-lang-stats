/**
 * Entrypoint script for backend-only.
 */

const fs = require('node:fs')
const lang_stats = require('./FindHoles.js')
let templogger
new Promise(function(res) {
    try {
        templogger = require('temp_js_logger')
        templogger.imports_promise
        .then(
            () => {
                templogger.set_level(templogger.TempLogger.LEVEL_INFO)
                console.log(`info loaded temp_js_logger`)
            },
            (err) => {
                console.log(`error loaded temp_js_logger with errors. ${err}\n${err.stack}`)
            }
        )
        .finally(() => {
            res()
        })
    }
    catch (err) {
        console.log(`error unable to import temp logger library; using raw console.\n${err.stack}`)
        res()
    }
})
.then(() => {
    const categories = {
    	'C': "b,d,dz,g,ġ,gh,h,j,k,k',kh,l,m,n,p,p',q,q',r,s,ş,t,t',ts,ts',tş,tş',v,z".split(','),
    	'V': "a,ạ,e,i,o,u".split(',')
    }

    const words_file_path = 'resources/old_mtsqrveli_lexicon.txt'
    console.log(`info load words file ${words_file_path}`)
    const words = fs.readFileSync(words_file_path, 'utf-8')

    console.log('info run FindHoles')

    let res = lang_stats.FindHoles('VCC', words, categories)

    // save results to file
    const res_dir = 'results'
    if (!fs.statSync(res_dir)) {
        fs.mkdirSync(res_dir)
    }

    const holes_file_path = `${res_dir}/old_mtsqrveli_lexicon.json`
    fs.writeFileSync(
        holes_file_path, 
        JSON.stringify(res, undefined, 2), 
        {
            encoding: 'utf-8'
        }
    )
    console.log(`wrote FindHoles results to ${holes_file_path}`)
})
