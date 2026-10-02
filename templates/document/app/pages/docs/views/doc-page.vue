<template>
  <DocLayout :sidebar="true">
    <template v-if="source !== undefined">
      <div class="doc-content-wrap">
        <article class="doc-markdown" v-html="rendered.html"></article>

        <div class="doc-pager">
          <router-link v-if="prev" :to="prev.path" class="doc-pager-item prev">
            <span class="doc-pager-label">上一篇</span>
            <span class="doc-pager-title"><icon-left /> {{ prev.text }}</span>
          </router-link>
          <span v-else class="doc-pager-item placeholder"></span>

          <router-link v-if="next" :to="next.path" class="doc-pager-item next">
            <span class="doc-pager-label">下一篇</span>
            <span class="doc-pager-title">{{ next.text }} <icon-right /></span>
          </router-link>
        </div>

        <div v-if="footer.text" class="doc-content-footer">{{ footer.text }}</div>
      </div>

      <DocToc class="doc-toc-rail" :items="rendered.toc" :active-id="activeHeadingId" />
    </template>

    <div v-else class="doc-content-wrap">
      <div class="doc-not-found">
        <h1>404</h1>
        <p>没有找到文档：<code>/{{ docPath }}</code></p>
        <p>
          检查 docs/ 目录下是否存在对应的 markdown 文件，以及
          docs-config.js 的侧边栏路径是否正确。
        </p>
        <router-link to="/view/docs" class="doc-not-found-home">返回首页</router-link>
      </div>
    </div>
  </DocLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import DocLayout from "../components/doc-layout.vue";
import DocToc from "../components/doc-toc.vue";
import { renderMarkdown } from "../markdown/index";
import { getDocSource } from "../content";
import docsConfig from "../docs-config";
import { pathOfDoc } from "../utils";

const route = useRoute();

const docPath = computed(() => pathOfDoc(decodeURIComponent(route.params.path || "")));
const source = computed(() => getDocSource(docPath.value));
const rendered = computed(() =>
  source.value === undefined
    ? { html: "", toc: [] }
    : renderMarkdown(source.value, docPath.value)
);
const footer = docsConfig.footer;

const activeHeadingId = ref("");

// ---- 上一篇 / 下一篇：按侧边栏顺序 ----
const flatItems = docsConfig.sidebar.flatMap((group) =>
  (group.items || []).map((item) => ({
    text: item.text,
    path: item.path,
    docPath: pathOfDoc(item.path),
  }))
);

const currentIndex = computed(() =>
  flatItems.findIndex((item) => item.docPath === docPath.value)
);
const prev = computed(() =>
  currentIndex.value > 0 ? flatItems[currentIndex.value - 1] : null
);
const next = computed(() =>
  currentIndex.value >= 0 && currentIndex.value < flatItems.length - 1
    ? flatItems[currentIndex.value + 1]
    : null
);

// ---- 标题与描述 ----
watch(
  docPath,
  (path) => {
    const sidebarItem = flatItems.find((item) => item.docPath === path);
    document.title = sidebarItem
      ? `${sidebarItem.text} · ${docsConfig.site.title}`
      : docsConfig.site.description;
  },
  { immediate: true }
);

// ---- 路由变化：滚动到锚点或页首 ----
watch(
  docPath,
  () => {
    activeHeadingId.value = "";
    nextTick(() => {
      if (route.hash) {
        const el = document.getElementById(decodeURIComponent(route.hash.slice(1)));
        if (el) {
          el.scrollIntoView();
          return;
        }
      }
      window.scrollTo(0, 0);
    });
  },
  { immediate: true }
);

// ---- TOC 滚动联动（滚动监听当前所在小节）----
let ticking = false;

const updateActiveHeading = () => {
  ticking = false;
  const headings = document.querySelectorAll(
    ".doc-markdown h2[id], .doc-markdown h3[id]"
  );
  let current = "";
  headings.forEach((el) => {
    if (el.getBoundingClientRect().top <= 96) {
      current = el.id;
    }
  });
  activeHeadingId.value = current;
};

const onScroll = () => {
  if (!ticking) {
    ticking = true;
    window.requestAnimationFrame(updateActiveHeading);
  }
};

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  updateActiveHeading();
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
});
</script>
