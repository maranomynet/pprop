# Changelog for PProp

## Unreleased...
<!-- Add new lines here. Version number will be decided later -->
* ...


## 1.0.0
_2018-0x-xx_
* Initial release
* `PProp()` getter setter factory. Returned props have `toJSON`, `toString` and `valueOf`.
* Lazy `PProp.combine(mapFn, [prop1, prop2])` and `prop1.map(mapFn)` methods for derivative values
* Stream-like `PProp.combineLive` and `prop1.mapLive` methods that trigger on every change
* `prop1.replaceWith(newProp)` and `prop1.eject()` methods that sever PProp dependency chains

