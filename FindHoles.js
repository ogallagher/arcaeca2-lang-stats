/**
 * Adapted from https://pastebin.com/jbA8qHKK
 */

const WORD_DELIM = new RegExp('\\s+')

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
 */
class Stats {
  /**
   * Constructor.
   * 
   * @param {string} sPattern String sequence of category codes.
   * @param {Object?} categories Set of categories.
   */
  constructor(sPattern, categories) {
    /**
     * Sequence of phoneme category codes.
     */
    this.pattern = sPattern
    /**
     * The number of matches in the text for each instance of the pattern.
     * // TODO replace with `Map`
     * 
     * @type {Object.<string, {
     *  count: number, 
     *  probability: number,
     *  phonemes: string[][], 
     *  actual_expected_ratio: number
     * }>}
     */
    this.patt_inst_freqs = {}
    /**
     * Mean frequency across all instances of the pattern.
     * @type {number}
     */
    this.freq_mean = -1
    /**
     * Mean probability.
     * @type {number}
     */
    this.prob_mean = -1
    /**
     * Standard deviation of frequency across all instances of the pattern.
     * @type {number}
     */
    this.freq_dev = -1
    /**
     * Probability standard deviation.
     * @type {number}
     */
    this.prob_dev = -1
    
    // calculate stats
    
    // get all phoneme sequences that fit the pattern (pattern instances)
    let sequences = expand_categories(this.pattern, categories)

    let strings = []
    sequences.forEach((phonemes) => {
      strings.push(phonemes.join(''))
    })

    // sort the combinations by descending length*, then smoosh into a regex
    // (* since some of the consonants are digraphs, e.g. "gh", and regexes match the first thing they can,
    //    if we don't force it to try to match longer combinations first, it would never match e.g. "agh" -
    //    that would always be counted as a match for "ag".)
    /**
     * Regular expression to find all occurrences of each pattern instance in any text string.
     * @type {RegExp}
     */
    this.re = new RegExp(
      strings.sort(function(a,b) { 
        return b.length - a.length 
      }).join('|'), 
      'g'
    )
    
    for (let i = 0; i < sequences.length; i++) {
      this.patt_inst_freqs[strings[i]] = {
        // value.count is number of occurrences
        count: 0,
        probability: 0,
        // value.phonemes is phoneme sequence
        phonemes: sequences[i],
        // actual probability / expected probability
        actual_expected_ratio: -1
      }
    }
  }

  /**
   * Calculate occurrences/frequency of each instance of the given pattern in the `words` text.
   * 
   * @param {string?} words Optional custom lexicon (word set).
   */
  calculate_frequencies(words) {
    let regex_matches
    // collect occurrences for each pattern instance
    while (regex_matches = this.re.exec(words)) {
      this.patt_inst_freqs[regex_matches[0]].count += 1
    }

    let word_count = split_text_to_words(words).length

    // mean
    let instances = Object.values(this.patt_inst_freqs)
    let n = instances.length
    let sum = 0
    for (let iStats of instances) {
      sum += iStats.count
    }
    this.freq_mean = sum / n
    this.prob_mean = this.freq_mean / word_count

    // since a pattern can occur more than once in a word, raw probability mean above can be >1; force constraint
    if (this.prob_mean > 1) this.prob_mean = 1

    console.log(
      `debug frequency mean for pattern ${this.pattern} = ${this.freq_mean} `
      + `(probability=${this.prob_mean})`
    )

    // standard deviation
    let dev_sum_sq_freq = 0, dev_sum_sq_prob = 0
    for (let inst_stats of instances) {
      inst_stats.probability = inst_stats.count / word_count
      // constrain raw probability to [0..1]
      if (inst_stats.probability > 1) inst_stats.probability = 1

      dev_sum_sq_freq += ((inst_stats.count - this.freq_mean) ** 2)
      dev_sum_sq_prob += ((inst_stats.probability - this.prob_mean) ** 2)
    }

    this.freq_dev = Math.sqrt(dev_sum_sq_freq) / n
    this.prob_dev = Math.sqrt(dev_sum_sq_prob) / n
    console.log(
      `debug frequency standard deviation for pattern ${this.pattern} = ${this.freq_mean} `
      + `(prob-std-dev=${this.freq_dev})`
    )

    // actual / expected ratios
    for (let inst_stats of instances) {
      inst_stats.actual_expected_ratio = (inst_stats.probability) / this.prob_mean
    }
  }
}

/**
 * Given some pattern ABC, find combinations of ABC that don't appear in the lexicon, even though AB and BC 
 * individually do.
 * 
 * @param {string} pattern 
 * @param {string} words Text of words to analyze.
 * @param {Object} categories Custom phoneme category definitions.
 * 
 * @returns {string[]} List of strings of the given pattern that have unusually low occurrence given the 
 * occurrences of its substrings.
 */
function FindHoles(pattern, words, categories) {
  let abc = new Stats(pattern, categories) // results for search on "ABC"
  let ab = new Stats(pattern.substring(0,2), categories) // results for search on "AB"
  let bc = new Stats(pattern.substring(1), categories) // results for search on "BC"

  for (let patternStat of [abc, ab, bc]) {
    console.log(`debug calculate frequencies for pattern ${patternStat.pattern}`)
    patternStat.calculate_frequencies(words)
  }
  
  let tOut = []
  
  for (let sKey of Object.keys(abc.patt_inst_freqs)) { // for each ABC we tallied up the results for
    let full = abc.patt_inst_freqs[sKey].phonemes
    let start = full.slice(0,2) // the corresponding AB
    let end = full.slice(1) // the corresponding BC
    let startStr = start.join('')
    let endStr = end.join('')
    // TODO include counts in output
    console.log(
      `debug whole start end:`
      + `\t${sKey}\t${startStr}\t${endStr}\t|`
      + `\t${abc.patt_inst_freqs[sKey].count}\t${ab.patt_inst_freqs[startStr].count}\t${bc.patt_inst_freqs[endStr].count}`
    )
    
    // if "AB" occurs, and "BC" occurs, but "ABC" doesn't
    // TODO redefine definition of hole as actual/expected probability ratio low outlier
    if ( (ab.patt_inst_freqs[startStr].count >= 1) && (bc.patt_inst_freqs[endStr].count >= 1) && (abc.patt_inst_freqs[sKey].count < 1) ) {
      // I'm not really sure what a good metric would be for deciding if a combination "occurs" or not
      tOut.push(sKey)
    }
  }
  
  return tOut
}

/**
 * Split text into words. 
 * Assumes words are only delimited by spaces; punctuation not yet handled.
 * 
 * @param {string} text 
 * @returns {string[][]}
 */
function split_text_to_words(text) {
  let words = text.trim().split(WORD_DELIM)
  return words
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
 * @param {string} in_string A string expected to be a sequence of phoneme category codes.
 * @param {string} categories Custom phoneme category codes.
 * @returns {boolean} Whether any phoneme categories are present in the string. If the string is empty, return `false`.
 */
function string_has_categories(in_string, categories) {
    for (const key of Object.keys(categories)) {
        if (in_string.includes(key)) {
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
 * @param {string} in_string Sequence of phoneme category codes.
 * @param {string} categories Custom phoneme category codes.
 * @returns {string[][]} List of possible phoneme sequences matching the given pattern of categories.
 */
function expand_categories(in_string, categories) {
    if (!string_has_categories(in_string, categories)) {
      // nest in list for consistency
      return [in_string.split('')]
    }

    let output = [[]]

    for (let i = 0, ch = in_string.charAt(0); i < in_string.length; i++, ch = in_string.charAt(i)) {
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
  exports.split_text_to_words = split_text_to_words
  exports.Stats = Stats
  exports.FindHoles = FindHoles
  exports.multiply = multiply
  exports.stringHasCategories = string_has_categories
  exports.expandCategories = expand_categories
}
