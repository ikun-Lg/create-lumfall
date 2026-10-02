// highlight.js 按需注册：只打包文档站实际用到的语言，控制 vendor 体积。
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import less from "highlight.js/lib/languages/less";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import yaml from "highlight.js/lib/languages/yaml";
import markdown from "highlight.js/lib/languages/markdown";
import plaintext from "highlight.js/lib/languages/plaintext";

[
  ["javascript", javascript],
  ["typescript", typescript],
  ["xml", xml],
  ["css", css],
  ["less", less],
  ["json", json],
  ["bash", bash],
  ["yaml", yaml],
  ["markdown", markdown],
  ["plaintext", plaintext],
].forEach(([name, language]) => hljs.registerLanguage(name, language));

// highlight.js 11 不内置 vue 语法，用 xml 规则近似高亮 .vue / 模板块
hljs.registerAliases(["vue", "html"], { languageName: "xml" });

export default hljs;
