
// registry.js
// → ページ遷移時のアニメーションを選択

import { defaultTransition } from "./animations/index";

import { toLeftTransition } from "./animations/to-left-transition.js";

// ページ遷移時のアニメーションの選択
export const transitionRegistry = {
  "home-to-about": defaultTransition, // 上に上がる
  // "about-to-home": defaultTransition,
  "about-to-home": toLeftTransition, // 左に移動する

  default: defaultTransition,
};

// ✅ ページ遷移アニメーションを選択
export function getTransition(currentNamespace, nextNamespace) {
  const key = `${currentNamespace}-to-${nextNamespace}`;
  const transition = transitionRegistry[key] || transitionRegistry.default;

  return transition;
}
