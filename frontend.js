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

function analyze_words(words) {
    console.log(`info perform lang stats on ${words.substring(0, 100)}`)
    
    // run stats
    let res = FindHoles('VCC', words, categories)

    return res
}

function display_results(analysis) {
    console.log(analysis)
}

/**
 * Frontend main method.
 */
function main(words_file_input_id) {
    const words_file_input_el = document.getElementById(words_file_input_id)
    words_file_input_el.addEventListener('change', on_words_file_input)
}
