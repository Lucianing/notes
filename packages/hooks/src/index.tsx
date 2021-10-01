/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useState as useNativeState } from 'react';
import ReactDOM from 'react-dom';

/**
 * 为什么不能直接定义为 ((prevState: T) => T) | T
 * https://github.com/microsoft/TypeScript/issues/37663
 */
type Action<T> = T extends any ? (((prevState: T) => T) | T) : never;

type Dispatch<T> = (action: Action<T>) => void;

type Update<S> = {
  action: Action<S>;
  next: Update<S> | null;
} | null;

type UpdateQueue<S> = {
  pending: Update<S> | null;
};

type Hook<S = any> = {
  memoizedState: S | null;
  next: Hook<S> | null;
  queue: UpdateQueue<S> | null;
} | null;


let isFirstMount = true;
let workInProgressHook: Hook = null;

const fiber: { memoizedState: Hook } = {
  memoizedState: null
};

const dispatchAction = <S, >(queue: any, action: Action<S>): void => {
  const update: Update<S> = {
    action,
    next: null
  };

  update.next = update;


  /**
   * queue.pending = u5 -> u0 -> u1 -> u2 -> u4
   *                 |                        |
   *                 |________________________|
   */

  // if (queue.pending === null) {
  //   update.next = update;
  // } else {
  //   update.next = queue.pending.next;
  //   queue.pending.next = update;
  // }

  queue.pending = update;

  workInProgressHook = fiber.memoizedState;

  render();
};

// <S>(queue: UpdateQueue<S>, action: Action<S>) => void
const useState = <T, >(initialState: T): [T, Dispatch<T>] => {
  let hook: Hook<T> = null;
  if (isFirstMount) {
    hook = {
      memoizedState: initialState,
      next: null,
      queue: {
        pending: null
      }
    };
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook;
    } else if (workInProgressHook) {
      workInProgressHook.next = hook;
    }
    workInProgressHook = hook;
  } else {
    hook = workInProgressHook;
    workInProgressHook = workInProgressHook?.next || null;
  }

  let state = hook?.memoizedState as T;
  if (hook?.queue?.pending) {
    let update: Update<T> = hook.queue.pending.next;
    do {
      const action = update?.action;
      state = typeof action === 'function'
        ? action(state)
        : action;
      update = update?.next || null;
    } while (update !== hook.queue.pending.next);
    hook.queue.pending = null;
  }

  if (hook) {
    hook.memoizedState = state;
  }

  return [state, dispatchAction.bind(null, hook?.queue) as any];
};

const App = () => {
  const [num, setNum] = useState<number>(0);
  const [num2, setNum2] = useState<number>(100);
  const [num3, setNum3] = useState<number>(200);

  return (
    <div>
      <button
        onClick={
          () => {
            // setNum(num + 1);
            // setNum(num + 10);
            // setNum2(num2 + 100);
            setNum3(num3 + 400);
          }
        }
      >
        点击增加
      </button>
      <button onClick={() => { setNum3(state => state + 200) }}>
        点击增加num3
      </button>
      <div>
        {num}
      </div>
      <div>
        {num2}
      </div>
      <div>
        {num3}
      </div>
    </div>
  );
};

function render() {
  ReactDOM.render(<App />, document.getElementById('root'));
  if (isFirstMount) {
    isFirstMount = false;
  }
}

render();

