
// header-c.js

class Header extends HTMLElement {
  constructor() {
    super(); // HTMLElementを継承
            // → カスタムHTMLはHTMLElementを継承 → HTML要素としての振る舞いをそのまま継承する
            //   Element → HTMLだけではなくSVGも含んでしまうから×
            //   Node → 抽象クラスに近く、HTML要素としての振る舞いがなくカスタム要素として登録できない
            // 　EventTarget → イベント機能だけ、DOM構造すら持たない
    this._rendered = false;
  }

  // 👉 要素がDOMに接続されたとき
  // customEase.define()後に発火)
  connectedCallback() {
    if(!this._rendered) {
      this.render();
      this._rendered = true;
    }
  }

  // この要素がDOMから外れた時に発火。
  // → removeされた時 element.remove()
  //   親要素ごと消えた時、parent.innerHTML = "";
  disconnectedCallback() {
    this._rendered = false;
  }

  // TODO ハンバーガーメニュー追加予定
  render() {
    this.innerHTML = `
    <header class="l-header p-header">
      <div class="p-header__inner">

        <nav class="p-header__global-nav p-global-nav">
          <ul class="p-global-nav__items">
            <li class="p-global-nav__item">
              <c-link href="/">Home</c-link>
            </li>
            <li class="p-global-nav__item">
              <c-link href="/about">About</c-link>
            </li>
            <li class="p-global-nav__item">
              <c-link href="https://wataru-code.com/watarudesign/" target="_blank">Wataru design</c-link>
            </li>
          </ul>

        </nav>

      </div>
    </header>
    `;
  }
}

// ⭐️ customElements.define()
// ① HTMLが読み込まれて、<header-c></header-c> を認識。この時点では単なるタグ
// ② JSが読み込まれて、ブラウザが <header-c> を自動でHeaderクラスと結びつける
//    → ブラウザに対して👇「header-c というタグがあったら、この Header クラスを使え」と登録している
// ③ connectedCallbackが発火 → render()で実行
// ブラウザが自動でnewしてくれる
customElements.define("c-header", Header);
