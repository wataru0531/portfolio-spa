
// vite.config.js

import { defineConfig } from "vite";
import { resolve } from "path";
import glslify from "rollup-plugin-glslify";

const root = "src"; // プロジェクトのルートをsrcにする。 
                    // → srcを起点にする。/index.jsで読み込める


export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  root,
  base: "/", // デプロイ後のベースURL
  publicDir: "../public", // 静的ファイル置き場
                          // → ビルドやJSの処理を一切受けず、そのまま配信されるファイル
                          // ../public → 現在のルート(src)から見て、publicが1つ上ということ
                          //             → viteはsrcの中をルートとしているので。
  plugins: [
    glslify({ // GLSLをロードして圧縮
      compress(code) {
        // Based on https://github.com/vwochnik/rollup-plugin-glsl
        // Modified to remove multiline comments. See #16
        let needNewline = false;
        return code
          .replace(/\\(?:\r\n|\n\r|\n|\r)|\/\*.*?\*\/|\/\/(?:\\(?:\r\n|\n\r|\n|\r)|[^\n\r])*/gs, "") // コメント削除
          .split(/\n+/) // 無駄な改行を削る
          .reduce((result, line) => {
            line = line.trim().replace(/\s{2,}|\t/, " "); // lgtm[js/incomplete-sanitization] → 余分なスペース削除
            if(line.charAt(0) === "#" || /else/.test(line)) {
              if(needNewline) {
                result.push("\n");
              }
              result.push(line, "\n");
              needNewline = false;
            } else {
              result.push(line.replace(/\s*({|}|=|\*|,|\+|\/|>|<|&|\||\[|\]|\(|\)|-|!|;)\s*/g, "$1")); // 演算子の空白削除
              needNewline = true;
            }
            return result;
          }, [])
          .join(process.env.NODE_ENV === "development" ? "\n" : "") // 開発時: 改行あり、 本番: 改行なし
          .replace(/\n+/g, "\n");
      },
    }),
  ],
  resolve: {
    alias: [
      // import { Inode } from "#/helper"; のように、
      // 「/scripts」を「#」に置き換えることができる
      {
        find: "#",
        replacement: "/scripts",
      },
    ],
  },
  build: {
    outDir: "../dist", // ビルド結果の出力先。ここではrootを基準にしている
    rollupOptions: {
      input: { // どのファイルからビルドを開始するか(エントリーポイント)
        index: resolve(root, "index.html") // ビルドの開始地点。src/index.html
      },
    },
  },
});
