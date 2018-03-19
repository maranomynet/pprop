//@flow
let guid = 0;

/*::
    type PPropId = string;
    type PPropState = {
        id: PPropId,
        pending: boolean,
        stale: boolean,
        updating: boolean,
        live: boolean,
        deps: { [PPropId]: PPropContainer<mixed> },
        parents: [],
    }

    type _PPropProps = {
        _privateState_: PPropState,
        map: function,
        constructor: function,
        valueOf: function,
        toString: function,
        toJSON: function,
        liveMap: function,
        replaceWith: function,
        eject: function,
    }

    type _PPropContainer<T> = (initialValue?:T) => T & _PPropProps
    type PPropContainer<T> = $Supertype<_PPropContainer<T>>

    type _PPropMapper<T> = () => T & _PPropProps
    type PPropMapper<T> = $Supertype<_PPropMapper<T>>

*/

const createPProp = function /*:: <T> */(initialValue/*:: ?:T */)/*: PPropContainer<T> */ {
    let value = initialValue;
    const pProp = function () {
        const state = pProp._privateState_;
        if (arguments.length > 0) {
            const newValue = arguments[0];
            if ( newValue !== value || state.pending ) {
                value = newValue;
                flagDependantsAsStale(state.deps);
            }
            state.pending = false;
        }
        return value;
    };
    initPProp(pProp, createPProp);

    if (arguments.length > 0) {
        // value = arguments[0];
        pProp._privateState_.pending = false;
    }
    return pProp;
};


const isPending = (pProp) => pProp._privateState_.pending === true  &&  pProp._privateState_.stale === false;

const createCombinerPProp = /*:: <T>*/(combinerFn/*: () => T */)/*: PPropMapper<T> */ => {
    let parentValues;
    let value;
    const pProp = () => {
        const state = pProp._privateState_;
        if ( state.stale ) {
            state.stale = false;
            if ( state.pending ) {
                if ( state.parents.some(isPending) ) {
                    return;
                }
                state.pending = false;
            }
            state.updating = true;
            let parentValuesChanged = false;
            if ( !parentValues ) {
                parentValues = state.parents.map((parent) => parent());
                parentValuesChanged = true;
            }
            else {
                parentValues = [];
                state.parents.forEach((parent, i) => {
                    const parentValue = parent();
                    if ( parentValue !== parentValues[i] ) {
                        parentValuesChanged = true;
                    }
                    parentValues[i] = parentValue;
                });
            }
            if ( parentValuesChanged ) {
                parentValues.push(value);
                const newValue = combinerFn.apply(null, parentValues);
                if ( newValue !== value ) {
                    value = newValue;
                    flagDependantsAsStale(state.deps);
                }
            }
            state.updating = false;
        }
        return value;
    };
    initPProp(pProp, createCombinerPProp);
    pProp._privateState_.stale = true;
    return pProp;
};



function initPProp(pProp, constrFn) {
    pProp.constructor = constrFn;
    const state/*:PPropState*/ = {
        id: ''+guid++,
        pending: true,
        stale: false,
        updating: false,
        live: false,
        deps: {},
        parents: [],
    };
    pProp._privateState_ = state;
    // $FlowFixMe: valueOf and toString are
    pProp.valueOf = pProp.toString = pProp;
    pProp.toJSON = toJSON;

    pProp.map = map;
    pProp.liveMap = liveMap;

    pProp.replaceWith = replaceWith;
    pProp.eject = eject;
}


let _liveQueue;
let _liveFinds = {};
let _depth = 0;
const flagDependantsAsStale = (dependands) => {
    _depth++;
    for (let id in dependands) {
        const depProp = dependands[id];
        const depState = depProp._privateState_;
        if ( !depState.stale && !depState.updating ) {
            depState.stale = true;
            if ( depState.live && !_liveFinds[id] ) {
                if ( !_liveQueue ) {
                    _liveQueue = [];
                    _liveFinds = {};
                }
                _liveQueue.push(depProp);
                _liveFinds[id] = 1;
            }
            else {
                flagDependantsAsStale( depState.deps );
            }
        }
    }
    if ( _liveQueue && _depth === 1 ) {
        _liveQueue.forEach((pProp) => pProp());
        _liveQueue = undefined;
        _liveFinds = {};
    }
    _depth--;
};


const _map = /*:: <T> */(parents/*: Array<<PPropContainer><mixed>|PPropMapper<mixed>> */, combinerFn/*: ()=>T */)/*: PPropMapper<T> */ => {
// const _map = <T>(parents: (Array<<PPropContainer><mixed>|PPropMapper<mixed>>), combinerFn()=>T): PPropMapper<T> => {
    if (parents.some((parent) => !parent._privateState_)) {
        throw new Error('PProp.combine only accepts pProps');
    }
    const pProp = createCombinerPProp(combinerFn);
    pProp._privateState_.parents = parents;
    for (var i = 0; i < parents.length; i++) {
        parents[i]._privateState_.deps[ pProp._privateState_.id ] = pProp;
    }
    return pProp;
};
function map(mapperFn) { return _map([this], mapperFn); }



const _liveMap = (parents, eventFn) => {
    const pProp = _map(parents, eventFn);
    pProp._privateState_.live = 'true';
    pProp();
    return pProp;
};
function liveMap(eventFn) { return _liveMap([this], eventFn); }



function toJSON() {
    const val = this();
    return val != null && typeof val.toJSON === 'function' ? val.toJSON() : val;
}



function replaceWith(replacement) {
    const oldPropp = this;
    const oldState = oldPropp._privateState_;

    oldState.parents.forEach((parent) => { delete parent._privateState_.deps[oldState.id]; });

    for (var id in oldState.deps) {
        const depParents = oldState.deps[id]._privateState_.parents;
        depParents[ depParents.indexOf(oldPropp) ] = replacement;
    }
    replacement._privateState_.deps = oldState.deps;
    flagDependantsAsStale(oldState.deps);

    oldState.parents = [];
    oldState.deps = {};
    oldState.stale = false;
    return replacement;
}

function eject() {
    return this.replaceWith( PProp( this() ) );
}



const PProp = createPProp;
PProp.combine = _map;
PProp.liveCombine = _liveMap;
PProp.isProp = (x) => !!x._privateState_;

export default PProp;
