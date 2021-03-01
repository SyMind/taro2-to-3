import React from 'react';

function usePersistFn(fn) {
  const fnRef = React.useRef(fn);
  fnRef.current = fn;

  const persistFn = React.useRef();
  if (!persistFn.current) {
    persistFn.current = function (...args) {
      return fnRef.current.apply(this, args);
    };
  }

  return persistFn.current;
}

export default usePersistFn;
