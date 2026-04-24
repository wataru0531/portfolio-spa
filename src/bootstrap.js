
// main.js

// ✅ TODO

// ローディング後のintroで黒背景がモチがある部分　→ svgに変更
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