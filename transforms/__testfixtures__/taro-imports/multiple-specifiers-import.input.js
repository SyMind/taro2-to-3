import { useRef } from '@tarojs/taro'

function usePersistFn(fn) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const persistFn = useRef();
  if (!persistFn.current) {
    persistFn.current = function (...args) {
      return fnRef.current.apply(this, args);
    };
  }

  return persistFn.current;
}

export default usePersistFn;
