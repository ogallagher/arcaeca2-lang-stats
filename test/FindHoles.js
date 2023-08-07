/**
 * FindHoles unit tests.
 */

const assert = require('assert')
const {
    describe,
    it,
    before,
    after,
    beforeEach,
    afterEach
} = require('mocha')

const lang_stats = require('../FindHoles.js')

// example from [mocha](https://mochajs.org/) docs
describe('Array', function() {
    describe('#indexOf()', function() {
        it('should return -1 when value is missing', function() {
            assert.strictEqual([1,2,3].indexOf(4), -1)
        })
    })
})

describe('lang_stats', function() {
    const categories = {
        'A': ['a1', 'a2', 'a3'],
        'B': ['b1', 'b2']
    }
    const categories_mtsqrveli = {
        'C': "b,d,dz,g,ġ,gh,h,j,k,k',kh,l,m,n,p,p',q,q',r,s,ş,t,t',ts,ts',tş,tş',v,z".split(','),
        'V': "a,ạ,e,i,o,u".split(',')
    }

    before(function() {
        console.log('begin FindHoles tests')
    })

    beforeEach(function() {
        console.log('begin test')
    })

    afterEach(function() {
        console.log('end test')
    })

    after(function() {
        console.log('end FindHoles tests')
    })

    describe('multiply', function() {
        it('returns empty list when both args are empty', function() {
            let res = lang_stats.multiply([], [])
            assert.strictEqual(res.length, 0)
        })

        it('returns sequences unchanged if phonemes are empty', function() {
            let sequences = [
                ['a1', 'b1'],
                ['a2', 'b2']
            ]
            let res = lang_stats.multiply(sequences, [])
            assert.strictEqual(sequences, res)
        })

        it('returns phonemes if input sequences are empty', function() {
            let res = lang_stats.multiply([], categories['A'])
            assert.strictEqual(res, categories['A'])
        })

        it('returns every possible proceeding phoneme for the given category for each sequence', function() {
            let sequences = [
                ['11', '12', '13'],
                ['21', '22', '23']
            ]
            let res = lang_stats.multiply(sequences, categories['B'])

            assert.strictEqual(
                res.length, 
                sequences.length * categories['B'].length, 
                'res.length is not equal to the number of input sequences * number of B phonemes'
            )
            assert.deepStrictEqual(
                res[0], 
                sequences[0].concat(categories['B'][0]), 
                `the first phoneme in the first output sequence ${res[0]} is not as expected ${sequences[0].concat(categories['B'][0])}`
            )
        })
    })

    describe('string_has_categories', function() {
        it('handles true positive', function() {
            // complete
            assert.strictEqual(
                lang_stats.stringHasCategories('ABBA', categories),
                true,
                `failed to find categories ${Object.keys(categories)} in ABBA`
            )
            // partial
            assert.strictEqual(
                lang_stats.stringHasCategories('abBa', categories),
                true,
                `failed to find categories ${Object.keys(categories)} in abBa`
            )
        })

        it('handles true negative', function() {
            assert.strictEqual(
                lang_stats.stringHasCategories('ab', categories),
                false
            )

            assert.strictEqual(
                lang_stats.stringHasCategories('', categories),
                false
            )
        })
    })

    describe('expand_categories', function() {
        it('correctly modifies a list of sequence lists', function() {
            let sequences = [
                ['a', 'b'],
                ['c', 'd']
            ]
            
            // confirming forEach used this way works as expected
            sequences.forEach((op, i) => { sequences[i] = op.join('') })
            assert.deepStrictEqual(
                sequences,
                ['ab', 'cd']
            )
        })

        it('handles trivial patterns', function() {
            assert.deepStrictEqual(
                lang_stats.expandCategories('bad', categories),
                ['bad'.split('')],
                `string bad with no categories ${Object.keys(categories)} should be itself`
            )

            assert.deepStrictEqual(
                lang_stats.expandCategories('', categories),
                [[]]
            )
        })

        it('handles non trivial patterns', function() {
            let sequences = lang_stats.expandCategories('AB', categories)
            let strings = []
            sequences.forEach((sequence) => {
                strings.push(sequence.join(','))
            })
            console.log(strings.join('\n'))

            assert.strictEqual(
                sequences.length, 
                categories['A'].length * categories['B'].length
            )

            sequences = lang_stats.expandCategories('tV', categories_mtsqrveli)
            console.log(sequences)
            
            let expected = ["ta","tạ","te","ti","to","tu"]
            expected.forEach((value, index) => {
                expected[index] = value.split('')
            })
            assert.deepStrictEqual(
                sequences,
                expected
            )
        })
    })

    describe('split_text_to_words', function() {
        it('correctly splits text into words', function() {
            assert.deepStrictEqual(
                lang_stats.split_text_to_words(' one two\tthree \t\n\nfour '),
                ['one', 'two', 'three', 'four']
            )
        })
    })

    describe('lexicon analysis', function() {
        let lexicon = 'a1 b1 a1a2b1 a1a3b3 a1b1b2b1 a2a2'

        describe('Stats', function() {
            let expected_stats = [
                {
                    a1: {
                      count: 4,
                      phonemes: [ 'a1' ]
                    },
                    a2: {
                      count: 3,
                      phonemes: [ 'a2' ]
                    },
                    a3: {
                      count: 1,
                      phonemes: [ 'a3' ]
                    }
                },
                {
                    b1: {
                      count: 4,
                      probability: 2,
                      phonemes: [ 'b1' ],
                      actualExpectedRatio: 1.6
                    },
                    b2: {
                      count: 1,
                      probability: 0.5,
                      phonemes: [ 'b2' ],
                      actualExpectedRatio: 0.4
                    }
                },
                {
                    a1a1b1: {
                      count: 0,
                      phonemes: [ 'a1', 'a1', 'b1' ]
                    },
                    a1a1b2: {
                      count: 0,
                      phonemes: [ 'a1', 'a1', 'b2' ]
                    },
                    a1a2b1: {
                      count: 1,
                      phonemes: [ 'a1', 'a2', 'b1' ]
                    },
                    a1a2b2: {
                      count: 0,
                      phonemes: [ 'a1', 'a2', 'b2' ]
                    },
                    a1a3b1: {
                      count: 0,
                      phonemes: [ 'a1', 'a3', 'b1' ]
                    },
                    a1a3b2: {
                      count: 0,
                      phonemes: [ 'a1', 'a3', 'b2' ]
                    },
                    a2a1b1: {
                      count: 0,
                      phonemes: [ 'a2', 'a1', 'b1' ]
                    },
                    a2a1b2: {
                      count: 0,
                      phonemes: [ 'a2', 'a1', 'b2' ]
                    },
                    a2a2b1: {
                      count: 0,
                      phonemes: [ 'a2', 'a2', 'b1' ]
                    },
                    a2a2b2: {
                      count: 0,
                      phonemes: [ 'a2', 'a2', 'b2' ]
                    },
                    a2a3b1: {
                      count: 0,
                      phonemes: [ 'a2', 'a3', 'b1' ]
                    },
                    a2a3b2: {
                      count: 0,
                      phonemes: [ 'a2', 'a3', 'b2' ]
                    },
                    a3a1b1: {
                      count: 0,
                      phonemes: [ 'a3', 'a1', 'b1' ]
                    },
                    a3a1b2: {
                      count: 0,
                      phonemes: [ 'a3', 'a1', 'b2' ]
                    },
                    a3a2b1: {
                      count: 0,
                      phonemes: [ 'a3', 'a2', 'b1' ]
                    },
                    a3a2b2: {
                      count: 0,
                      phonemes: [ 'a3', 'a2', 'b2' ]
                    },
                    a3a3b1: {
                      count: 0,
                      phonemes: [ 'a3', 'a3', 'b1' ]
                    },
                    a3a3b2: {
                      count: 0,
                      phonemes: [ 'a3', 'a3', 'b2' ]
                    }
                }
            ]

            let i = 0
            for (let pattern of [
                'A',
                'B',
                'AAB'
            ]) {
                let expected = expected_stats[i]
                it(`finds pattern ${i} matches for ${pattern}`, function() {
                    let stats = new lang_stats.Stats(pattern, categories)
                    stats.calculate_frequencies(lexicon)
                    console.log(stats.patt_inst_freqs)
                    for (let iStr of Object.keys(expected)) {
                        assert.deepEqual(expected[iStr].phonemes, stats.patt_inst_freqs[iStr].phonemes)
                        assert.deepEqual(expected[iStr].count, stats.patt_inst_freqs[iStr].count)
                    }
                })

                i++
            }

            it.only('never produces a probability ratio confidence interval outside 0..1', function() {
                let text = 'a1b1a1b1a1b1a1b1'
                let stats = new lang_stats.Stats('AB', categories)
                // a1b1 4 times in 1 word
                stats.calculate_frequencies(text)
                for (let pi_stats of Object.values(stats.patt_inst_freqs)) {
                    assert.ok(
                        pi_stats.probability >= 0 && pi_stats.probability <= 1,
                        `probability of pattern instance ${pi_stats.phonemes.join(',')}=${pi_stats.probability} `
                        + `outside bounds [0..1]`
                    )
                }
            })
        })

        describe('FindHoles', function() {
            it('finds a hole when pattern not found', function() {
                let pattern = 'AAA'
                console.log('AAA:')
                let aaa = new lang_stats.Stats(pattern, categories)
                aaa.calculate_frequencies(lexicon)
                console.log(aaa.patt_inst_freqs)
                console.log('AA:')
                let aa = new lang_stats.Stats(pattern.substring(0, 2), categories)
                aa.calculate_frequencies(lexicon)
                console.log(aa.patt_inst_freqs)

                let res = lang_stats.FindHoles(pattern, lexicon, categories)
                console.log(res)
                assert.ok(res.length > 0)
            })

            it('does not find a hole when pattern present', function() {
                let pattern = 'BBB'
                let bbb = new lang_stats.Stats(pattern, categories)
                bbb.calculate_frequencies(lexicon)
                console.log(bbb.patt_inst_freqs)

                let res = lang_stats.FindHoles(pattern, lexicon, categories)
                console.log(res)
                assert.strictEqual(res.length, 0)
            })
        })
    })
})
