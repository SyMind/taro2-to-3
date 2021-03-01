import Taro from '@tarojs/taro';

function usePersistFn(fn) {
  const fnRef = Taro.useRef(fn);
  fnRef.current = fn;

  const persistFn = Taro.useRef();
  if (!persistFn.current) {
    persistFn.current = function (...args) {
      return fnRef.current.apply(this, args);
    };
  }

  return persistFn.current;
}

export default usePersistFn;
