/**
 * 
 * @param {string | URL} url 
 * @param {responseType} See {@link XMLHttpRequest.responseType} for accepted values.
 * @returns {Promise<string>} Data from response according to the requested `responseType`.
 */
function http_get(url, responseType='') {
    const http = new XMLHttpRequest()
    http.responseType = responseType
    http.open('GET', url)
    http.send()

    return new Promise(function(res, rej) {
        http.onload = (e) => {
            console.log(`debug loaded from ${url}. responseType=${http.responseType}`)
            
            res(http.response)
        }
        http.onerror = (e) => {
            rej(new Error(`error failed to load ${url}. ${http.responseText} ${e}`))
        }
    })
}

/**
 * Frontend main method.
 */
function main() {
    const categories = {
        'C': "b,d,dz,g,ġ,gh,h,j,k,k',kh,l,m,n,p,p',q,q',r,s,ş,t,t',ts,ts',tş,tş',v,z".split(','),
        'V': "a,ạ,e,i,o,u".split(',')
    }
    
    const words_file_path = 'resources/old_mtsqrveli_lexicon.txt'

    // load file
    console.log(`info load words from ${words_file_path}`)
    http_get(words_file_path)
    .then(
        function(words) {
            console.log(`info perform lang stats on ${words.substring(0, 100)}`)

            // run stats
            let res = FindHoles('VCC', words, categories)

            // display stats
            console.log(res)
        },
        // file load error
        function(err) {
            console.log(`error failed to load ${words_file_path}. ${err.stack}`)
        }
    )
}
