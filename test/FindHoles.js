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
    stringHasCategories
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

    describe('#multiply', function() {
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

    describe('#stringHasCategories', function() {
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

    describe('#expandCategories', function() {
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
            assert.strictEqual(
                sequences.length, 
                categories['A'].length * categories['B'].length
            )
        })
    })
})
