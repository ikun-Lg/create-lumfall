<template>
  <a-config-provider :locale="zhCN">
    <router-view />
  </a-config-provider>
</template>

<script setup>
import { onMounted } from "vue";
import zhCN from "@arco-design/web-vue/es/locale/lang/zh-cn";
import favicon from "./assets/docs-logo.svg";
import "./styles/vars.less";
import "./styles/docs.less";

onMounted(() => {
  // 框架通用模板没有 favicon 位，这里在运行时注入
  if (!document.querySelector('link[rel="icon"]')) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = favicon;
    document.head.appendChild(link);
  }
});
</script>
