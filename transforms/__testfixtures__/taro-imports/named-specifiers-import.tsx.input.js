import Taro, {FunctionComponent, FC, SFC} from '@tarojs/taro';

const App1: FunctionComponent<{ message: string }> = ({ message }) => (
  <div>{message}</div>
);

const App2: FC<{ message: string }> = ({ message }) => (
  <div>{message}</div>
);

const App3: SFC<{ message: string }> = ({ message }) => (
  <div>{message}</div>
);
