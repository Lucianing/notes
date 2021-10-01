# 扑克牌游戏

难度：⭐️⭐️

有一堆扑克牌，将牌堆第一张放到桌子上，再将接下来的 牌堆的第一张放到牌底，如此往复；

最后桌子上的牌顺序为： (牌底) 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 (牌顶)；

问：原来那堆牌的顺序，用函数实现。

```js
/**
 * 分析：
 *     思路，先正序，然后倒序实现。牌堆，可以看成一个数组，数组第一项就是底牌，数组最后一些项就是顶牌。
 *     桌子上的牌可以看成一个数组(deskPokers)，手上的牌也是一个数组(originPokers)，其实就是两个数组之间的操作。
 * 正序：
 *  1、将牌堆第一张放到桌子上，即：originPokers 最后一项 放入 deskPokers
 *  2、牌堆的第一张放到牌底，即 originPokers 最后一项 移动到 第一项
 * 
 * 倒序：
 *  最值得注意的是，倒序和正序的操作都是相反的，这是个难点。因此：
 *  1、牌堆的底牌放到第一张，即：originPokers 第一项 移动到 最后一项 （如果没有则不需要操作）
 *  2、将桌子上的牌放入牌堆，即：deskPokers 最后一项，放入 originPokers
 */ 

const deskPokers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

const getOriginPokers = (pokers = []) => {
  const originPokers = [];
  for(let i = pokers.length - 1; i >= 0; i--) {
    originPokers.length > 1 && originPokers.push(originPokers.shift());
    originPokers.push(pokers[i]);
  }
  return originPokers;
}
```
