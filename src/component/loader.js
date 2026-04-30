/**************************************************************

✅ loadAllAssets ... 画像のキャッシュを生成 
→ /img/slider/slider_1.jpg' => Texture

✅ getTexByElement ... キャッシュから画像を取得
→ "tex1" => Texture　この形で取得


✅　カウントアップと、SVGアニメーションを分けるかどうか

***************************************************************/
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(SplitText, CustomEase);

CustomEase.create("hop", "0.9, 0, 0.1, 1");
CustomEase.create("glide", "0.8, 0, 0.2, 1");

import { LinearFilter, TextureLoader, VideoTexture } from "three";
import { INode } from "../helper";
import mouse from "./mouse";

const texLoader = new TextureLoader();

// テクスチャのキャッシュを管理するためのデータ構造
// → loadAllAssets、getTexByElementによって別ファイルでも更新可能
const textureCache = new Map();
// console.log(textureCache); // 0: {"/img/slider/slider_1.jpg" => Texture}

// loader.jsファイルがimportで読み込まれた時点で、関数以外のトップレベルのコードは実行される
window.textureCache = textureCache; 

const loader = {
  init,
  loadAllAssets,
  getTexByElement,
  loadImg,
  loadVideo,
  addProgressAction,
  letsBegin,
  isLoaded: false,
  addLoadingAnimation,
};

const $ = {}; // DOM要素

async function init() {
  $.globalContainer = INode.getElement("#js-global-container");
  $.countup = INode.getElement("#js-countup"); // カウントアップ
}

// ✅ 全てのURLを取得して、url => テクスチャ の状態でtextureCacheに格納
async function loadAllAssets() {
  const els = INode.qsAll("[data-webgl]");
  // console.log(els); 

  for(const el of els) {
    // console.log(el); // htmlのタグ

    const data = el.dataset; // data-〜 の 〜 と 値を取得
    // console.log(data); // DOMStringMap {webgl: 'particles', tex-1: '/img/diverse_image_2.jpeg', mouse: 'highlight', mouseScale: '3'}

    for(let key in data) {
      if (!key.startsWith("tex")) continue; // texから始まらないループは終了
      const url = data[key];
      // console.log(url); // /img/diverse_image_2.jpeg

      // 既に格納してあるURL以外は格納しない
      if(!textureCache.has(url)) {
        // 必要なURLをセットすればいいだけなので、ここでは第２引数はnullとする。ただ設定しているだけ
        textureCache.set(url, null);
        // console.log(textureCache); // 0: {"/img/slider/slider_1.jpg" => null}
      }
    }
  }
  // console.log(textureCache); // Map(4) {'/img/slider/slider_1.jpg' => null, '/img/slider/slider_2.jpg' => null, '/img/slider/slider_5.jpg' => null, '/img/disps/3.png' => null}
  // ここまでは url = null の状態

  const texPrms = []; // プロミスオブジェクトの配列

  // url => Texture の形でtextureCacheに格納
  textureCache.forEach((_, url) => { // value, index → null, 画像のパス
    // console.log(_, url); // null '/img/diverse_image_2.jpeg'

    let prms = null; // thenのコールバックで解決されたらプロミスオブジェクトが返り格納される

    // 画像 / 動画をロード
    const loadFn = /\.(mp4|webm|mov)$/.test(url) ? loadVideo : loadImg;

    // ここでは、loadFnの処理の始まりからtextureCacheの処理が終わるまでの一連の流れが終わるまでのプロミスが返される
    prms = loadFn(url).then((tex) => { // tex → Promiseの解決値
      textureCache.set(url, tex); // thenの戻り値はreturnしなくても必ずPromiseオブジェクト
      // console.log(textureCache) // 0: {"/img/slider/slider_1.jpg" => Texture}

    }).catch(() => {
      console.error("Media Download Error", url);
    });

    texPrms.push(prms);
  });
  // console.log(texPrms) // プロミスオブジェクトの配列
  // console.log(textureCache)

  await Promise.all(texPrms);
  // console.log(textureCache); // Map(4) {'/img/slider/slider_1.jpg' => Texture, '/img/slider/slider_2.jpg' => Texture, '/img/slider/slider_5.jpg' => Texture, '/img/disps/3.png' => Texture}
}

// ✅ キャッシュから取得したテクスチャを要素それぞれに返す処理
// また、img要素・video要素がelに渡ってきた場合は、完全に読み込んでから、
async function getTexByElement(el) {
  // console.log(el); // htmlのタグ
  const texes = new Map(); // tex1 => Texture で格納
  // console.log(texes) // 0: {"tex1" => Texture} 1: {"tex2" => Texture}

  const data = el.dataset; // data- 以外の部分を含むオブジェクトを返す
  // console.log(data) // DOMStringMap {webgl: '', tex-1: '/img/slider/slider_1.jpg', tex-2: '/img/slider/slider_2.jpg'}

  let mediaLoaded = null; // プロミスを格納

  // ループを１回に制御(HTML要素の最初の画像の高ささえ取得できればいいので)
  let first = true;

  for (let key in data) {
    // console.log(key) // webgl tex-1 tex-2
    if (!key.startsWith("tex")) continue; // tex以外の属性はループを抜ける

    const url = data[key]; // url取得
    // data ... DOMStringMap { tex-1: '/img/slider/slider_1.jpg', tex-2: '/img/slider/slider_2.jpg'}
    // console.log(url) // /img/slider/slider_1.jpg

    // console.log(textureCache); 
    const tex = textureCache.get(url);  // テクスチャを取得
    // console.log(tex)

    // keyのハイフンを削除して、{ tex1 => Texture } の形でマップに格納
    // console.log(key)
    key = key.replace("-", "");
    texes.set(key, tex);
    // console.log(texes) // 0: {"tex1" => Texture}

    // Promiseオブジェクトが返されて、el.srcでロード開始。
    // srcでロードは開始されているが、後から、await MediaLoadedでresolve()が発火して完全にロードが完了するまでは次の処理に進めない
    // 画像のロード
    if(first && el instanceof HTMLImageElement) {
      mediaLoaded = new Promise((resolve) => {
        el.onload = () => { // onload → 画像が完全に読み込まれた時点でコールバックが発火
          resolve(); // resolveが発火すると次の処理へ
        };
      });
      el.src = url; // el.srcのsrc → サーバーに対してリクエストを自動に発行し読み込み開始。これも非同期
      first = false; // HTML要素の2つ目以降の画像のループには入らないように
    }

    // videoのロード
    if(first && el instanceof HTMLVideoElement) {
      mediaLoaded = new Promise((resolve) => {
        // onloadeddata → 動画の1フレーム目が読み込まれたらコールバック発火
        //                動画が完全に読み込まれたわけではなく、再生できる状態(最初のフレームが表示できる状態)になったことを示します。
        el.onloadeddata = () => {
          resolve();
        };
      });

      el.src = url;
      el.load(); // 動画のロードが開始。ブラウザによっては動かない可能性がるので念のために設定
      first = false;
    }
  }
  // console.log(mediaLoaded)

  await mediaLoaded;

  // console.log(texes)
  return texes;
}


// ✅ 画像ロード
let total = 0; // loadImg、loadVideo
let progress = 0; // loadImg、loadVideoがPromise.allで解決したら+1
let _progressAction = null; // コールバック関数を格納する関数

async function loadImg(url) {
  incrementTotal(); // 読み込み対象の合計値(分母)に +１

  try {
    const tex = await texLoader.loadAsync(url);
    // console.log(tex) // Texture {isTexture: true, uuid: 'a03c7dcc-a2d0-426e-b25a-0dbbc9f80ab1', name: '', source: Source, mipmaps: Array(0), …}
    // レティナディスプレイなどの解像度の高い時にどのように色を取得するか
    // LinearFilter...隣のテクスチャの中間値を取得
    tex.magFilter = LinearFilter;
    tex.minFilter = LinearFilter;
    tex.needsUpdate = false; // テクスチャのアップデート

    // console.log(tex); // Texture {isTexture: true, uuid: '5af63e21-a0d0-4ed7-a6c5-3b25ca0a8397', name: '', source: Source, mipmaps: Array(0), …}
    return tex; // → プロミスでラップされる
  } catch(e){
    throw new Error;
  } finally { // 必ず実行される
    incrementProgress(); // 読み込みが完了した時(分子) + 1
  }
}

// 動画ロード
// 前半の記述 → urlに紐づいた動画が再生可能かどうかを判定するためだけの記述
// 後半のPromiseの記述 → 動画の読み込みが完了するまで待機し、動画が再生可能になった時点でPromiseを解決する記述
async function loadVideo(url) {
  const video = INode.htmlToEl("<video></video>");
  // console.log(video)

  // split(".") ... ドットを境に分割した文字列を配列として取得
  // pop()      ... 末尾の要素を取得
  // console.log(url.split("."))
  let extension = url.split(".").pop();
  // console.log(extension);

   // 拡張子がmovの場合は、quicktimeに変更
   // → movはQuickTimeフォーマットで保存された動画ファイル
   //   ブラウザやその他のメディアプレイヤーで再生する際に、適切に認識されないことがある。
   //   拡張子をquicktimeに変更することで、ブラウザにこの動画がQuickTimeフォーマットであることを明示し、
   //   再生互換性を向上させる
  if (extension === "mov") extension = "quicktime";
  // console.log(extension)

  // 再生不可の時はnullを返す
  // 再生可能の場合 → "maybe"、"probably" が返ってくる
  // 再生不可の場合 →　"" 空文字が返ってくる
  // → !"" ... true になる
  if (!video.canPlayType(`video/${extension}`)) return null;

  incrementTotal(); // 合計値に+1

  // Promiseで非同期処理
  return new Promise((resolve, reject) => {
    // 画像テクスチャと違い、videoタグを生成してからVideoTextureに渡す必要がある
    // <video>要素を使用して動画をロードし、再生状態を保持しておく

    const video = INode.htmlToEl(`
      <video
        autoplay
        loop
        muted         // 音量を出さない
        playsInline   // 動画がフルスクリーンにならないように調整
        defaultMuted  // デフォルトの初期状態のミュート状態(safariで必要な場合がある)
      ></video>
    `);

    // oncanplay →  video.srcで動画がロードされ、再生可能になったら発火
    video.oncanplay = () => {
      const tex = new VideoTexture(video); // 生成したvideoをテクスチャに変換。このためにvideoを生成しておく
      // console.log(tex)
      incrementProgress(); // 読み込みが完了した分をプラス1

      // LinearFilter ... 補間によってなめらかに表示させる
      tex.magFilter = LinearFilter; // テクスチャが拡大されるとき(テクスチャのピクセルがスクリーンのピクセルより少ない場合)に適用されるフィルタ
      tex.minFilter = LinearFilter; // ピクセル間の色を補間し、滑らかに表示。これにより、拡大時のジャギー(ギザギザ)が軽減され、ぼやけた感じに表示される。

      video.play(); // 読み込んだ後にビデオの再生
      video.oncanplay = null; // 2度動画が初期化されるのを防止

      resolve(tex); // videのテクスチャを返す
    };

    video.onerror = () => { // エラーが発生した場合。iPhoneでロードが完了しない問題
      incrementProgress(); // 読み込みエラーでも読み込んだ値に+1
      reject();
    }

    video.src = url; // srcでロードが始まる → ロードの完了でoncanplayに渡したコールバックが発火
  });
}

// 分母 +1
function incrementTotal() { 
  total++;
}

// 分子 +1。画面を更新
function incrementProgress() {
  progress++;

  if(_progressAction) {
    _progressAction(progress, total); // 数値のカウントアップ
  }
  // → incrementProgressが発火するたびに、loaderPercent.innerHTMLが呼ばれてdomが更新される
  // console.log(progress, total);
}

// ✅ カウントアップのアニメーションのコールバックを渡す
function addProgressAction(_callback) {
  _progressAction = _callback;
}

// ✅ ローディングスタート時のアニメーション
function _loadingAnimationStart() {
  const tl = gsap.timeline();

  // ////////////////////////////////////////////////////////////////////
  // ① ⭐️ カウントアップに関するアニメーション
  ///////////////////////////////////////////////////////////////////////
  tl.to($.countup.firstElementChild, {
    // $.countup.firstElementChild ... .c-countup__inner
    // opacity: 0,
    // y: -10,
    y: "-100%",
    duration: .3,
    delay: 0.8, 
  })
    // .set($.globalContainer, {
    //   visibility: "visible",
    // })
    // .set($.countup, {
    //   display: "none",
    // });

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
    const introTl = gsap.timeline({ delay: 1 });
    introTl
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
      introTl.to(svgProgress, { // 白circle
        // strokeDashoffset → 右側にどれだけ押し込んでいるか
        strokeDashoffset: svgPathLength - (svgPathLength * stop),
        duration: 0.75,
        ease: "glide",
        delay: idx === 0 ? 0.3 : 0.3 + (Math.random() * 0.2), // 0.3 + 0から0.02の範囲で差を付ける
      })
    });

    introTl
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
    });

    // ✅ 中央のコンテナクリック
    svgProgress.addEventListener("pointerdown", () => { 
      if(!preloaderComplete) return;

      preloaderComplete = false;

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
      // .to(".preloader-revealer", { // heroの中のrevealer
      //   clipPath: "polygon(0% 0%, 100% 0% , 100% 0%, 0% 0%)",
      //   duration: 1.5,
      //   ease: "hop",
      //   onComplete: () => {
      //     gsap.set(".preloader", { display: "none" })
      //   }
      // }, "-=1.45")
      // .to(".hero", {
      //   scale: 1,
      //   duration: 1.25,
      //   ease: "hop",
      // })
      // .to(".hero h1 .word", {
      //   y: "0%",
      //   duration: 1,
      //   ease: "glide",
      //   stagger: {
      //     each: 0.05,
      //   }
      // }, "-=1.75")
      .to("#js-loader", { // .p-loaderのこと
        display: "none",
      })

      // ⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから
      // ⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから⭐️ここから
      // → svg Bulgeの処理
      //   初期化のためのCSSを当てる
      //   使うDOMを取得しておく

    })

  return tl;
}

// ✅ ローディングアニメーションが終わってから実行される関数
async function _loadingAnimationEnd(_tl){
  // console.log("running");

  // これらのopacityを徐々に上げていく
  const globalContainer = INode.qs("#js-global-container");
  // console.log(globalContainer);
  return new Promise(resolve => {
    _tl.to(globalContainer, {
      opacity: 1,
      visibility: "visible",
      duration: 1,
      onComplete: () => {
        loader.isLoaded = true;
        resolve();
      }
    })
  })

  // ✅ preloaderが終わった後の処理

}

let loadingAnimation = null;

function addLoadingAnimation(_loadingAnimation){
  loadingAnimation = _loadingAnimation;
}

async function letsBegin() { // ローディングアニメーションを発火させるための関数
  const tl = _loadingAnimationStart(); // ローディング開始

  // ローディング中のアニメーションを実行
  loadingAnimation && loadingAnimation(tl);

  // ローシングアニメーションが終わった時に実装
  return await _loadingAnimationEnd(tl);
}


export default loader;
