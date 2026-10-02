<template>
  <header class="doc-navbar">
    <div class="doc-navbar-left">
      <button
        v-if="showSidebarToggle"
        class="doc-navbar-burger"
        type="button"
        aria-label="打开目录"
        @click="$emit('toggle-sidebar')"
      >
        <icon-menu />
      </button>

      <router-link class="doc-navbar-brand" to="/view/docs">
        <img class="doc-navbar-logo" :src="logo" alt="logo" />
        <span class="doc-navbar-title">{{ site.title }}</span>
      </router-link>

      <nav class="doc-navbar-nav">
        <template v-for="item in nav" :key="item.text">
          <router-link
            v-if="item.path"
            :to="item.path"
            class="doc-navbar-link"
            :class="{ active: isActive(item) }"
          >
            {{ item.text }}
          </router-link>
          <a
            v-else
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
            class="doc-navbar-link"
          >
            {{ item.text }}
          </a>
        </template>
      </nav>
    </div>

    <div class="doc-navbar-right">
      <button class="doc-search-trigger" type="button" @click="$emit('open-search')">
        <icon-search />
        <span class="doc-search-trigger-text">搜索文档</span>
        <kbd>Ctrl K</kbd>
      </button>

      <button
        class="doc-icon-btn"
        type="button"
        :aria-label="isDark ? '切换到亮色' : '切换到暗色'"
        @click="handleToggleTheme"
      >
        <icon-sun-fill v-if="isDark" />
        <icon-moon-fill v-else />
      </button>

      <a
        v-if="site.repo"
        class="doc-icon-btn"
        :href="site.repo"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub 仓库"
      >
        <icon-github />
      </a>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import docsConfig from "../docs-config";
import { toggleTheme } from "../theme";
import logo from "../assets/docs-logo.svg";

defineProps({
  showSidebarToggle: { type: Boolean, default: false },
});

defineEmits(["toggle-sidebar", "open-search"]);

const route = useRoute();
const site = docsConfig.site;
const nav = docsConfig.nav;
const isDark = ref(document.body.getAttribute("arco-theme") === "dark");

const handleToggleTheme = () => {
  isDark.value = toggleTheme() === "dark";
};

// 导航高亮：按 path 的前三级（/view/docs/<section>）匹配当前路由
const isActive = (item) => {
  if (!item.path) {
    return false;
  }
  const section = item.path.split("/").slice(0, 4).join("/");
  return route.path === section || route.path.startsWith(`${section}/`);
};
</script>
