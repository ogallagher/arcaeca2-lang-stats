/**
 * Adapted from https://pastebin.com/jbA8qHKK
 */

import { readFileSync } from 'node:fs'

/**
 * Default phoneme categories, where a phoneme is a collection of characters that are considered 1 unit of sound.
 */
const tCategories = {
	'C': "b,d,dz,g,ġ,gh,h,j,k,k',kh,l,m,n,p,p',q,q',r,s,ş,t,t',ts,ts',tş,tş',v,z".split(','),
	'V': "a,ạ,e,i,o,u".split(',')
}

///////////////////////////////////////////////////////////

// the entire lexicon of Old Mtsqrveli compressed into one, space-delimited line
var sWords = readFileSync('resources/old_mtsqrveli_lexicon.txt', 'utf-8')
console.log(`first 100 chars of mtsqrveli raw lexicon = ${sWords.substring(0, 100)}`)

var tWords = sWords.split(' ')
console.log(`first 10 words = ${tWords.slice(0, 10)}`)

// returns a dictionary sorted by value in descending order
// (otherwise by default dictionaries are unordered, but will display by keys in alphabetical order)
// (from StackOverflow)
function sort_object(obj) {
    items = Object.keys(obj).map(function(key) {
        return [key, obj[key]]
    })
    items.sort(function(first, second) {
        return second[1] - first[1]
    })
    sorted_obj={}
    items.forEach(function(v) {
        use_key = v[0]
        use_value = v[1]
        sorted_obj[use_key] = use_value
    })
    return(sorted_obj)
} 

// returns the number of matches in the lexicon of each segment that matches sPattern
function Stats(sPattern) {
	let tCombos = expandCategories(sPattern)  // get all combinations that fit the pattern
	                                          // e.g. if sPattern = "tV", then this returns
											  // ["ta","tạ","te","ti","to","tu"]
	let tOut = {}
	for (let i = 0; i < tCombos.length; i++) {
		tOut[tCombos[i]] = 0
	}

	// sort the combinations by descending length*, then smoosh into a regex
	// (* since some of the consonants are digraphs, e.g. "gh", and regexes match the first thing they can,
	//    if we don't force it to try to match longer combinations first, it would never match e.g. "agh" -
	//    that would always be counted as a match for "ag".)
	let re = new RegExp(tCombos.sort(function(a,b) { return b.length - a.length }).join("|"), "g")
    let result

	while (result = re.exec(sWords)) {
		tOut[result[0]] = tOut[result[0]] + 1
	}
	return tOut
}

// the same as above, except sorted by value in descending order
function OStats(sPattern) {
	let tOStats = sort_object(Stats(sPattern))
	let str = '{\n' + Object.getOwnPropertyNames(tOStats).map(key => `  ${key}: ${tOStats[key]}`).join('\n') + '\n}'
	console.log(str)
}

// given some pattern ABC, find combinations of ABC that don't appear in the lexicon, even though AB and BC individually do
export function FindHoles(sPattern) {
	let tPattern = Stats(sPattern) // results for search on "ABC"
	let tTop = Stats(sPattern.substring(0,2)) // results for search on "AB"
	let tBottom = Stats(sPattern.substring(1)) // results for search on "BC"
	
	let tOut = []
	
	for (let sKey in tPattern) { // for each "ABC" we tallied up the results for,
		let sTop = sKey.substring(0,2) // the corresponding "AB"
		let sBottom = sKey.substring(1) // the corresponding "BC"
		
		// if "AB" occurs, and "BC" occurs, but "ABC" doesn't
		if ( (tTop[sTop] < 2) && (tBottom[sBottom] < 2) && (tPattern[sKey] > 2) ) {
			// I'm not really sure what a good metric would be for deciding if a combination "occurs" or not
			tOut.push(sKey)
		}
		
	}
	
	return tOut
}
export default FindHoles

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

// Everything after this point exists to power the function expandCategories, which is used in Stats
// which basically determines all possible permutations of an input pattern, e.g. "VCC", that contains a reference to a category like C or V
// if it looks way more complicated than it needs to be, that's because it is
// it's directly taken and repurposed from a sound engine I wrote where it's meant to deal with much much more complicated input patterns
// like (C)[P('),B2,r]aC(:) or whatever, not just VCC
// so it's quite overkill for this particular use case, but there was no use 

function join(array) {
  return Array.isArray(array) ? array.join('') : array
}

function categoryValueToString(array = []) {
  return `[${array.toString()}]`
}

/**
 * 
 * @param {string[][]} sequences List of sequences to be modified.
 * @param {string[]} phonemes Set of possible char combos/phonemes that fall into the current category.
 * @returns {string[][]} List of modified sequences, or empty list.
 */
export function multiply(sequences, phonemes) {
  if (sequences.length === 0 && phonemes.length === 0) {
    return []
  }
  else if (sequences.length === 0) {
    // return a list of 1-phoneme sequences
    return phonemes
  }
  else if (phonemes.length === 0) {
    // return the unchanged sequences
    return sequences
  }

  // non trivial case
  const product = []
  for (let s = 0; s < sequences.length; s++) {
    for (let p = 0; p < phonemes.length; p++) {
        // append phoneme p to sequence s
        product.push([...sequences[s], phonemes[p]])
    }
  }
  return product
}

function expandMultiCharacterCategory(inputString) {
  const multiCharCategories = Object.keys(tCategories).filter((key) => key.length > 1).sort((category1, category2) => category2.length - category1.length)
  let output = inputString
  for (let category of multiCharCategories) {
    const expandedCategoryString = categoryValueToString(tCategories[category])
    while (output.includes(category)) {
      output = output.replace(category, expandedCategoryString)
    }
  }
  return output
}

function hasSquareBrackets(inputString) {
  for (let i = 0, ch = inputString.charAt(0); i < inputString.length; i++, ch = inputString.charAt(i)) {
    if (ch === '[') {
      return true
    }
  }
  return false
}

function expandSquareBrackets(inputString) {
  if (!hasSquareBrackets(inputString)) {
    return inputString
  }
  let output = [[]]
  for (let i = 0, ch = inputString.charAt(0), squareBrackets = 0, j = 0; i < inputString.length; i++, ch = inputString.charAt(i)) {
    if (ch === '[') {
      squareBrackets++
      if (squareBrackets === 1) {
        output.push([])
        j++
        continue
      }
    }
    else if (ch === ']') {
      squareBrackets--
      if (squareBrackets === 0) {
        output.push([])
        j++
        continue
      }
    }

    if (ch !== ' ') {
      output[j].push(ch)
    }
  }
  output = output
    .map(join)
    .filter((string) => string !== '')
    .map(split)
    .reverse()
    .reduceRight(multiply)
    .map(join)
	return output
}

function split(inputString) {
  let output = []
  for (
    let i = 0, j = 0, ch = inputString.charAt(0), squareBrackets = 0;
    j <= inputString.length;
    j++, ch = inputString.charAt(j)
  ) {
    if (ch === '[') {
      squareBrackets++
    }
    else if (ch === ']') {
      squareBrackets--
    }


    if (squareBrackets === 0 && (ch === ',' || j === inputString.length)) {
      output.push(inputString.slice(i, j))
      i = j + 1
    }
  }
  return output
}

/**
 * Whether the given string contains any chars that are category codes.
 * 
 * @param {string} inputString A string expected to be a sequence of phoneme category codes.
 * @param {string} customCategories Optional custom phoneme category codes.
 * @returns {boolean} Whether any phoneme categories are present in the string. If the string is empty, return `false`.
 */
export function stringHasCategories(inputString, customCategories) {
    const categories = customCategories !== undefined ? customCategories : tCategories
    for (const key of Object.keys(categories)) {
        if (inputString.includes(key)) {
            return true
        }
    }
    return false
}
               
/**
 * Generate list of possible strings following the given pattern (sequence of categories).
 * 
 * @param {string} inputString Sequence of phoneme category codes.
 * @param {string} customCategories Optional custom phoneme category codes.
 * @returns {string[]} List of possible phoneme sequences matching the given pattern of categories.
 */
export function expandCategories(inputString, customCategories) {
    if (!stringHasCategories(inputString, customCategories)) {
      // nest in list for consistency
      return [inputString]
    }

    const categories = customCategories !== undefined ? customCategories : tCategories
    let output = [[]]
    
    for (let i = 0, ch = inputString.charAt(0); i < inputString.length; i++, ch = inputString.charAt(i)) {
        // input char is a category
        if (categories[ch] !== undefined) {
            output = multiply(output, categories[ch])
        }
        // input char is anything else
        else {
            // for every existing item in out, add this char
            output.forEach((op) => op.push(ch))
        }
    }

    // replace each phoneme list with joined string
    output.forEach((op, i) => { output[i] = op.join('') })
    return output
}
