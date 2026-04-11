
// link-c.js
// ⭐️ Web Components


// <link-c href="https://tympanus.net/codrops/?p=109206" target="_blank">TUTORIAL</link-c>
// <link-c href="https://tympanus.net/codrops/hub/" target="_blank">MORE DEMOS</link-c> 

// ✅ HTMLに埋め込み header-c.js
// <link-c href="/">Home</link-c>

// ✅ ブラウザでの表示
//<link-c href="/about">
//  <a href="/about" class="links items_anim" style="cursor: pointer;">
//    About
//    <div class="line_a">
//      <div class="c-link__line-inner" style="translate: none; rotate: none; scale: none; transform: translate(101%, 0px);"></div>
//    </div>
//  </a>
//</link-c>

import { gsap } from "../lib";


class Link extends HTMLElement {
  constructor() {
    super();
    this.handleClick = this.handleClick.bind(this);
    this.handleHoverIn = this.handleHoverIn.bind(this);
    this.handleHoverOut = this.handleHoverOut.bind(this);
  }

  // 要素がDOMに接続されたときに発火。customElements.define()後
  connectedCallback() {
    // console.log(this); // Link-cタグ
    this.render();

    if(this.link) { // link-c の内側に生成した、aタグ
      this.link.addEventListener("pointerdown", this.handleClick);
      this.link.addEventListener("pointerenter", this.handleHoverIn);
      this.link.addEventListener("pointerleave", this.handleHoverOut);
    }
  }

  disconnectedCallback() {
    if(this.link) {
      this.link.removeEventListener("pointerdown", this.handleClick);
      this.link.removeEventListener("pointerenter", this.handleHoverIn);
      this.link.removeEventListener("pointerleave", this.handleHoverOut);
    }
  }

  // ✅ クリックしたリンクが、今いるページと同じかどうかを判定
  isSamePage() {
    const href = this.link.getAttribute("href");
    // console.log(href); // /about
    const currentPath = window.location.pathname;
    // console.log(currentPath); // 遷移前のパス

    // ✅ パスの正規化
    //    → /about/ や about を /about にするなど
    const normalize = (path) => {
      let normalized = path
        .replace(/\/+/g, "/") // 👉 ///about → /about。前方のスラッシュが何個あっても1個にする
        .replace(/\/$/, "");  // 👉 /about/ → /about。 後方のスラッシュを削除 👉 これで / だけなら何もない状態になる
      // console.log(normalized); // 空白 /about

      // /で始まらない(=相対パス)、httpでもない(=外部URLでもない)
      // → 絶対パスを絶対化する
      if(!normalized.startsWith("/") && !normalized.startsWith("http")) {
        // console.log(normalized); // 👉 pathが / の場合にのみ入る

        // substring(開始位置(含む)、終了位置(含まない)) ... 指定した範囲を切り取り取得
        // lastIndexOf ... 文字列の「最後に出てくる / の位置」
        // lastIndexOf + 1 ... /も含めるため
        // console.log(currentPath); // /about
        const base = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);
        // console.log(base)
        normalized = base + normalized;
        // console.log(normalized);
      }

      normalized = normalized
        .replace(/\/index\.html$/, "")  // 👉 末尾が /index.html の場合、それを削除する
        .replace(/^index\.html$/, "/"); // 👉 文字列が完全に index.html の場合、/ にする。^: 先頭。$: 末尾

      // console.log(normalized);
      return normalized || "/";
    };

    const current = normalize(currentPath);
    const target = normalize(href);
    // console.log(current, target); // / /about

    if(current.startsWith("mail:to") || current.startsWith("https://")) return false;

    return current === target;
  }

  // ✅ pointerenter時
  handleHoverIn() {
    const line = this.querySelector(".c-link__line-inner");
    // console.log(line);
    if(!line) {
      this.link.style.cursor = "default";
      return;
    }

    // console.log(this.link.style.cursor);
    this.link.style.cursor = "pointer";
    gsap.set(line, { x: "-101%" }); // 初期位置にセット
    gsap.killTweensOf(line); // 既存アニメを停止 → setは対象外。to、from、timelineなどが対象
    gsap.to(line, { x: 0, duration: 0.8, ease: "power3.out" }); // 新しく開始
  }

  // pointerleave時
  handleHoverOut() {
    const line = this.querySelector(".c-link__line-inner");
    if(!line) return;

    gsap.killTweensOf(line);
    gsap.to(line, { x: "101%", duration: 0.5, ease: "power3.out" });
  }

  handleClick(e) {
    if(this.isSamePage()) {
      e.preventDefault();
    }
  }

  render(){
    // console.log(this); // <link-c href="/">Home</link-c>
    const href = this.getAttribute("href");
    const text = this.textContent.trim();
    const blank = this.getAttribute("target") || null;
    const rel = this.getAttribute("rel") || null;
    // console.log(rel); // null

    this.innerHTML = `
      <a href="${href}" ${rel ? `rel="${rel}"` : ""} ${blank ? `target="${blank}"` : ""} class="c-link items_anim">
        ${text}
        <span class="c-link__line">
          <span class="c-link__line-inner"></span>
        </span>
      </a>
    `;

    this.link = this.querySelector("a");
  }
}

// ブラウザにLinkクラスを認識させる・
customElements.define("c-link", Link);
