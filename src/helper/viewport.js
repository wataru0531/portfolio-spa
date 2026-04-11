
// ビューポートに関する処理
// canvasとhtmlの座標のスケールを一致させていて、それらをviewportオブジェクトに保持する
// → cameraからcanvasまでの距離、幅、高さ、fovなどレンダリングに関するデータを取得して、
//   world.jsのrenderer、cameraの初期化に用いてhtmlのスケールとWebGLのスケールとを一致させる

// ここではhtml自体を直接にWebGLに格納しているのではなくて、
// canvasの大きさをhtmlにまずは合わせて、それらのデータをrendererとcameraに合わせることで、間接的にスケールを一致させているんですね

// canvasの高さを100vh、幅を100vwにする
// → ブラウザ(html)と大きさを合わせる。
//   1pxの幅の線がcanvas上で描画されると、HTMLでも1pxの幅で表示されることになる

import { INode } from ".";

const viewport = {
  init,
  addResizeAction,
  removeResizeAction,
  isMobile,
}

const $ = {};
const actions = new Set(); // リサイズが発生した時に発火したいコールバックを登録
let initialized = false;

function init(canvas, cameraZ = 2000, near = 1500, far = 4000){
  $.canvas = canvas;
  const rect = INode.getRect(canvas);

  viewport.width = rect.width;
  viewport.height = rect.height;
  viewport.near = near; // nearからfarがmeshの表示対象
  viewport.far = far;
  viewport.cameraZ = cameraZ; // カメラの位置がz軸(0, 0)からどのくらい離れているか
  viewport.aspect = viewport.width / viewport.height;
  viewport.rad = 2 * Math.atan(viewport.height / 2 / cameraZ); // 長さの比から、ラジアンを取得
  viewport.fov = viewport.rad * (180 / Math.PI); // radianを度数法に
  // console.log(window.devicePixelRatio)
  // viewport.devicePixelRatio = window.devicePixelRatio;
  viewport.devicePixelRatio = 1; // intelなどはかなり重くなるので1に設定

  if(!initialized) { // 初回のみ_bindEventsを登録
    _bindEvents();

    initialized = true;
  }

  return viewport;
}

// イベントをひとまとめにする
function _bindEvents(){
  let timerId = null;

  window.addEventListener("resize", () => {
    _onResize();

    clearTimeout(timerId);

    timerId = setTimeout(() => { // ここは最終調整のためのコールバック
      // console.log("resize done!!", timerId)
      _onResize();
    }, 500);
  });
}

// ✅ リサイズ処理。リサイズに関する処理はここにまとめる
function _onResize(){
  _update(); // canvasの情報を更新

  actions.forEach(action => action(viewport)); // リサイズに関するコールバックを実行
  // console.log(actions);
}

// near、far、cameraZの情報を更新
function _update(){
  const { near, far, cameraZ } = viewport;

  viewport.init($.canvas, cameraZ, near, far);
}

// リサイズ時に実行したいコールバックを格納
function addResizeAction(_callback){
  actions.add(_callback);
}

// リサイズ時に実行したいコールバックを削除
function removeResizeAction(_callback){
  actions.delete(_callback);
}

// スマホならtrueが返る
function isMobile(){
  return viewport.width < 1280;
}

export { viewport };