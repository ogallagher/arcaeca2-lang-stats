/**
 * Adapted from https://pastebin.com/jbA8qHKK
 */

///////////////////////////////////////////////////////////

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

/**
 * Find matches of a given pattern within a text (set of words).
 * 
 * @param {string} sPattern String sequence of category codes.
 * @param {string?} words Optional custom lexicon (word set).
 * @param {Object?} categories Optional custom set of categories.
 * 
 * @returns {Object} 
 */
class Stats {
  constructor(sPattern, words, categories) {
    // declare instance vars
    
    /**
     * The number of matches in the text for each instance of sPattern.
     * @type {Object.<string, {count: number, phonemes: string[][]}>}
     */
    this.tOut = {}
    
    // calculate stats
    
    // get all phoneme sequences that fit the pattern (pattern instances)
    let tCombos = expandCategories(sPattern, categories)

    let tComboStrings = []
    tCombos.forEach((phonemes) => {
      tComboStrings.push(phonemes.join(''))
    })
    
    for (let i = 0; i < tCombos.length; i++) {
      this.tOut[tComboStrings[i]] = {
        // value.count is number of occurrences
        count: 0,
        // value.phonemes is phoneme sequence
        phonemes: tCombos[i]
      }
    }

    // sort the combinations by descending length*, then smoosh into a regex
    // (* since some of the consonants are digraphs, e.g. "gh", and regexes match the first thing they can,
    //    if we don't force it to try to match longer combinations first, it would never match e.g. "agh" -
    //    that would always be counted as a match for "ag".)
    let re = new RegExp(
      tComboStrings.sort(function(a,b) { 
        return b.length - a.length 
      }).join('|'), 
      'g'
    )
    let result
  
    // collect occurrences for each pattern instance
    while (result = re.exec(words)) {
      this.tOut[result[0]].count += 1
    }
  }
}

/**
 * Same as {@link Stats}, but with result keys reverse sorted.
 * @param {string} sPattern 
 * @param {string?} words
 * @param {Object?} categories
 */
function OStats(sPattern, words, categories) {
  let tOStats = sort_object(Stats(sPattern, words, categories))
  let str = '{\n' + Object.getOwnPropertyNames(tOStats).map(key => `  ${key}: ${tOStats[key]}`).join('\n') + '\n}'
  console.log(str)
}

/**
 * Given some pattern ABC, find combinations of ABC that don't appear in the lexicon, even though AB and BC 
 * individually do.
 * 
 * @param {string} sPattern 
 * @param {string} words 
 * @param {Object} categories 
 * 
 * @returns {string[]} List of strings of the given pattern that have unusually low occurrence given the 
 * occurrences of its substrings.
 */
function FindHoles(sPattern, words, categories) {
  let tPattern = Stats(sPattern, words, categories) // results for search on "ABC"
  let tTop = Stats(sPattern.substring(0,2), words, categories) // results for search on "AB"
  let tBottom = Stats(sPattern.substring(1), words, categories) // results for search on "BC"
  
  let tOut = []
  
  for (let sKey of Object.keys(tPattern.tOut)) { // for each ABC we tallied up the results for
    let full = tPattern.tOut[sKey].phonemes
    let start = full.slice(0,2) // the corresponding AB
    let end = full.slice(1) // the corresponding BC
    let startStr = start.join('')
    let endStr = end.join('')
    // TODO include counts in output
    console.log(
      `debug whole start end:`
      + `\t${sKey}\t${startStr}\t${endStr}\t|`
      + `\t${tPattern[sKey].count}\t${tTop.tOut[startStr].count}\t${tBottom.tOut[endStr].count}`
    )
    
    // if "AB" occurs, and "BC" occurs, but "ABC" doesn't
    if ( (tTop.tOut[startStr].count >= 1) && (tBottom.tOut[endStr].count >= 1) && (tPattern.tOut[sKey].count < 1) ) {
      // I'm not really sure what a good metric would be for deciding if a combination "occurs" or not
      tOut.push(sKey)
    }
  }
  
  return tOut
}

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
function multiply(sequences, phonemes) {
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

function expandMultiCharacterCategory(inputString, categories) {
  const multiCharCategories = Object.keys(categories).filter((key) => key.length > 1).sort((category1, category2) => category2.length - category1.length)
  let output = inputString
  for (let category of multiCharCategories) {
    const expandedCategoryString = categoryValueToString(categories[category])
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
 * @param {string} categories Custom phoneme category codes.
 * @returns {boolean} Whether any phoneme categories are present in the string. If the string is empty, return `false`.
 */
function stringHasCategories(inputString, categories) {
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
 * // TODO handle new return type everywhere
 * 
 * @param {string} inputString Sequence of phoneme category codes.
 * @param {string} categories Custom phoneme category codes.
 * @returns {string[][]} List of possible phoneme sequences matching the given pattern of categories.
 */
function expandCategories(inputString, categories) {
    if (!stringHasCategories(inputString, categories)) {
      // nest in list for consistency
      return [inputString.split('')]
    }

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

    return output
}

// backend exports
if (typeof exports != 'undefined') {
  exports.Stats = Stats
  exports.FindHoles = FindHoles
  exports.multiply = multiply
  exports.stringHasCategories = stringHasCategories
  exports.expandCategories = expandCategories
}
