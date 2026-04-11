
// router.js
// → ルーティング
// ① pushState
//    → ・アドレスバーを書き換える（リロードなし）
//      ・履歴スタックに積む（戻る・進むが効く）
//      ・popstateイベント時に取り出せるstateを保存できる
// ② popstate 
//    → ブラウザの進む、戻るボタン時に発火。

import { executeTransition } from "./transitions/pageTransition.js";
import { updateMetaTags } from "./seo/metadata.js";

const routes = {
  "/": {
    namespace: "home",
    loader: () => import("./pages/home/home.js"),
  },
  "/about": {
    namespace: "about",
    loader: () => import("./pages/about/about.js"),
  },
};

// ✅ Router
class Router {
  constructor() {
    this.currentPage = null;
    this.currentNamespace = null;
    this.isTransitioning = false;
  }

  // 初期化
  async init() {
    await this.loadInitialPage();

    // console.log(document); // <html>を含むDOM全体の管理オブジェクト
    document.addEventListener("click", (e) => {
      // ⭐️ closest() ... 要素を親へ「探しに行く処理」。
      //                  自分 or 親要素を上にたどって、最初に見つかる <a> を返す
      // リンクじゃない場所をクリック → たどっても<a>がない → link = null
      const link = e.target.closest("a");
      // console.log(link); 

      // linkがnullの時、オリジンが違う時(=このサイト外部)い飛ぶ時は処理を終わらす。SPAの対象外
      // console.log(window.location.origin); // originのこと。http://localhost:3000
      if(!link || !link.href.startsWith(window.location.origin)) return;

      e.preventDefault(); // ページ遷移を止める
      if(this.isTransitioning) return;

      // new URL → URLを分解・操作するための組み込みクラス
      // console.log(link.href); // http://localhost:3000/about
      // console.log(new URL(link.href));
      // → URL {origin: 'http://localhost:3000', protocol: 'http:', username: '', password: '', host: 'localhost:3000', pathname; "/about", ...}
      const path = new URL(link.href).pathname; // 遷移先のページ。"/about", /
      this.navigate(path); // pushState発火
    });

    // ⭐️ ブラウザの進む、戻る
    window.addEventListener("popstate", () => {
      if (!this.isTransitioning) {
        this.performTransition(window.location.pathname); // 遷移先のページ読み込み
      }
    });
  }

  // ✅ 初期表示のページを読み込む。
  // → 初期ページの読み込みに特化。次の遷移からはperformTransitionでロードしていく
  async loadInitialPage() {
    const path = window.location.pathname; // 現在のパスを取得
    // console.log(path); // /about
    const route = routes[path] || routes["/"];
    // console.log(route); // { namespace: 'about', loader: ƒ }

    updateMetaTags(route.namespace); // ✅ metaデータの更新

    // ⭐️ デフォルトエクスポート、名前付きエクスポートの関数などを取得
    const pageModule = await route.loader(); // import。非同期
    // console.log(pageModule); // Module {Symbol(Symbol.toStringTag): 'Module', cleanup: ƒ, default: ƒ, init: ƒ}
    // console.log(pageModule.default()); // 👉 読み込んだ文字列のhtmlを取得
    const content = document.getElementById("js-main"); 
    content.innerHTML = pageModule.default(); // 👉 export default HomePage()から取得

    const container = document.querySelector('[data-transition="container"]');
    container.setAttribute("data-namespace", route.namespace);

    if(pageModule.init) {
      pageModule.init({ container }); // 👉 アニメーション
    }

    this.currentPage = pageModule;
    this.currentNamespace = route.namespace; // home about
  }

  // ✅　pushState (履歴を積む)。
  // 履歴を積むことに特化
  async navigate(path) {
    // console.log(path); // "/about", /
    if(this.isTransitioning) return;
    if(window.location.pathname === path) return; // 同じパスなら処理終了

    // ⭐️ history.pushState(state, title, url);
    //    ① state → 履歴に紐づけるデータ。popstate(戻る、進む)イベントにデータを渡せる
    //    ② title → 無視されるので""でOK。
    //    ③ url → アドレスバーに表示されるパス
    //             リロードされない
    window.history.pushState({}, "", path);
    await this.performTransition(path); // 
  }

  // ✅ 遷移先のページをロード
  // ページのロードに特化
  // → 進む/戻る、pushStateでページが切り替わるタイミングでは必ず発火
  async performTransition(path) {
    if(this.isTransitioning) return;
    this.isTransitioning = true;

    try {
      const route = routes[path]; // 遷移先のルートオブジェクト
      // console.log(route); // {namespace: 'about', loader: ƒ}
      if(!route || this.currentNamespace === route.namespace) return;

      // GSAPで付与したアニメーションなどを削除
      if(this.currentPage?.cleanup) {
        this.currentPage.cleanup(); // 遷移前のページ
      }

      // Metaデータの更新
      updateMetaTags(route.namespace);

       // 遷移先ページのデータを取得
      const pageModule = await route.loader();
      // console.log(pageModule);

      // ⭐️ 遷移先のページを生成、ページ遷移アニメーション実行
      await executeTransition({
        currentNamespace: this.currentNamespace,
        nextNamespace: route.namespace,
        nextHTML: pageModule.default(),
        nextModule: pageModule,
      });

      this.currentPage = pageModule;
      this.currentNamespace = route.namespace;
    } finally {
      this.isTransitioning = false;
    }
  }
}

export const router = new Router();
