import { expect, use } from 'chai';
import * as chap from 'chai-as-promised';

use(chap);

import './';

class FooError extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, FooError.prototype);
    }
}

class BarError extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, BarError.prototype);
    }
}

const ok = Symbol('promise result passed');

describe('Promise.catch', () => {
    it('does not interfere with normal catches', () => {
        const err = new FooError();
        return expect(
            Promise.reject(err).catch(e => {
                expect(e).to.equal(err);
                return ok;
            })
        ).to.eventually.equal(ok);
    });

    it('catches by class constructor', () => {
        const err = new FooError();
        return expect(
            Promise.reject(err).catch(FooError, e => {
                expect(e).to.equal(err);
                return ok;
            })
        ).to.eventually.equal(ok);
    });

    it('does not catch if the constructor is mismatched', () => {
        const err = new FooError();
        return expect(Promise.reject(err).catch(BarError, () => ok))
            .to.eventually.be.rejectedWith(err);
    });

    it('catches if the constructor is a parent class', () => {
        const err = new FooError();
        return expect(Promise.reject(err).catch(Error, () => ok))
            .to.eventually.equal(ok);
    });

    it('catches by a predicate if passes', () => {
        const err = new FooError();
        return expect(Promise.reject(err).catch(() => true, () => ok))
            .to.eventually.equal(ok);
    });

    it('rejects by a predicate if fails', () => {
        const err = new FooError();
        return expect(Promise.reject(err).catch(() => false, () => ok))
            .to.eventually.be.rejectedWith(err);
    });
});

describe('Promise.finally', () => {
    it('runs when promise is resolved', () => {
        let finallyCalled = false;
        return expect(
            Promise.resolve(ok).finally(() => finallyCalled = true)
        )
            .to.eventually.equal(ok)
            .then(() => expect(finallyCalled).to.be.true);
    });

    it('runs when promise is rejected', () => {
        let finallyCalled = false;
        const err = new FooError();
        return expect(
            Promise.reject(err).finally(() => finallyCalled = true)
        )
            .to.eventually.rejectedWith(err)
            .then(() => expect(finallyCalled).to.be.true);
    });
});

describe('Promise.tap', () => {
    it('intercepts and does modify result', () => {
        let tappedResult: number;
        return expect(
            Promise.resolve(2).tap(r => {
                expect(r).to.equal(2);
                tappedResult = r;
                return r * 2;
            })
        ).to.eventually.equal(2);
    });

    it('is skipped during a rejection', () => {
        const err = new FooError();
        return expect(
            Promise.reject(err).tap(() => {
                throw new Error('should not have been called');
            })
        ).to.eventually.be.rejectedWith(err);
    });
});

describe('Promise.map', () => {
    it('maps over items where values are returned', () => {
        return expect(
            Promise.resolve([1, 2, 3]).map((item: number) => item * 2)
        ).to.eventually.deep.equal([2, 4, 6]);
    });

    it('maps over items where promises are returned', () => {
        return expect(
            Promise.resolve([1, 2, 3]).map((item: number) => Promise.resolve(item * 2))
        ).to.eventually.deep.equal([2, 4, 6]);
    });

    it('(static) maps over items where values are returned', () => {
        return expect(
            Promise.map([1, 2, 3], item => item * 2)
        ).to.eventually.deep.equal([2, 4, 6]);
    });

    it('(static) maps over items where promises are returned', () => {
        return expect(
            Promise.map([1, 2, 3], item => Promise.resolve(item * 2))
        ).to.eventually.deep.equal([2, 4, 6]);
    });

    it('throws if a non-array is provided', () => {
        return expect(
            Promise.resolve('wut').map((item: number) => item * 2)
        ).to.eventually.rejectedWith(/Expected array in Promise\.map/);
    });
});

describe('Promise.return/throw', () => {
    it('returns', () => {
        return expect(Promise.resolve(1).return(2)).to.eventually.equal(2);
    });

    it('allows void returns', () => {
        return expect(Promise.resolve(1).return()).to.eventually.be.undefined;
    });

    it('throws', () => {
        const err = new FooError();
        return expect(Promise.resolve(1).throw(err)).to.eventually.rejectedWith(err);
    });
});

describe('Promise.timeout', () => {
    it('returns', () => {
        return expect(Promise.resolve(2).timeout(1)).to.eventually.equal(2);
    });

    it('times out', () => {
        return expect(new Promise(() => {}).timeout(1))
            .to.eventually.rejectedWith(Promise.TimeoutError);
    });

    it('times out with a custom cause', () => {
        const cause = new Error();
        return expect(new Promise(() => {}).timeout(1, cause))
            .to.eventually.rejectedWith(cause);
    });
});
