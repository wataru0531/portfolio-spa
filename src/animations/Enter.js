
// Enter.js 
// → 画面に入った時にアニメーション


import { wrap_chars, wrap_lines } from "../helper/wrap";
import { customEases, gsap, SplitText } from "../lib";
// → gsap、SplitTextなどを登録してエクスポート


// ✅ アニメーションのタイムライン + h1のSplitTextのインスタンスを返す
const ENTER = (nextContainer, delay = 0) => { // そのページの、[data-transition="container"]
  // console.log(nextContainer); // <div data-transition="container" data-namespace="home">
  
  const t = nextContainer?.querySelector("h1") || document.querySelector("h1");
  const content = nextContainer?.querySelector(".js-hero-content");
  
  // 左(上)のulのライン
  const linesLeft = nextContainer?.querySelectorAll(".js-line-left");
   // 右(下)のulのライン
  const linesRight = nextContainer?.querySelectorAll(".js-line-right");
  // console.log(linesRight);

  // 上のulのpタグのテキスト
  const ps =  nextContainer?.querySelectorAll(".js-anim_p"); 
  // 下のulのpタグのテキスト
  const ps2 = nextContainer?.querySelectorAll(".js-anim_p2");
  
  if(!t) return null; // h1がなければ終わらす

  gsap.set(t, { opacity: 1 });

  // h1タイトル
  const s = new SplitText(t, { type: "chars",  aria: false  }); // アクセシビリティ無効
  // console.log(s); // _SplitText2 {isSplit: true, elements: Array(1), chars: Array(6), words: Array(0), lines: Array(0), …}
  
  const p = new SplitText(ps, { type: "lines",  aria: false  }); // ulの左のpタグテキスト
  // console.log(p); // _SplitText2 {isSplit: true, elements: Array(6), chars: Array(0), words: Array(0), lines: Array(6), …}
  
  const ptwo = new SplitText(ps2, { type: "lines" ,  aria: false }); // ulの左右のpタグテキスト

  // ラップ + 要素を下に
  wrap_chars(s); 
  wrap_lines(p);
  wrap_lines(ptwo);

  // gsap.set(img, {
  //   y: "120%",
  //   force3D: true,
  //   willChange: "transform",
  //   backfaceVisibility: "hidden",
  // });

  // gsap.set(ps, {
  //   opacity: 0,
  //   willChange: "opacity",
  // });

  // ✅ ラインを左に寄せておく
  gsap.set(linesRight, {
    x: "-100%",
    force3D: true,

    backfaceVisibility: "hidden",
  });

  gsap.set(linesLeft, {
    x: "-100%",
    force3D: true,

    backfaceVisibility: "hidden",
  });
  gsap.set(content, { opacity: 1 });

  const tl = gsap.timeline({
    defaults: {
      force3D: true,
      lazy: false, // アニメーションの値を「遅延せず、すぐに反映する」設定
                   // レンダリング最適化の挙動を制御
    },
  });

  tl.to(s.chars, { // h1
    rotateX: 0, // 初期値 → rotateX(60deg)。奥側に回転している
    y: 0,
    force3D: true,
    duration: 2.1,
    stagger: 0.035,
    ease: "expo.out",
  }, delay ) // 0.32
  .to(p.lines, { // 左のpタグテキスト
    y: 0,
    duration: 1.65,
    stagger: {
      amount: 0.08,
      from: "end",
    },
    force3D: true,
    ease: "power3.out",
  }, window.innerWidth < 900 ? delay: delay + 0.2 ) // timelineの開始からの秒数
  .to(ptwo.lines, { // 右のpタグテキスト
      y: 0,
      duration: 1.65,
      stagger: {
        amount: 0.08,
        from: "end",
      },
      force3D: true,
      ease: "power3.out",
    }, delay + 0.2 )
  .to(linesRight, { // 右のライン
    x: 0,
    duration: 1,
    stagger: {
      amount: 0.25,
      from: "start",
    },
    ease: "power2.inOut",
  }, 0 )
  .to(linesLeft, { // 左のライン
    x: 0,
    duration: 1,
    stagger: {
      amount: 0.25,
      from: "start",
    },
    ease: "power2.inOut",
  }, 0 );

  return { timeline: tl, splitInstance: s };
};


export default ENTER;
