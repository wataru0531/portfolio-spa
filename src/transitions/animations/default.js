
// default.js
// → 下から上にトランジション

import { gsap, customEases } from "../../lib/index.js";


// 
export function defaultTransition(currentContainer, nextContainer) {
  gsap.set(nextContainer, {
    // 次のページのコンテナをy軸上に潰す
    clipPath: "inset(100% 0% 0% 0%)", // 上 右 下 左。上から100%切り取り
    opacity: 1,
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100vh",
    zIndex: 10,
  });

  const tl = gsap.timeline();

  tl.to(currentContainer, {
    y: "-30vh",
    opacity: 0.4,
    scale: 0.8,
    duration: 0.7,
    force3D: true, // 強制的にtranslate3Dを使う。
                   // → 通常ではtranslateだが、translate3DでGPUを使うようにする。
                   //   transformを使うキーがあれば自動でtranslate3Dを使わせるが、
                   //   ここでは強制的にtranslate3Dを使わせるようにする。 
    ease: customEases.pageTransition,
  }, 0)
  .to(nextContainer, {
    clipPath: "inset(0% 0% 0% 0%)", // 元に戻す
    duration: 0.7,
    force3D: true,
    ease: customEases.pageTransition,
  }, 0); 

  return tl;
}
