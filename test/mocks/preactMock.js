// filepath: /home/silas/code/Git/Repos/Website/ags/test/mocks/preactMock.js
// Simplified mock for Preact
const preact = {
  // Core Preact API
  createElement: jest.fn().mockImplementation((type, props, ...children) => ({
    type,
    props: props || {},
    children
  })),
  Component: class Component {
    constructor(props) {
      this.props = props || {};
      this.state = {};
    }
    setState() {}
    forceUpdate() {}
    render() {}
  },
  render: jest.fn(),
  h: jest.fn(),
  Fragment: Symbol('Fragment'),
  
  // Options API
  options: {
    vnode: jest.fn(),
    event: jest.fn(),
    debounceRendering: jest.fn(),
    __: jest.fn(),
    __e: jest.fn(),
    __b: jest.fn(),
    __r: jest.fn(),
    diffed: jest.fn(),
    __c: jest.fn(),
    unmount: jest.fn()
  },
  
  // Hooks
  hooks: {
    useState: jest.fn().mockImplementation(initial => [initial, jest.fn()]),
    useEffect: jest.fn(),
    useContext: jest.fn(),
    useReducer: jest.fn().mockImplementation((reducer, initial) => [initial, jest.fn()]),
    useRef: jest.fn().mockImplementation(initial => ({ current: initial })),
    useLayoutEffect: jest.fn(),
    useCallback: jest.fn().mockImplementation(cb => cb),
    useMemo: jest.fn().mockImplementation(fn => fn())
  }
};

module.exports = preact;
module.exports.createElement = preact.createElement;
module.exports.Component = preact.Component;
module.exports.render = preact.render;
module.exports.h = preact.h;
module.exports.Fragment = preact.Fragment;
module.exports.options = preact.options;

// Export hooks
module.exports.useState = preact.hooks.useState;
module.exports.useEffect = preact.hooks.useEffect;
module.exports.useContext = preact.hooks.useContext;
module.exports.useReducer = preact.hooks.useReducer;
module.exports.useRef = preact.hooks.useRef;
module.exports.useLayoutEffect = preact.hooks.useLayoutEffect;
module.exports.useCallback = preact.hooks.useCallback;
module.exports.useMemo = preact.hooks.useMemo;