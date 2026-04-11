
// wrap.js

import { gsap } from "../lib/index";



// ✅ lineで分割したテキストをラップ → 要素を下に
export function wrap_lines(el) {
  el.lines.forEach((line) => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      overflow: hidden;
      line-height: 100%;
      transform: translateZ(0);
      backface-visibility: hidden;
      margin-bottom: 0.1rem;
    `;
    line.parentNode.insertBefore(wrapper, line); // lineの前にwrapperを挿入
    wrapper.appendChild(line); // そのwrapperにlineを挿入。一度wrapperをDOMに差し込む
  });

  gsap.set(el.lines, {
    y: "100%",

    force3D: true,
    willChange: "transform",
  });
}

// 1文字で分割したテキストをラップ + 下に隠す
export function wrap_chars(el) {
  // el.chars.forEach((char) => {
  //   const wrapper = document.createElement("span");
  //   wrapper.style.cssText = `
  //     overflow-y: hidden;
  //     perspective: 1000px;
  //     background-color:aqua;
  //   `;
  //   wrapper.classList.add("char-wrapper");
  //   // console.log(char.parentNode); // h1
  //   char.parentNode.insertBefore(wrapper, char); // charの前に挿入
  //   wrapper.appendChild(char); // そのcharをwrapperい入れる。
  //                             //  → wrapperはDOMに存在しないので、最初にDOMに差し込む必要がある
  // });

  gsap.set(el.chars, {
    y: "100%",
    force3D: true,
    rotateX: 60,
  });
}

// export { wrap_lines, wrap_chars };
