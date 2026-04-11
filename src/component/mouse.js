
// マウスに関する処理

import { viewport, INode, utils } from "../helper";
import { handlers } from "./mouse-animation";

const $ = {};
const current = {}; // 現在マウスの位置
const target = {};  // 将来のマウスの位置など。currentより先に更新
const delta = {}; // currentとtargetの差分
const initial = {}; // 初期値

const body = INode.getElement("body");

// マウスに関する処理の関数を格納
const mousemoveActions = new Set(); // Set → 重複を省く

const mouse = {
  $,
  init,
  initial, 
  current,
  target,
  delta,
  setTarget,
  speed: .2,
  shouldTrackMousePos: true, // stuckのenterの時はfalse。位置情報を更新しない
  startTrackMousePos,
  stopTrackMousePos,
  tick: 0,
  getClipPos,
  getMapPos,
  addMousemoveActions,
  removeMousemoveActions,
  render,
  resize,
  makeVisible,
  isUpdate,
};

// hideDefaultCursor: カーソル表示/非表示
// applyStyle: 円のカスタムカーソル非表示/非表示
function init(hideDefaultCursor = false, applyStyle = true) {
  const initial = mouse.initial = {
    x: viewport.width / 2,
    y: viewport.height / 2,
    r: 40,
    // fill: "#00ff00", // 塗りつぶしの色
    fill: "#ffffff", // 塗りつぶしの色
    fillOpacity: 0, // 塗りつぶしの色の透明度。1になるほど濃い
    strokeWidth: 1,
    scale: 1, // 拡大する時の係数
    mixBlendMode: "difference",
  };

  Object.assign(current, initial);
  Object.assign(target, initial);
  Object.assign(delta, { x: 0, y: 0, scale: 1, fillOpacity: 0 });
  // console.log(current, target, delta);

  // タッチデバイスならデフォルトのカーソルを表示
  mouse.hideDefaultCursor = utils.isTouchDevices ? false : hideDefaultCursor;
  mouse.applyStyle = utils.isTouchDevices ? false : applyStyle;

  if(hideDefaultCursor) document.body.style.cursor = "none";

  $.svg = _createCustomCursor(); // svgタグ生成
  // console.log($.svg);
  $.svg.style.mixBlendMode = initial.mixBlendMode;

  const circles = INode.qsAll(".js-circle", $.svg); // クラス名, スコープ
  // console.log(circles)
  $.outerCircle = circles[0]; // 外側の円
  $.innerCircle = circles[1]; // 内側の円
  // console.log($)

  if(mouse.applyStyle) body.prepend($.svg);

  $.transforms = INode.qsAll("[data-mouse]"); // 拡大、張り付けに関する要素取得
  // console.log($.transforms): // (19) [button.btn-menu, a.side__link, a.side__link, a.side__link, a.side__link, li.menu__li, li.menu__li, li.menu__li, li.menu__li, li.menu__li, 

  _bindEvents();
}


// 
function _bindEvents() {
  window.addEventListener("pointermove", (event) => {
    // stuck(張り付き)の要素の場合は、位置情報を更新しない。stuckの関数を優先する
    if(mouse.shouldTrackMousePos) { // デフォルトではtrue
      _updatePosition(event); // マウス座標を更新
    }

    // ✅ マウスに関する処理の関数を実行。ripple > index.jsで、onMouseMoveを格納
    // console.log(mousemoveActions);
    mousemoveActions.forEach(action => action?.(mouse)); 
  });
  
  document.addEventListener("pointerenter", (event) => {
    // $.svg.style.opacity = 1;
    // $.svg.style.visibility = "visible";
    $.svg.classList.add("is-visible")
  })

  document.addEventListener("pointerleave", (event) => {
    // $.svg.style.opacity = 0;
    // $.svg.style.visibility = "hidden";
    $.svg.classList.remove("is-visible")
  });


  // ✅ ホバーアニメーションなど。マウス拡大、スタック
  // console.log($.transforms); // (20) [button.btn-menu, a.side__link, a.side__link, a.side__link, a.side__link, li.menu__li, li.menu__li, li.menu__li, li.menu__li, li.menu__li, div.fv__content, h1.fv__title, button.fv__btn.prev, button.fv__btn.next, div.vision__left, span.more-link__circle, span.more-link__circle, span.more-link__circle, a.footer__logo-link, span]
  $.transforms.forEach(el => {
    // console.log(el)
    const handlerType = INode.getDS(el, "mouse"); // data-mouse="stack"の時、stackを取得
    // console.log(handlerType); // highlight stack
    // console.log(handlers)
    const handler = handlers[handlerType]; // highlight{}を取得
    // console.log(handler); // { enter: ƒ, leave: ƒ }
    if(!handler) return;

    // Object.entries ... handlerのプロパティと関数を、配列の配列として返す
    // console.log(Object.entries(handler)); // [['enter', ƒ], ['leave', ƒ]]
    Object.entries(handler).forEach(([ mouseType, action ]) => { // 分割代入。element, index, array が引数
      // console.log(mouseType, action); // enter アニメーションの関数

      // pointerenter → mouseenterの上位互換。タッチデバイスなどにも対応していて
      el.addEventListener(`pointer${mouseType}`, (event) => {
        action(mouse, event); // mouseオブジェクト event
      });
    });
  });
}

// ✅ targetの値を更新する処理 → mouse-animation.js で使用
function setTarget(_newTarget){
  // targetオブジェクト を _newTargetオブジェクトで上書き
  Object.assign(target, _newTarget); 
}

// stuck(張り付き)の時に位置情報を更新する
function startTrackMousePos(){
  mouse.shouldTrackMousePos = true;
}

// stuck(張り付き)の時に、位置情報の更新を停止させる
function stopTrackMousePos(){
  mouse.shouldTrackMousePos = false;
}


// ✅ マウス座標を更新
function _updatePosition({ clientX, clientY }) {
  // console.log(`x: ${clientX}px, y: ${clientY}ox`)
  target.x = clientX;
  target.y = clientY;

  mouse.tick++;
}

// ✅ 値の更新
function _updateValue(){ 
  // マウス座標を更新 → _updatePosition()で、targetにまず値が入り動きが生じていく流れ。
  //                 カーソルを動かす → target更新 → current更新 →マウス座標の更新 → ...            
  delta.x = target.x - current.x;
  delta.y = target.y - current.y;
  // console.log(`deltaX: ${delta.x}, deltaY: ${delta.y}`);
  delta.scale = target.scale - current.scale;
  delta.fillOpacity = target.fillOpacity - current.fillOpacity;

  current.x += delta.x * mouse.speed; // .2。speedをかけることで値の変化をなめらかに
  current.y += delta.y * mouse.speed;
  current.scale += delta.scale * mouse.speed;
  current.fillOpacity += delta.fillOpacity * mouse.speed;

  const distortion = { level: 500, max: .4 }

  // ✅ 円を歪ませる
  // Math.sqrt → ルート
  // pow(a, b) → aをb乗
  // → どれだけ動いたかで変化量を取得。
  // 　rafでレンダリングしているので、1fpsでどれだけ動いたかが取得できるので、
  //   マウスを動かす速さが速いほど、大きな値を取得できる
  let distort = Math.sqrt(Math.pow(delta.x, 2) + Math.pow(delta.y, 2)) / distortion.level;
  // console.log(distort);
  distort = Math.min(distort, distortion.max); // 歪みの上限値をつける。.4が限界

  current.scaleX = (1 + distort) * current.scale; // xは少し大きくなる。1.4が最大
  current.scaleY = (1 - distort) * current.scale; // yは少し小さくなる。.6までが最小

  // x, y軸方向に移動した時の角度を取得して回転させる
  // 通常のtan() → ラジアンを引数に取って、辺の比を返す
  // ✅ atan2 → アークタンジェント。tanの逆で、辺の長さの比からラジアンを返す
  // ✅ Math.atan2(y, x) は 2次元座標平面でのベクトルの向きを角度で表す ための関数
  // 回転角 → どの象限かを考慮して、-π から +π の範囲であり、-180度から +180度の範囲になって返ってくる
  //          y↑
  //           |
  //  第2象限   |   第1象限
  // (-x, +y)  |   (+x, +y)
  // ----------+------------→ x
  //  第3象限   |   第4象限
  // (-x, -y)  |   (+x, -y)
  //           |
  // ✅ svgの世界ではブラウザのビューポートと同じで下がプラス、上がマイナスとなる
  // 2Dグラフィックスでの角度の取り決め
  // → 0度: x軸の正の方向（右方向）
  //   90度: y軸の正の方向（下方向）
  //   180度: x軸の負の方向（左方向）
  //   -90度(または 270度): y軸の負の方向（上方向）
  // 注意: 時計回りがプラス、反時計回りがマイナス
  current.rotate = Math.atan2(delta.y, delta.x) * (180 / Math.PI); // 度数法に変換
  // current.rotate = 0; // 角度をつけない
  // console.log(current.rotate);
}

// ✅ カーソルのCSSを更新
function _updateStyle(){
  // console.log("_updateStyle running!!");

  $.innerCircle.setAttribute("cx", target.x); // innerにはtargetの値。常に追従なので
  $.innerCircle.setAttribute("cy", target.y);

  // 「SVGビューポート座標のどの点を基準にするか」 を完全に指定する
  // currentのx, yを基準の歪ませる targetの位置に映る前に歪ませる基準を作っておく
  // → svgのtransform-originの初期値はviewBoxの原点
  //   ここでは、カーソルの行き先　= カーソルの中心を基準に円をtransformさせる
  // center center では挙動がおかしくなる
  $.outerCircle.style.transformOrigin = `${current.x}px ${current.y}px`;
  $.outerCircle.setAttribute("cx", current.x);
  $.outerCircle.setAttribute("cy", current.y);
  $.outerCircle.setAttribute("fill-opacity", current.fillOpacity);

  const rotate = `rotate(${current.rotate}deg)`;
  const scale  = `scale(${current.scaleX}, ${current.scaleY})`;

  $.outerCircle.style.transform = `${rotate} ${scale}`;
}

// ✅　レンダー → bootstrap.jsのaddRenderActionに入れて更新
function render(){
  if(utils.isTouchDevices) return; // タッチデバイスなら処理を止める
  if(!mouse.applyStyle) return; // カスタムサークルをあてないならなら処理を止める
  if(!isUpdate()) return; // カーソルが動いていないなら処理を止める
  
  _updateValue(); // 値の更新
  _updateStyle(); // カーソルのCSS更新
}

// svgを生成する処理
function _createCustomCursor(){
  // DOMをreturnしたいので文字列をDOMに変換
  // <g></g> グループ化を行う。スタイルや変換(移動や拡大縮小など)を一括で適用できる
  return INode.htmlToEl(`
    <svg
      class="c-cursor"
      width="${viewport.width}"
      height="${viewport.height}"
      viewBox="0 0 ${viewport.width} ${viewport.height}"
      preserveAspectRatio="none meet"
    >
      <g class="c-cursor__group">
        <circle 
          class="c-cursor__circle-outer js-circle" 
          r="${current.r}" 
          cx="${current.x}" 
          cy="${current.y}" 
          fill="${current.fill}"
          fill-opacity="${current.fillOpacity}"
          stroke="${current.fill}"
          stroke-width="${current.strokeWidth}" 
          style="transform-origin: ${current.x}px ${current.y}px;"
        ></circle>
        <circle 
          class="c-cursor__circle-inner js-circle" 
          r="${3}" 
          cx="${current.x}" 
          cy="${current.y}" 
          fill="${current.fill}"
          style="transform-origin: ${current.x}px ${current.y}px;"
        ></circle>
      </g>
    </svg>
  `);
}

// ✅ クリップ座標の取得  -1 〜 1 で返す
function getClipPos() {
  return {
    x:   ( current.x / viewport.width  ) * 2 - 1,
    y: - ( current.y / viewport.height ) * 2 + 1,
  };
}

// 中央が0の座標を返す処理(-1〜1の範囲ではない実際の値)
function getMapPos(_width, _height){
  // console.log(_width, _height); // 256.8 187.6
  const clipPos = getClipPos(); // -1 〜 1
  // console.log(clipPos);

  return {
    x: clipPos.x * _width / 2,
    y: clipPos.y * _height / 2
  }
}

function addMousemoveActions(_callback){ // 追加
  mousemoveActions.add(_callback)
}

function removeMousemoveActions(_callback){ //　削除
  mousemoveActions.delete(_callback);
}

// ✅ リサイズ → bootstrap.jsでリサイズに関する処理をまとめて渡す。リサイズはworld.js
function resize(){
  if(!mouse.applyStyle) return; // タッチデバイスなら処理を止める

  $.svg.setAttribute("width", viewport.width);
  $.svg.setAttribute("height", viewport.height);
  $.svg.setAttribute("viewBox", `0 0 ${viewport.width} ${viewport.height}`);
}

// ✅ 初期表示時にカスタムカーソルを非表示
// 300ms毎に判定する
function makeVisible(){
  const intervalId = setInterval(() => {
    // console.log(intervalId)
    // タッチデバイス、もしくはsvgカスタムカーソルを挿入しない場合は処理を止める
    if(!mouse.applyStyle) return clearInterval(intervalId);

    // console.log(isUpdate());
    if(!isUpdate()) return; // カーソルが動いていないなら処理を止める
    // console.log("isUpdate done!!");

    // $.svg.style.opacity = 1;
    clearInterval(intervalId);
  }, 300);
}

// ✅ カーソルが動いているかどうかを判定
function isUpdate(){
  // x, yのどちらかが動いている場合はtrueを返す
  // → カーソル動きが止まっていればfalseを返す
  // console.log(current.x, target.x)

  // currentとtargetの値の差が0.0001以上の場合trueを返すように修正
  // console.log(1e-4); // 0.0001
  // console.log(Math.abs(current.x - target.x) > .001);
  return (
    Math.abs(current.x - target.x) > 1e-4 ||
    Math.abs(current.y - target.y) > 1e-4
  );
}

export default mouse;
