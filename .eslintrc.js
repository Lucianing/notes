/*
 * @Description: eslint 配置文件
 * @Author: lzc
 * @Date: 2019-12-30 20:24:30
 */
module.exports = {
  extends: ['eslint-config-zend/react-typescript'],
  rules: {
    'import/no-unresolved': 0,
    'no-undefined': 0,
    'no-tabs': 0,
    'import/no-dynamic-require': 0,
    'react/destructuring-assignment': 0,
    'react/react-in-jsx-scope': 0,
    'react/button-has-type': 0,
    'no-debugger': 0,
  }
};

