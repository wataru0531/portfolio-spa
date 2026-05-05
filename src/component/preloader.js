
/**************************************************************

// preloader.js

// svg関連のアニメーション

***************************************************************/
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(SplitText, CustomEase);

CustomEase.create("hop", "0.9, 0, 0.1, 1");
CustomEase.create("glide", "0.8, 0, 0.2, 1");

import { INode } from "../helper";
import mouse from "./mouse";


const $ = {}; // DOM要素

const preloader = {
  $,
  init,
  createAnimation,
};


// 初期化処理
async function init() {
  // DOM取得
  $.loader = INode.getElement("#js-loader");
  $.loaderBtn = INode.getElement("#js-loader-btn");
  $.svgStrokes = INode.getElement("#js-svg-strokes");
  // console.log($.svgStrokes)
  $.svgTrack = INode.getElement("#js-svg-track"); // 1つめのグレーcircle
  $.svgProgress = INode.getElement("#js-svg-progress"); // 2つ目の白circle


  // ⭐️ ここから⭐️ここから⭐️ ここから⭐️ここから⭐️ ここから⭐️ここから⭐️ ここから⭐️ここから⭐️ ここから⭐️ここから
  // ⭐️ ここから⭐️ここから⭐️ ここから⭐️ここから⭐️ ここから⭐️ここから⭐️ ここから⭐️ここから⭐️ ここから⭐️ここから
  // ⭐️ ここから⭐️ここから⭐️ ここから⭐️ここから⭐️ ここから⭐️ここから⭐️ ここから⭐️ここから⭐️ ここから⭐️ここから
  // バージをコンポーネント化する このファイルやmenu.jsのような感じ

  $.bulge = INode.getElement("#js-bulge"); // → ✅ TODO Bulgeもあとで分離させるか？
  $.menuBgSvg = document.querySelector(".menu-bg-svg"); // svg
  $.menuPath = document.getElementById("menu-path"); // path
  $.svgWidth = $.menuBgSvg.viewBox.baseVal.width; // 内部座標の幅
  $.svgHeight = $.menuBgSvg.viewBox.baseVal.height;
  $.svgCenterX = $.svgWidth / 2;


  $.svgPathLength = $.svgTrack.getTotalLength();
  // console.log($.svgPathLength); // 円周の長さ。973.5000610351562

  // HTMLで設定しているがJSでも制御。見た目を担保、ブラウザによって異なるかもしれないから
  gsap.set([$.svgTrack, $.svgProgress], {
    strokeDasharray: $.svgPathLength,
    strokeDashoffset: $.svgPathLength, // 左に押し込む
  });

  // preloaderTexts.forEach(p => { // テキスト分割
  //   new SplitText(p, {
  //     type: "lines",
  //     linesClass: "line",
  //     mask: "lines",
  //   });
  // });

  // new SplitText(".hero h1", { // ヒーロー
  //   type: "words",
  //   wordsClass: "word",
  //   mask: "words"
  // });

  // ✅ introTl
  // const introTl = gsap.timeline({ 
  //   delay: 1,
  //   onComplete: () => resolve(_tl),
  // });
  // introTl

  _bindEvents();
}

let preloaderComplete = false;

// ✅ イベント処理
function _bindEvents(){

  // ボタンクリックの処理 Bulge → 別ファイル切り出し
  // ✅ 中央のコンテナクリック → これは、timelineから切り離された処理
    $.svgProgress.addEventListener("pointerdown", () => { 
      if(!preloaderComplete) return;

      preloaderComplete = false;

      // 初期位置 全体を覆う
      const OPEN_START = `M${$.svgWidth},${$.svgHeight} Q${$.svgCenterX},${$.svgHeight} 0,${$.svgHeight} L0,0 L${$.svgWidth},0 Z`

      const exitTl = gsap.timeline();
      exitTl
      // .to("#js-loader", {
      //   scale: 0.75,
      //   duration: 1.25,
      //   ease: "hop",
      // })
      .to([$.svgTrack, $.svgProgress], {
        strokeDashoffset: -$.svgPathLength,
        duration: 1.25,
        ease: "hop",
      }, "<")
      .to($.svgStrokes, { // ⭐️svg自体をさらに270度プラスで回転
        rotation: 540,
        duration: 2,
        ease: "hop",
      }, "<")
      .to("#js-loader-start .line", { // "start"
        y: "-100%",
        duration: 0.75,
        ease: "power3.out",
      }, "-=1.25")
      .to("#js-loader-end .line", {
        y: "0%",
        duration: 0.75,
        ease: "power3.out",
      }, "-=0.75") // // 直前のトゥイーンの終了に何秒だけ重ねるか
      .to($.loader, {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)", // 上に上げる
        duration: 1.5,
        ease: "hop"
      })
      .to($.menuPath, { // ⭐️ SVGのBulge
        attr: { 
          d: `M${$.svgWidth},345 Q${$.svgCenterX},620 0,345 L0,0 L${$.svgWidth},0 Z`
        }, // 左サイドから下に沈める
        ease: "power3.in",
        duration: 0.5,
        // delay: .1
      })
      .to($.menuPath, {
        attr: { 
          d: `M${$.svgWidth},0 Q${$.svgCenterX},0 0,0 L0,0 L${$.svgWidth},0 Z`
        }, // ビューポート下に一直線
        ease: "power3.out",
        duration: 0.5,
      })
      .to([$.loader, $.bulge], { // .p-loader自体を非表示
        display: "none",
      })
    });
}

// ✅ svgのcircleアニメーション、テキストを戻す、カーソル初期化
// → bootstrapで、loader.addLoadingAnimationにコールバックで渡す
//   どれを、loader.jsの、letsBeginで発火させる。なので_tlが渡される仕組み
function createAnimation(){
  return (_tl) => { // → loader.jsで発火させるのでこの形でいい
    return new Promise((resolve) => {
      // console.log($.svgStrokes);

      _tl
      .to(".p-loader .p-loader__row p .line", { // テキストの位置を元にもどす
        y: "0%",
        ease: "power3.out",
        duration: .75,
        stagger: {
          each: .1
        }
      })
      .to($.svgTrack, { // グレーcircle
        strokeDashoffset: 0,
        duration: 2,
        ease: "hop",
      }, "<") // 直前のトゥイーンの開始時
      .to($.svgStrokes, { // ⭐️ svg自体を回転させる
        rotation: 270,
        duration: 2,
        ease: "hop",
      }, "<");

      // ✅ 白circleをどこで止めるかの値を算出
      const progressStops = [0.2, 0.25, 0.85, 1].map((base, idx) => {
        if(idx === 3) return 1;
        return base + (Math.random() - .5) * 0.1; // 元の値 + (- 0.5 〜　0.5) * 0.1
                                                  // → 元の値　+ (- 0.05 〜 0.05)
      });
      // console.log(progressStops); // 4) [0.2462, 0.2155, 0.857, 1]

      // ⭐️ 段階的に白ラインを動かす 
      // → ⭐️ ここをテクスチャの読み込みと同期できないか？
      progressStops.forEach((stop, idx) => {
        _tl.to($.svgProgress, { // 白circle
          // strokeDashoffset → 右側にどれだけ押し込んでいるか
          strokeDashoffset: $.svgPathLength - ($.svgPathLength * stop),
          duration: 0.75,
          ease: "glide",
          delay: idx === 0 ? 0.3 : 0.3 + (Math.random() * 0.2), // 0.3 + 0から0.02の範囲で差を付ける
        })
      });

      _tl
      .to("#js-loader-logo", { // ロゴ
        opacity: 0,
        duration: .35,
        ease: "power1.out",
      }, "-=0.25") // 直前のトゥイーンの終了に何秒だけ重ねるか
      .to($.loaderBtn, { // 中央の円のコンテナ
        scale: .9,
        duration: 1.5,
        ease: "hop",
      }, "-=0.5")
      .to("#js-loader-start .line", { // "start"
        y: "0%",
        duration: 0.75,
        ease: "power3.out",
        onComplete: () => {
          preloaderComplete = true;
        }
      }, "-=0.75")
      .call(() => {
        ////////////////////////////////////////////////////////////////
        // ⭐️ カーソルの初期化
        ////////////////////////////////////////////////////////////////
        document.body.style.cursor = "auto";
        // mouse.$.svg.classList.add("is-visible");
        
        mouse.init(false, true); // デフォルトのカーソルを隠すかどうか、svgカーソルを挿入するかどうか
        // if(mouse.$.svg) mouse.$.svg.classList.add("is-visible")
      
        resolve(_tl);
      });

    })
  }
}



export default preloader;