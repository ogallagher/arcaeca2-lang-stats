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

import FindHoles from '../FindHoles.js'

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
        it('returns empty list when both args are empty')

        it('returns sequences unchanged if phonemes are empty')

        it('returns phonemes if input sequences are empty')

        it('returns every ')
    })
})
