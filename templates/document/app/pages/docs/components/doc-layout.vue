<template>
  <div class="doc-shell">
    <DocNavbar
      :show-sidebar-toggle="sidebar"
      @toggle-sidebar="drawerOpen = !drawerOpen"
      @open-search="searchOpen = true"
    />

    <div class="doc-body" @click="handleBodyClick">
      <DocSidebar v-if="sidebar" class="doc-desktop-sidebar" />

      <!-- 移动端抽屉侧栏 -->
      <Transition name="doc-fade">
        <div v-if="sidebar && drawerOpen" class="doc-drawer-mask" @click.self="drawerOpen = false">
          <DocSidebar class="doc-drawer-sidebar" @navigate="drawerOpen = false" />
        </div>
      </Transition>

      <main class="doc-main">
        <slot />
      </main>
    </div>

    <DocSearch v-model="searchOpen" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DocNavbar from "./doc-navbar.vue";
import DocSidebar from "./doc-sidebar.vue";
import DocSearch from "./doc-search.vue";

defineProps({
  // 是否显示侧栏（首页不显示）
  sidebar: { type: Boolean, default: true },
});

const route = useRoute();
const router = useRouter();
const drawerOpen = ref(false);
const searchOpen = ref(false);

// 路由切换时收起移动端抽屉
watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false;
  }
);

// ---- 全局点击处理：复制代码 / 站内路由 / 锚点平滑滚动 ----
const copyText = (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text);
    return;
  }
  // 非安全上下文（http 部署）回退方案
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    // 忽略复制失败
  }
  document.body.removeChild(textarea);
};

const handleBodyClick = (e) => {
  // 1. 代码块复制按钮
  const copyBtn = e.target.closest(".doc-code-copy");
  if (copyBtn) {
    const block = copyBtn.closest(".doc-code-block");
    const pre = block && block.querySelector("pre");
    if (pre) {
      copyText(pre.textContent || "");
      copyBtn.textContent = "已复制";
      setTimeout(() => {
        copyBtn.textContent = "复制";
      }, 1500);
    }
    return;
  }

  // 2. 站内文档链接走 SPA 路由，避免整页刷新
  const link = e.target.closest("a");
  if (!link) {
    return;
  }
  const href = link.getAttribute("href") || "";

  if (href.startsWith("/view/docs")) {
    e.preventDefault();
    router.push(href);
    return;
  }

  // 3. 页内锚点：平滑滚动，滚动结束后再更新 URL。
  //    注意：带 fragment 的 history.replaceState 会取消 Chrome 正在进行的
  //    平滑滚动（无论先后调用），所以必须等 scrollend 之后再写 URL。
  if (href.startsWith("#") && href.length > 1) {
    const target = document.getElementById(decodeURIComponent(href.slice(1)));
    if (target) {
      e.preventDefault();
      let urlUpdated = false;
      const updateUrl = () => {
        if (urlUpdated) return;
        urlUpdated = true;
        history.replaceState(null, "", href);
      };
      target.scrollIntoView({ behavior: "smooth" });
      // 平滑滚动结束（scrollend 支持前用定时器兜底；目标已在视口内时不会滚动）
      window.addEventListener("scrollend", updateUrl, { once: true });
      setTimeout(updateUrl, 800);
    }
  }
};

// 全局快捷键：Ctrl/Cmd + K 或 / 唤起搜索（输入框内按 / 不触发）
const onGlobalKeydown = (e) => {
  const isCtrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
  const isSlash =
    e.key === "/" &&
    !["INPUT", "TEXTAREA"].includes(e.target.tagName) &&
    !e.target.isContentEditable;
  if (isCtrlK || isSlash) {
    e.preventDefault();
    searchOpen.value = true;
  }
};

onMounted(() => {
  window.addEventListener("keydown", onGlobalKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onGlobalKeydown);
});
</script>
