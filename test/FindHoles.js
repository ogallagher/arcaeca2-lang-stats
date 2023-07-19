/**
 * FindHoles unit tests.
 */

import assert from 'assert'
import {
    describe,
    it,
    before,
    after,
    beforeEach,
    afterEach
} from 'mocha'

import {
    FindHoles,
    multiply,
    expandCategories,
    stringHasCategories,
    Stats
} from '../FindHoles.js'

// example from [mocha](https://mochajs.org/) docs
describe('Array', function() {
    describe('#indexOf()', function() {
        it('should return -1 when value is missing', function() {
            assert.equal([1,2,3].indexOf(4), -1)
        })
    })
})

describe('FindHoles', function() {
    const categories = {
        'A': ['a1', 'a2', 'a3'],
        'B': ['b1', 'b2']
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
            let res = multiply([], [])
            assert.strictEqual(res.length, 0)
        })

        it('returns sequences unchanged if phonemes are empty', function() {
            let sequences = [
                ['a1', 'b1'],
                ['a2', 'b2']
            ]
            let res = multiply(sequences, [])
            assert.strictEqual(sequences, res)
        })

        it('returns phonemes if input sequences are empty', function() {
            let res = multiply([], categories['A'])
            assert.strictEqual(res, categories['A'])
        })

        it('returns every possible proceeding phoneme for the given category for each sequence', function() {
            let sequences = [
                ['11', '12', '13'],
                ['21', '22', '23']
            ]
            let res = multiply(sequences, categories['B'])

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

    describe('stringHasCategories', function() {
        it('handles true positive', function() {
            // complete
            assert.strictEqual(
                stringHasCategories('ABBA', categories),
                true,
                `failed to find categories ${Object.keys(categories)} in ABBA`
            )
            // partial
            assert.strictEqual(
                stringHasCategories('abBa', categories),
                true,
                `failed to find categories ${Object.keys(categories)} in abBa`
            )
        })

        it('handles true negative', function() {
            assert.strictEqual(
                stringHasCategories('ab', categories),
                false
            )

            assert.strictEqual(
                stringHasCategories('', categories),
                false
            )
        })
    })

    describe('expandCategories', function() {
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
                expandCategories('bad', categories),
                ['bad'],
                `string bad with no categories ${Object.keys(categories)} should be itself`
            )

            assert.deepStrictEqual(
                expandCategories('', categories),
                ['']
            )
        })

        it('handles non trivial patterns', function() {
            let sequences = expandCategories('AB', categories)
            console.log(sequences.join('\n'))

            assert.strictEqual(
                sequences.length, 
                categories['A'].length * categories['B'].length
            )

            sequences = expandCategories('tV')
            console.log(sequences)
            
            assert.deepStrictEqual(
                sequences,
                ["ta","tạ","te","ti","to","tu"]
            )
        })
    })

    describe.only('lexicon analysis', function() {
        let lexicon = 'a1 b1 a1a2b1 a1a3b3 a1b1b2b1 a2a2'

        describe('Stats', function() {
            let expected_stats = [
                {
                    a1: 4,
                    a2: 3,
                    a3: 1
                },
                {
                    b1: 4,
                    b2: 1
                },
                {
                    a1a1b1: 0,
                    a1a1b2: 0,
                    a1a2b1: 1,
                    a1a2b2: 0,
                    a1a3b1: 0,
                    a1a3b2: 0,
                    a2a1b1: 0,
                    a2a1b2: 0,
                    a2a2b1: 0,
                    a2a2b2: 0,
                    a2a3b1: 0,
                    a2a3b2: 0,
                    a3a1b1: 0,
                    a3a1b2: 0,
                    a3a2b1: 0,
                    a3a2b2: 0,
                    a3a3b1: 0,
                    a3a3b2: 0
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
                    let stats = Stats(pattern, lexicon, categories)
                    console.log(stats)
                    assert.deepStrictEqual(
                        stats,
                        expected
                    )
                })

                i++
            }
        })

        describe('FindHoles', function() {
            it('finds a hole when pattern not found', function() {
                let pattern = 'AAA'
                console.log(Stats(pattern, lexicon, categories))

                let res = FindHoles(pattern, lexicon, categories)
                console.log(res)
                assert.ok(res.length > 0)
            })

            it('does not find a hole when pattern present', function() {
                let pattern = 'BBB'
                console.log(Stats(pattern, lexicon, categories))

                let res = FindHoles(pattern, lexicon, categories)
                console.log(res)
                assert.strictEqual(res.length, 0)
            })
        })
    })
})
