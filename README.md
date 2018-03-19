# PProp

PProp is a tiny, fast, super-lazy value mapping library – a bit similar to [flyd][] and [mithril-stream][] but simpler and more opinionated about speed and efficiency, and less concerned about implementing proper stream behaviour and fantasy-land algebraic abstractions. 


[flyd]: https://github.com/paldepind/flyd
[mithril-stream]: https://github.com/MithrilJS/mithril.js/tree/next/stream 



## Installation and basic usage

```
npm install pprop
```

```js
import PProp from 'pprop';

// Create a getter/setter value container
const name = PProp('Steve');

// Define readonly derived values (mappers)
const secretName = name.map((n) => 'Agent ' + n.charAt(0) );

const greeting = PProp.combine(
    [name, secretName],
    (a, b) => 'Hello ' + a + ' ...I mean ' + b
);


// Read current values
name(); // === 'Steve'
secretName(); // === 'Agent S'
greeting(); // === 'Hello Steve ...I mean Agent S'

// Change name
name('Mary'); // === 'Mary'

// Get updated values
secretName(); // === 'Agent M';
greeting(); // === 'Hello Mary ...I mean Agent M';
```

With PProp derived values aren't immediately re-calculated when the upstream value changes. Instead they're only calculated on the first read.

This means you can build a large number of complex mappings, many levels deep, and casually update the upstream values as often as you like, with no cycles wasted re-calculating the derivative-value tree.

Only the values you actually read are calculated.

Note that PProp likes to keep things simple and only does shallow compares to decide if values have changed. This means that you need to think of using immutability helpers when updating object/array values.

Note that PProp does provide `value.liveMap` and `PProp.liveCombine` methods for those cases where you desperately need "live" mappers/combiners that trigger some side-effect as soon as an upstream value *changes*.



## API


### `PProp(initialValue)` - create value container

`PProp()` returns a getter/setter function that acts as a container for any value passed into it.

```js
// Create an empty, uninitialized container
const value1 = PProp();
// Create a container with initial value
const value2 = PProp(1337);

// Get the value
value1(); // === undefined;
value2(); // === 1337;

// Set/update the values
value1('Hello'); // === 'Hello';
value2(9000); // === 9000;

// Get the new values
value1(); // === 'Hello';
value2(); // === 9000;
```

PProp containers have `toString`, `valueOf` and `toJSON` methods so they're fairly convenient to pass around like values.

```js
( value1 + ' Steve!' ); // === 'Hello Steve!'
( value2 + 9 ); // === 9009
JSON.stringify({ a: value1, b: value2 }); // === { "a": "Hello",  "b": 9000  }
```

...and as setter functions;

```js
const data = PProp();
fetchData()
    .then(data)
    .then(update);
```


### `value.map(mapperFn)` - create derived value

All PProp objects expose a `.map()` method that returns a new value container whith a value based on the parent value container's current value.

```js
// Create derived values
const derived1 = value1.map((v) => v.toUpperCase());
const derived2 = value2.map((v) => v / 2);

// Get the values
derived1(); // === 'HELLO'
derived2(); // === 4500
```

The mapping functions are assumed to be pure (side-effect free) and are only invoked when the derived container's value is read and its parent's value has changed since last read.

If the parent is uninitialized, then the derivative container also remains unitialized until the parent receives a value.

```js
// parent starts uninitialized (no initial value)
const parent = PProp();

const derived = parent.map((v) => v.toUpperCase()+'!');

// Both parent and derived return undefined;
parent(); // === undefined
derived(); // === undefined

// Initialize by setting the parent's value
parent('cool');
derived(); // === 'COOL!'
```


### `PProp.combine([cont1, cont2], mapperFn)` - derive from multiple values

...