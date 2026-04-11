
// home.js
// → router.jsで、importで非同期で読み込む

import template from "./home.html?raw";
// console.log(template, typeof template); // 文字列 string
// ?raw ... htmlを、文字列として読み込む。Viteの機能。

import { gsap } from "../../lib/index";
import ENTER from "../../animations/Enter";

// pageModule.default()で呼び出し
export default function HomePage() {
  return template;
}

// ✅ 初期化
export function init(options = {}) {
  // console.log(options); // {container: div}
  const container =
    options.container ||
    document.querySelector('[data-transition="container"]');

  // アニメーションのタイムライン + h1のSplitTextのインスタンスを返す
  const enterData = ENTER(container, 0.32);
  // console.log(enterData); // { timeline: Timeline2, splitInstance: _SplitText2 }

  if (enterData?.splitInstance) {
    container._splitInstance = enterData.splitInstance; // h1のSplitTextのインスタンスを返す
  }
}

// ✅ クリーンアップ処理。GSAPで付与したアニメーションを全部削除
export function cleanup() {
  const container = document.querySelector('[data-transition="container"]');
  // console.log(container); // 遷移前のページのcontainer

  if(container?._splitInstance) {
    // console.log(container._splitInstance);
    const h1 = container.querySelector("h1");
    // console.log(h1)

    if(h1) {
      // { clearProps: "all" } → 要素に付与されたインラインスタイルを全部削除する
      // console.log(h1.querySelectorAll(".char-wrapper > *")); // NodeList []
      gsap.set(h1.querySelectorAll(".char-wrapper > *"), { clearProps: "all" });
    }

    container._splitInstance = null; // 初期化

    if(h1) {
      const wrappers = h1.querySelectorAll(".char-wrapper");
      // console.log(wrappers); // NodeList []

      wrappers.forEach((wrapper) => {
        // console.log(wrapper);
        const char = wrapper.firstChild;
        wrapper.parentNode.insertBefore(char, wrapper);
        // wrapper.remove();
      });
    }
  }
}
