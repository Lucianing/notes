# React Hook

-----

## 前言

`React Hook` 诞生3年多了，在日常开发工作中，阅读官网 [Hooks 简介](https://react.docschina.org/docs/hooks-intro.html) 足以应付项目开发。

但是，做人要有探索精神🤔 ，得尝试去了解其内部实现的原理。下面我们以最经典的 `useState` 和 `useEffect` 为例子去实现。

## useState

从最简单的 `useState` 使用例子开始:

```tsx
import { useState, ReactElement } from 'react';
import ReactDOM from 'react-dom';

function App(): ReactElement {
  const [num, setNum] = useState<number>(0);

  return <button onClick={() => setNum(num + 1)}>{num}</button>;
}

ReactDOM.render(<App />, document.getElementById("root"));
```

上面的例子中，可以拆分理解成：

- 初次加载渲染
- 用户点击后更新视图，也就是重新`render`

这个章节没必要探讨渲染部分，目标是实现一个 `useState` ，那么我们稍微修改一下上面例子：

```tsx
import { ReactElement } from 'react';
import ReactDOM from 'react-dom';

function useState<T = any>(initialState: T): [T, (state: T) => void] {
  // TODO: 这里是我们要实现的逻辑
  let state: T = initialState;
  const action = (nextState: T): void => {
    state = nextState;
    render();
  };
  return [state, action];
}

function App(): ReactElement {
  const [num, setNum] = useState<number>(0);

  return (
    <button onClick={() => setNum(num + 1)}>
      {num}
    </button>
  );
}

function render(): void {
  ReactDOM.render(<App />, document.getElementById('root'));
}

// 首次渲染
render();
```

很明显，这是最最最原始的 `useState` 雏形了，但是，测试一下，就能发现，点击后并不生效😂

注意，点击后是执行`useState` 返回的 `action`, 然后里面重新调用 `render` 函数，但是执行`action`并不会重新进行一次 `useState` 的调用啊，因此，我们去需要把`state`放在外面全局。

接着上面的例子

```tsx
// ...
// 放在全局
let state: any
function useState<T = any>(initialState: T): [T, (state: T) => void] {
  // 默认才是使用 initialState
  state = state || initialState;
  const action = (nextState: T): void => {
    state = nextState;
    // ...
  };
  return [state, action];
}

// ...
```

稍微改动，就已经是一个可以正常工作的`useState`了。

🤔 那么，问题又来了，一个组件是可以使用多个 `useState` 的，这意味着，
全局的`state`必须是一个`数组或对象`的方式进行管理。

全局`state`可以使用数组来进行管理，参考 [React Hooks 原理](https://github.com/brickspert/blog/issues/26)。但是，在React源码中，是采用链表的数据结构进行管理的，那么我们尝试模拟官方实现。

### 链表方式实现useState

在官方源码中`react-reconciler/src/ReactFiberHooks.old.js`

```ts
type Update<S, A> = {
  lane: Lane;
  action: A; 
  eagerReducer: ((S, A) => S) | null;
  eagerState: S | null;
  next: Update<S, A>;
  priority?: ReactPriorityLevel;
}

type UpdateQueue<S, A> = {
  pending: Update<S, A> | null;
  dispatch: (A => mixed) | null;
  lastRenderedReducer: ((S, A) => S) | null;
  lastRenderedState: S | null;
};

export type Hook = {
  memoizedState: any, // 存储在当前fiber对象的state
  baseState: any, // 初始化 initialState
  baseQueue: Update<any, any> | null, // 当前需要更新的 Update
  queue: UpdateQueue<any, any> | null, // 保存update的queue
  next: Hook | null, // link 到下一个 hook，形成链表结构
};
```

#### 如何保存hook数据

在上面的例子中，我们直接把hook产生的 `state`已数组的形式放在全局作用域。

但是在React中，是hook数据是存放在`fiber`数据结构的`memoizedState`属性当中，每个组件就是一个 `fiber` 节点，跟随组件诞生和销毁。

```ts
export type Fiber = {
  //...
  key: null | string;
  stateNode: any;
  memoizedState: any;
  // ...
}
```

`但是，在我们这个例子中，我们还是把hook的相关数据存放在全局作用域当中。否则需要实现调度协调相关逻辑，不在本章讨论范围`

```ts
const fiber = {
  memoizedState: Hook;
}
```

`memoizedState` 以链表形式保存hook。在初次加载的时候生成。
因此需要区分是否是初次加载。*这也是为什么hook不能在if循环里面使用，只能在函数组件第一层使用的原因*

#### hook 数据结构

在react源码基础上精简化，具体如下：

```ts
type Action<T> = T extends any ? (((prevState: T) => T) | T) : never;

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
```

在react源码中发现数据的更新处理是使用 `环状链表` 结构，但是，调试后发现是没必要的，普通链表就可以了，这算不算是官方的代码冗余🤔。具体查看源码`react-reconciler/src/ReactFiberHooks.old.js 中 dispatchAction 方法`

```js
function dispatchAction( fiber, queue, action ) {
  //其他...
  var update = {
    // lane: lane,
    action: action,
    eagerReducer: null,
    eagerState: null,
    next: null
  }; // Append the update to the end of the list.

  var pending = queue.pending;

  if ( pending === null ) {
    // This is the first update. Create a circular list.
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }

  queue.pending = update;
  // 其他...
}
```

简单调试后发现，并不会走 `else` 逻辑。因为在 `updateReducer` 方法中，每次执行完之后会重新置为 `null`，因此不用环状链表也能实现。

### useState具体代码实现

例子代码可以在👉 [此处查看](https://gitee.com/Lucaining/notes/packages/hooks/src/index.tsx)

```tsx
import React from 'react';
import ReactDOM from 'react-dom';

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

```

## useEffect

...

## 参考文档

- [React hooks: not magic, just arrays](https://medium.com/@ryardley/react-hooks-not-magic-just-arrays-cd4f1857236e)
- [useEffect 完整指南](https://overreacted.io/zh-hans/a-complete-guide-to-useeffect/)
- [React Hooks 原理](https://github.com/brickspert/blog/issues/26)

文章中多有见解不到当之处，欢迎讨论和指正。
