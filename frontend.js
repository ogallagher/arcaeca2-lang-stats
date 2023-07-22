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
 * 
 * @param {string} lexicon 
 */
function main(lexicon) {
    console.log(`info frontend.main on ${lexicon.substring(0, 100)}`)
}
