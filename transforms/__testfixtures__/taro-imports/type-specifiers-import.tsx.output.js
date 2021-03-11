import React, { type FunctionComponent, type FC, type SFC } from 'react';

const App1: FunctionComponent<{ message: string }> = ({ message }) => (
  <div>{message}</div>
);

const App2: FC<{ message: string }> = ({ message }) => (
  <div>{message}</div>
);

const App3: SFC<{ message: string }> = ({ message }) => (
  <div>{message}</div>
);
