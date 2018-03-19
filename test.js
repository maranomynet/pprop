//@flow
const o = require('ospec');
const PProp = require('./cjs/index');


o.spec('PProp', () => {

    o.spec('container', () => {
        o('returns the values passed into it', () => {
            const ARRAY = [];
            const OBJECT = {};
            const DATE = new Date();

            o( PProp(null)() ).equals( null );
            o( PProp(undefined)() ).equals( undefined );
            o( PProp('')() ).equals( '' );
            o( PProp(false)() ).equals( false );
            o( PProp(0)() ).equals( 0);
            o( PProp(ARRAY)() ).equals( ARRAY );
            o( PProp(OBJECT)() ).equals( OBJECT );
            o( PProp(DATE)() ).equals( DATE );
        });

        o('allows updating the values', () => {
            const a = PProp('Hi');
            o( a() ).equals( 'Hi' );
            a('Hello');
            o( a() ).equals( 'Hello' );

            const b = PProp(false);
            o( b() ).equals( false );
            b(true);
            o( b() ).equals( true );

            const c = PProp(1);
            o( c() ).equals( 1 );
            c(undefined);
            o( c() ).equals( undefined );
        });

        o('returns the updated value when updating', () => {
            const a = PProp('Hi');
            o( a('Hello') ).equals( 'Hello' );
        });

        o('has undefined value by default', () => {
            const empty = PProp();
            o( empty() ).equals( undefined );
        });

        o('can update to undefined', () => {
            const emptied = PProp('some value');
            emptied(undefined);
            o( emptied() ).equals( undefined );
        });

        o('accepts and returns other pProp objects', () => {
            const a = PProp('hello');
            o( PProp(a)() ).equals( a );
        });

    });




    o.spec('valueOf', () => {
        o('works', () => {
            o( PProp(1).valueOf() ).equals(1);
            o( PProp('a').valueOf() ).equals('a');
            o( PProp(true).valueOf() ).equals(true);
            o( PProp(null).valueOf() ).equals(null);
            o( PProp(undefined).valueOf() ).equals(undefined);
            o( PProp({a: 1}).valueOf() ).deepEquals({a: 1});
            o( PProp([1, 2, 3]).valueOf() ).deepEquals([1, 2, 3]);
            o( PProp().valueOf() ).equals(undefined);
        });
        o('allows implicit value access in mathematical operations', () => {
            o( PProp(2) + PProp(3) ).equals(5);
        });
    });




    o.spec('toString', () => {
        o('aliases valueOf', () => {
            const a = PProp(1);
            o( a.toString ).equals(a.valueOf);
        });
        o('allows implicit value access in string operations', () => {
            o( PProp('a') + PProp('b') ).equals('ab');
        });
    });




    o.spec('toJSON', () => {
        o('works', () => {
            o( PProp(1).toJSON() ).equals(1);
            o( PProp('a').toJSON() ).equals('a');
            o( PProp(true).toJSON() ).equals(true);
            o( PProp(null).toJSON() ).equals(null);
            o( PProp(undefined).toJSON() ).equals(undefined);
            o( PProp({a: 1}).toJSON() ).deepEquals({a: 1});
            o( PProp([1, 2, 3]).toJSON() ).deepEquals([1, 2, 3]);
            o( PProp().toJSON() ).equals(undefined);
            o( PProp(new Date(0)).toJSON() ).equals(new Date(0).toJSON());
        });
        o('works w/ JSON.stringify', () => {
            o( JSON.stringify(PProp(1)) ).equals(JSON.stringify(1));
            o( JSON.stringify(PProp('a')) ).equals(JSON.stringify('a'));
            o( JSON.stringify(PProp(true)) ).equals(JSON.stringify(true));
            o( JSON.stringify(PProp(null)) ).equals(JSON.stringify(null));
            o( JSON.stringify(PProp(undefined)) ).equals(JSON.stringify(undefined));
            o( JSON.stringify(PProp({a: 1})) ).deepEquals(JSON.stringify({a: 1}));
            o( JSON.stringify(PProp([1, 2, 3])) ).deepEquals(JSON.stringify([1, 2, 3]));
            o( JSON.stringify(PProp()) ).equals(JSON.stringify(undefined));
            o( JSON.stringify(PProp(new Date(0))) ).equals(JSON.stringify(new Date(0)));
        });
        o('works for mappers', () => {
            const a = PProp('a');
            const b1 = a.map((val) => val+'!');
            const b2 = a.map((val) => val+'!!');
            o( b1.toJSON() ).equals('a!');
            o( JSON.stringify(b2) ).equals(JSON.stringify('a!!'));
        });
    });




    o.spec('combine', () => {

        o('transforms value', () => {
            const upstream = PProp();
            const doubled = PProp.combine([upstream], (s) => s * 2);
            o( doubled() ).equals(undefined);
            upstream(2);
            o( doubled() ).equals(4);
        });

        o('transforms default value', () => {
            const upstream = PProp({ foo: 2 });
            const doubled = PProp.combine([upstream], (s) => s.foo * 2);
            o( doubled() ).equals(4);
        });

        o('transforms multiple values', () => {
            const us1 = PProp();
            const us2 = PProp();
            const summed = PProp.combine([us1, us2], (s1, s2) => s1 + s2);
            o( summed() ).equals(undefined);
            us1(2);
            us2(3);
            o( summed() ).equals(5);
        });

        o('transforms multiple default values', () => {
            const us1 = PProp(2);
            const us2 = PProp(3);
            const summed = PProp.combine([us1, us2], (s1, s2) => s1 + s2);
            o( summed() ).equals(5);
        });

        o('transforms mixed default and late-bound values', () => {
            const us1 = PProp(2);
            const us2 = PProp();
            const summed = PProp.combine([us1, us2], (s1, s2) => s1 + s2);
            o( summed() ).equals(undefined);
            us2(3);
            o( summed() ).equals(5);
        });

        o('combines atomically', () => {
            let count = 0;
            const a = PProp();
            const b = PProp.combine([a], (a) => a * 2);
            const c = PProp.combine([a], (a) => a * a);
            const d = PProp.combine([b, c], (b, c) => {
                count++;
                return b + c;
            });
            a(3);
            o( d() ).equals(15);
            o( count ).equals(1);
        });

        o('combines default value atomically', () => {
            let count = 0;
            const a = PProp(3);
            const b = PProp.combine([a], (a) => a * 2);
            const c = PProp.combine([a], (a) => a * a);
            const d = PProp.combine([b, c], (b, c) => {
                count++;
                return b + c;
            });
            o( d() ).equals(15);
            o( count ).equals(1);
        });

        o('combine can return undefined', () => {
            const a = PProp(1);
            const b = PProp.combine([a], () => undefined);
            o( b() ).equals(undefined);
        });

        o('combine can return pProp', () => {
            const a = PProp(1);
            const b = PProp.combine([a], () => PProp(2));
            o( b()() ).equals(2);
        });

        o('combine will throw with a helpful error if given non-pProp values', () => {
            const spy = o.spy();
            const a = PProp(1);
            let thrown = null;
            try {
                PProp.combine([a, 'not a pProp'], spy);
            }
            catch (e) {
                thrown = e;
            }
            o( thrown ).notEquals(null);
            o( thrown != null && thrown.constructor === TypeError ).equals(false);
            o( spy.callCount ).equals(0);
        });

        o('ignores attempts to set a new value directly', () => {
            const upstream = PProp('hi');
            const combined = PProp.combine([upstream], (value) => value.toUpperCase());
            combined('hello');
            o( combined() ).equals('HI');
            o( combined('hola!') ).equals('HI')('Returns the combined/mapped value');
        });

        o('only calls the mapper function when getting the mapped value and the upstream value has changed', () => {
            const upstream = PProp('hi');
            let count = 0;
            const combined = PProp.combine([upstream], (value) => {
                count++;
                return value + '!';
            });
            o( count ).equals(0)('combiner not called when defined');
            upstream('hola');
            o( count ).equals(0)('combiner not called when upstream changes');
            combined();
            o( count ).equals(1)('getting combined value calls combiner');
            combined();
            o( count ).equals(1)('repeated gets do not call combiner again');
            upstream('hola');
            combined();
            o( count ).equals(1)('same-value updates to upstream have no effect');
            upstream('hi again');
            combined();
            o( count ).equals(2)('getting combined value after new upstream value calls combiner');
        });

    });




    o.spec('map', () => {

        o('works', () => {
            const stream = PProp();
            const doubled = stream.map((value) => value * 2);
            o( doubled() ).equals(undefined);
            stream(3);
            o( doubled() ).equals(6);
        });

        o('works with default value', () => {
            const upstream = PProp(3);
            const doubled = upstream.map((value) => value * 2);
            o( doubled() ).equals(6);
        });

        o('works with undefined value', () => {
            const upstream = PProp();
            const mapped = upstream.map((value) => String(value));
            o( mapped() ).equals(undefined);
            upstream(undefined);
            o( mapped() ).equals('undefined');
        });

        o('works with default undefined value', () => {
            const upstream = PProp(undefined);
            const mapped = upstream.map((value) => String(value));

            o( mapped() ).equals('undefined');
        });

        o('waits for a pending pProp', () => {
            const upstream = PProp();
            const mapped = upstream.map((arr) => arr[0] && arr[0].toUpperCase() );
            o( mapped() ).equals(undefined);
            upstream(['a']);
            o( mapped() ).equals('A');
        });

        o('ignores attempts to set a new value directly', () => {
            const upstream = PProp('hi');
            const mapped = upstream.map((value) => value.toUpperCase());
            mapped('hello');
            o( mapped() ).equals('HI');
        });

        o('only calls the mapper function when getting the mapped value and the upstream value has changed', () => {
            const upstream = PProp('hi');
            let count = 0;
            const mapped = upstream.map((value) => {
                count++;
                return value + '!';
            });
            o( count ).equals(0)('mapper not called when defined');
            upstream('hola');
            o( count ).equals(0)('mapper not called when upstream changes');
            mapped();
            o( count ).equals(1)('getting mapped value calls mapper');
            mapped();
            o( count ).equals(1)('repeated gets do not call mapper again');
            upstream('hola');
            mapped();
            o( count ).equals(1)('same-value updates to upstream have no effect');
            upstream('hi again');
            mapped();
            o( count ).equals(2)('getting mapped value after new upstream value calls mapper');
        });

    });




    o.spec('internal plumbing', () => {

        o('updating pProps should not flag updating dependents as stale', () => {
            const a = PProp('a');
            const b = a.map((val) => val);
            const c = b.map((val) => val);
            const c2 = b.map((val) => val);
            const d2 = c2.map((val) => val);
            const d = c.map((val) => val);

            const _spyOnStaleWrites = (pProp) => {
                let stale = pProp._privateState_.stale;
                pProp._staleCount = 0;
                // $FlowFixMe: Don't know why Flow complains about this
                Object.defineProperties(pProp._privateState_, {
                    stale: {
                        get() { return stale; },
                        set(value) {
                            pProp._staleCount++;
                            stale = value;
                        },
                    },
                });
            };
            [c,d,c2,d2].forEach(_spyOnStaleWrites);

            d();
            c();
            b();
            a();
            o( d._staleCount ).equals(1)('d._staleCount');
            o( c._staleCount ).equals(1)('c._staleCount');
            o( c2._staleCount ).equals(0)('Leaves c2 alone because its initial state is stale');
            o( d2._staleCount ).equals(0)('Leaves d2 alone because its initial state is stale');
            a('b');
            d();
            o( d._staleCount ).equals(3)('d._staleCount #2');
            o( c._staleCount ).equals(3)('c._staleCount #2');
            o( c2._staleCount ).equals(0)('Left c2 alone still');
            o( d2._staleCount ).equals(0)('Left d2 alone still');

        });

    });




    o.spec('replaceWith', () => {

        o('works', () => {
            const a = PProp('a');
            const b = PProp('b');
            const c = a.map((val) => val.toUpperCase());
            const d = a.map((val) => val+'!');
            const e = PProp.combine([c,d], (c,d) => c+d);

            o( e() ).equals('Aa!');
            c.replaceWith(b);
            o( e() ).equals('ba!')('`b` replaces `c`');
            b.replaceWith(c);
            o( e() ).equals('Aa!')('`c` reclaims its place');
            o( b() ).equals('b')('Value of `b` remains unchanged');
            c.replaceWith(d);
            o( e() ).equals('a!a!')('`d` replaces `c`');
            a('aaa');
            o( e() ).equals('aaa!aaa!')('Change `a`');
            // a.replaceWith(b);
            // o( e() ).equals('Bb!')('`b` replaces `a`');

        });

    });

    o.spec('eject', () => {

        o('works', () => {
            const a = PProp('x');
            const b = a.map((val) => val.toUpperCase());
            const c = b.map((val) => val+'!');
            a('y');
            b.eject();
            o( c() ).equals('Y!');
            a('z');
            o( b() ).equals('Y')('Ejecting a mapper cuts its ties to its parents');
            o( c() ).equals('Y!')('Ejecting a mapper cuts ties between its original parents and the decendants');
        });

    });

    o.spec('liveCombine / liveMap', () => {

        o('works', () => {
            const a = PProp('x');
            const b = PProp('y');

            const mapper = (val) => val+'!';
            const mapper1 = o.spy(mapper);
            const mapper2 = o.spy(mapper);

            a.map(mapper1);
            const cLive = a.liveMap(mapper2);

            o( mapper1.callCount ).equals(0)('Lazy mapper is not called on pProp creation');
            o( mapper2.callCount ).equals(1)('Live mapper is called on pProp creation');
            a('xx');
            o( mapper1.callCount ).equals(0)('Lazy mapper is not called when parent updates');
            o( mapper2.callCount ).equals(2)('Live mapper is called when parent updates');
            o( cLive() ).equals('xx!')('Live-mapped pProp returns correct value');
            a('xx');
            o( mapper2.callCount ).equals(2)('Live mapper is only called when parent changes');

            const combiner = (val1, val2) => val1+' '+val2;
            const combiner1 = o.spy(combiner);
            const combiner2 = o.spy(combiner);
            const combiner3 = o.spy(combiner);
            PProp.combine([a,b], combiner1);
            const dLive = PProp.liveCombine([a,b], combiner2);

            o( combiner1.callCount ).equals(0)('Lazy combiner is not called on pProp creation');
            o( combiner2.callCount ).equals(1)('Live combiner is called on pProp creation');
            a('x');
            b('yy');
            o( combiner1.callCount ).equals(0)('Lazy combiner is not called when parents update');
            o( combiner2.callCount ).equals(3)('Live combiner is called when parents update');
            const cmb2lastCount = combiner2.callCount;
            o( dLive() ).equals('x yy')('Live-combined pProp returns correct value');
            a('x');
            b('yy');
            o( combiner2.callCount ).equals(cmb2lastCount)('Live combiner is only called when parents change');


            const dLazy = PProp.combine([a, b], combiner1);
            const eLazy = PProp.combine([dLazy, a], mapper1);
            const dLive2 = PProp.liveCombine([a, cLive, dLazy, eLazy], combiner3);
            a('xx');
            o( combiner3.callCount ).equals(2)('Live-map-combining pProp is called only once when inter-dependant parents update');
            const cmb3lastCount = combiner3.callCount;
            o( dLive2() ).equals('xx xx!')('Live-map-combining pProp returns correct value');
            a('xx');
            o( combiner3.callCount ).equals(cmb3lastCount)('Live-map-combining pProp is only called when inter-dependant parents change');

        });

    });


    o.spec('isProp', () => {

        o('works', () => {
            o( PProp.isProp(PProp()) ).equals(true);
            o( PProp.isProp(PProp('with default value')) ).equals(true);
            o( PProp.isProp('with default value') ).equals(false);
            o( PProp.isProp({ not:'Prop'}) ).equals(false);
        });

    });


});
