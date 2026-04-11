
// pageTransition.js

// containerの中にcurrentContainerとnextContainerの2つを入れて、
// アニメーションを実現している

import { gsap } from "../lib/index.js";
import { getTransition } from "./registry.js";

// ✅ 遷移先のページを生成、ページ遷移アニメーション実行
export async function executeTransition({
  currentNamespace,
  nextNamespace,
  nextHTML, // 遷移先にページのhtml。sectionタグ
  nextModule, // 遷移先のページのデータ
}) {
  const containerWrapper = document.querySelector('[data-transition="container-wrapper"]'); // containerをラッパー
  const currentContainer = document.querySelector('[data-transition="container"]');

  // 次に差し込むコンテナを作っていく
  const nextContainer = currentContainer.cloneNode(false); // クローンのコンテナ。浅いコピー(子要素のコピーはしない)
  nextContainer.setAttribute("data-namespace", nextNamespace); // 名前空間更新

  const main = document.createElement("main");
  main.className = "l-main p-main";
  main.id = "js-main";
  main.innerHTML = nextHTML;
  nextContainer.appendChild(main);

  containerWrapper.appendChild(nextContainer);

  const images = nextContainer.querySelectorAll("img");
  // console.log(images); // NodeList []

  // 画像があれば、すべてのロードを待つ
  if(images.length > 0) {
    await Promise.all(Array.from(images).map((img) =>
      new Promise((resolve) => {
        if(img.complete) return resolve(); // この画像がすでに読み込まれているかどうか。ここでreturn
                                          // → 読み込みが完了しているのに後からonloadの発火を待つと、
                                          //   onloadが発火しない可能性がある
        img.onload = resolve; 
        img.onerror = resolve;
      }),
    ));
  }

  if(nextModule.init) { // 遷移先のページのアニメーション
    nextModule.init({ container: nextContainer });
  }

  // ページ遷移用のアニメーションを取得
  const transitionFn = getTransition(currentNamespace, nextNamespace);
  const timeline = await transitionFn(currentContainer, nextContainer); // 実行
  // console.log(timeline); // Timeline2 {vars: {…}, _delay: 0, _repeat: 0, _ts: 1, _dur: 0.7, then: fn,}

  await timeline.then(); // timelineが終わるまで待つ。resolveが内部で実行されている。
                         // → thenがPromiseを返す 

  currentContainer.remove();
  gsap.set(nextContainer, {
    clearProps: "clipPath,position,top,left,width,height,zIndex,opacity", // 指定したCSSプロパティをリセット
    force3D: true,
  });
}
