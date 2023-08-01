try {
    const { TempLogger } = require("temp_js_logger")
}
catch (err) {
    console.log('debug require(temp_js_logger) failed as expected')
}

const categories = {
    'C': "b,d,dz,g,ġ,gh,h,j,k,k',kh,l,m,n,p,p',q,q',r,s,ş,t,t',ts,ts',tş,tş',v,z".split(','),
    'V': "a,ạ,e,i,o,u".split(',')
}

/**
 * 
 * @param {InputEvent} input_event
 */
function on_words_file_input(input_event) {
    return new Promise(function(resolve, reject) {
        console.log('debug on_words_file_input')

        /**
         * @type {HTMLInputElement}
         */
        const input = input_event.target
    
        if (input.files.length == 0) {
            console.log('info no words file selected')
            reject()
        }
        else {
            let file = input.files[0]
            console.log(`info load words from ${file.name} of size ${file.size}`)

            let reader = new FileReader()
            reader.onerror = (err) => {
                console.log(`error failed to read words file as text ${err.stack}`)
                reject()
            }
            reader.onload = (event) => {
                console.log(`info words file load passed`)
                resolve(reader.result)
            }

            reader.readAsText(file)
        }
    })
    .then(analyze_words)
    .then(display_results)
}

/**
 * 
 * @param {string} words 
 * @returns {string[]}
 */
function analyze_words(words) {
    console.log(`info perform lang stats on ${words.substring(0, 100)}...`)
    
    // run stats
    let res = FindHoles('VCC', words, categories)

    return res
}

/**
 * @param {string[]} analysis 
 */
function display_results(analysis) {
    console.log(`info analysis results:\n${analysis.join(' ')}`)
}

/**
 * 
 * @param {Element} console_el 
 * @returns {Promise}
 */
function init_logging(console_el) {
    if (TempLogger !== undefined) {
        return TempLogger.config({
            level: 'debug',
            level_gui: 'info',
            with_timestamp: false,
            caller_name: 'arcaeca2-lang-stats',
            with_lineno: true,
            parse_level_prefix: true,
            with_level: true,
            with_always_level_name: true
        })
        .then(() => {
            console.log('debug move temp logger gui console to custom parent')
            const temp_logger_console = document.getElementsByClassName(TempLogger.CMP_CONSOLE_CLASS)[0]
            temp_logger_console.classList.remove('fixed-top')
            console_el.appendChild(temp_logger_console)
            console.log('info gui logger ready')
        })
    }
    else {
        return Promise.reject('error unable to configure temp_js_logger')
    }
}

/**
 * Frontend main method.
 */
function main(words_file_input_id, console_id) {
    const console_el = document.getElementById(console_id)
    init_logging(console_el)

    const words_file_input_el = document.getElementById(words_file_input_id)
    words_file_input_el.addEventListener('change', on_words_file_input)
}
