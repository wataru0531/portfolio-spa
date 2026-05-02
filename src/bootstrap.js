
// main.js

// ✅ TODO

// 黒レイヤーで黒背景がモチ上がる → SVGに変kぅ
// menuの実装
// WebGLの実装の確認


// 他のページ追加
// → Worksを追加。/works/works1

// ページ遷移後にWebGLの位置がおかしくなる問題

// ⭐️デザインを決める
// ローディング
// SVGで幾何学のオブジェクトを。circle、rectなど
// ◯ マウスの出現タイミングを制御

// ページ遷移後にスクロール位置をトップに戻す
// 慣性スクロール
// スクロールアニメーション
// フォルダ構成の最適化
// metadata.js ... SEO

// microCMS

import gsap from "gsap";

import world from "./glsl/world";
import { viewport, gui, INode, utils } from "./helper";
// import scroller from "./component/scroller";
import mouse from "./component/mouse";
import loader from "./component/loader";
import { menu } from "./component/menu";
import { registerScrollAnimations } from "./component/scroll-animation.js";

import { router } from "./router.js";


// ✅ デバック 1ならデバッグモード
// window.debug = enableDebugMode(1);
// console.log(window.debug)

// ✅ デバックモード: 1、  非デバックモード: 0
function enableDebugMode(debug) {
  // console.log(debug)
  // meta.env.DEV...viteが提供する特殊な変数
  // → 開発環境では、true
  //   本番環境では、falseになる

  // 万が一本番環境でデバックモードで上げた場合は結果はfalseが返ってくる
  return debug && import.meta.env.DEV;
}

// ✅ 初期化
export async function init() {
  await router.init(); // SPA初期化

  const canvas = INode.getElement("#js-canvas");
  // console.log(canvas)

  // 👉 pageTypeをどうするか
  // const pageEl = INode.getElement("#page-container");   // ページタイプを取得
  // console.log(pageEl)

  // const pageType = INode.getDS(pageEl, "page");
  // console.log(pageType); // home sub

  if(window.debug) await gui.init(); // GUIの初期化...本番環境では必要ないのでif文で囲う

  viewport.init(canvas, 2000, 1500, 4000); // ビューポートに関する初期化

  // scroller.init(true); // 慣性スクロール。trueで入れない

  // ✅ ローディングで使うDOMを取得
  loader.init();

  // ✅ GPUパフォーマンス測定
  // ここではtierが2, 50fpsでない場合は各index.jsでメッシュの作成をスキップ
  await utils.definePerformanceMode(1, 20);
  


  // ✅ 数値のカウントアップの事前準備 + preloaderのアニメーション。
  // const countup = INode.getElement("#js-countup");
  const countupInner = INode.getElement("#js-countup-inner");
  const svgProgress = INode.getElement("#js-svg-progress");
  const svgTrack = INode.getElement("#js-svg-track");
  const svgPathLength = svgTrack.getTotalLength();
  
  // console.log(loaderPercent)
  loader.addProgressAction((progress, total) => {
    // console.log(progress, total)
    const ratio = progress / total;

    // 👉 カウンター
    countupInner.innerHTML = `${Math.round(ratio * 100)}%`; // round 四捨五入
    
    // 👉 TODO SVGの進行も追加 
    // → テクスチャの読み込みに同意させる。 → 速すぎて厳しい。
    // gsap.to(svgProgress,{
    //   strokeDashoffset: svgPathLength - svgPathLength * ratio,
    //   duration:0.35,
    //   ease:"glide"
    // });
    
  });

  // ローディングアニメーションに追加したい処理
  // ① circleのアニメーション
  loader.addLoadingAnimation((_tl) => {

    return new Promise((resolve) => {

      // ////////////////////////////////////////////////////////////////////
      // ② ⭐️ SVGアニメーション
      ///////////////////////////////////////////////////////////////////////
      let preloaderComplete = false;

      // const preloaderTexts = [...document.querySelectorAll(".p-loader p")];
      // console.log(preloaderTexts); 
      // (7) [p, p, p, p, p, p#js-loader-start, p#js-loader-end]
      
      const preloaderBtn = INode.getElement("#js-loader-btn");
      const svgTrack = INode.getElement("#js-svg-track"); // 1つめのグレーcircle
      const svgProgress = INode.getElement("#js-svg-progress"); // 2つ目の白circle
      // console.log(svgProgress);

      const svgPathLength = svgTrack.getTotalLength();
      // console.log(svgPathLength); // 円周の長さ。973.5000610351562

      // JSでも制御する。見た目を担保、ブラウザによって異なるかもしれないから
      gsap.set([svgTrack, svgProgress], {
        strokeDasharray: svgPathLength,
        strokeDashoffset: svgPathLength, // 左に押し込む
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
      _tl
      .to(".p-loader .p-loader__row p .line", { // CSS側でY軸下100%に
        y: "0%",
        ease: "power3.out",
        duration: .75,
        stagger: {
          each: .1
        }
      })
      .to(svgTrack, { // グレーcircle
        strokeDashoffset: 0,
        duration: 2,
        ease: "hop",
      }, "<") // 直前のトゥイーンの開始時
      .to(".p-svg-strokes svg", { // ⭐️svg自体を回転させる
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
        _tl.to(svgProgress, { // 白circle
          // strokeDashoffset → 右側にどれだけ押し込んでいるか
          strokeDashoffset: svgPathLength - (svgPathLength * stop),
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
      .to(preloaderBtn, { // 中央の円のコンテナ
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


      // ⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから
      // ⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから
      // ⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから
      // リファクタリング
      
      // ✅ 中央のコンテナクリック → ここはtimelineから切り離す
      svgProgress.addEventListener("pointerdown", () => { 
        if(!preloaderComplete) return;

        preloaderComplete = false;

        const bulge = document.getElementById("js-bulge");
        const menuBgSvg = document.querySelector(".menu-bg-svg"); // svg
        const menuPath = document.getElementById("menu-path"); // path
        const svgWidth = menuBgSvg.viewBox.baseVal.width; // 内部座標の幅
        const svgHeight = menuBgSvg.viewBox.baseVal.height;
        const svgCenterX = svgWidth / 2;

        // 初期位置 全体を覆う
        const OPEN_START = 
        `M${svgWidth},${svgHeight} Q${svgCenterX},${svgHeight} 0,${svgHeight} L0,0 L${svgWidth},0 Z`

        const exitTl = gsap.timeline();
        exitTl
        // .to("#js-loader", {
        //   scale: 0.75,
        //   duration: 1.25,
        //   ease: "hop",
        // })
        .to([svgTrack, svgProgress], {
          strokeDashoffset: -svgPathLength,
          duration: 1.25,
          ease: "hop",
        }, "<")
        .to(".p-svg-strokes svg", { // ⭐️svg自体をさらに270度プラスで回転
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
        .to("#js-loader", {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)", // 上に上げる
          duration: 1.5,
          ease: "hop"
        })
        .to(menuPath, { // ⭐️ SVGのBulge
          attr: { 
            d: `M${svgWidth},345 Q${svgCenterX},620 0,345 L0,0 L${svgWidth},0 Z`
          }, // 左サイドから下に沈める
          ease: "power3.in",
          duration: 0.5,
          // delay: .1
        })
        .to(menuPath, {
          attr: { 
            d: `M${svgWidth},0 Q${svgCenterX},0 0,0 L0,0 L${svgWidth},0 Z`
          }, // ビューポート下に一直線
          ease: "power3.out",
          duration: 0.5,
        })
        .to(["#js-loader", "#js-bulge"], { // .p-loader自体を非表示
          display: "none",
        })
      });
    })
  })


  await loader.loadAllAssets(); // windowにテクスチャをキャッシュとして保持する。
                                // 読み込むまで待機させる
                                // 👉 カウントアップのアニメーションもここで行う

  const bgColor = "none";
  await world.init(canvas, viewport, bgColor); // Three.js関連の初期化

  addGui(world); // guiの初期化

  // 各ページで使うJSの初期化
  // await import(`./pages/${pageType}.js`).then(({ default: init }) => {
  //   // ・default → default exportされているものが渡ってくる。
  //   return init({
  //     world,
  //     mouse,
  //     menu,
  //     loader,
  //     viewport,
  //     scroller,
  //   });
  // });

  // ✅ リサイズ処理をまとめる
  viewport.addResizeAction(() => {
    // canvasのサイズの更新、メッシュの位置やサイズの更新、カメラのprojectionMatrixの更新
    world.adjustWorldPosition(viewport);

    mouse.resize(); // マウスカーソルのsvgタグのサイズ更新
  });

  // ✅ renderに関する処理をまとめる
  world.addRenderAction(() => { 
    mouse.render();
    world.raycast();
  });

  // registerScrollAnimations(); // ScrollTriggerの登録、実行

  // menu.init(world, scroller); // ハンバーガーの初期化

  world.render();

  // ✅ 全てを読み込んでローディングのアニメーション発火(カウンターの削除、コンテンツを表示)
  await loader.letsBegin(); 

  // ✅ カーソル → loader.jsで初期化

  // mouse.makeVisible(); // 初期表示時にカスタムカーソルを非表示。300ms毎に判定
}

// guiを初期化、展開
function addGui(_world){
  if(window.debug) {
    gui.add(_world.addOrbitControlGUI); // OrbitControlの制御

    // 全てのメッシュにguiを追加
    gui.add((gui) => { // lilGUIがわたってくる
      gui.close();

      _world.os.forEach((o) => {
        if(!o.debug) return; // oがデバッグ関数をもったなかったら処理中断

        const type = INode.getDS(o.$.el, "webgl"); // type → フォルダ名
        // console.log(type)
        const folder = gui.addFolder(type); // フォルダ追加
        // console.log(folder)
        folder.close(); // 非表示。各ファイルで上書きできる
        o.debug(folder); // フォルダーのインスタンスを渡す
      });
    });
  }

}