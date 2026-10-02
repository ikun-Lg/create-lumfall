<template>
  <Teleport to="body">
    <Transition name="doc-fade">
      <div v-if="modelValue" class="doc-search-mask" @click.self="close">
        <div class="doc-search-panel">
          <div class="doc-search-input-row">
            <icon-search class="doc-search-icon" />
            <input
              ref="inputRef"
              v-model="keyword"
              class="doc-search-input"
              type="text"
              placeholder="搜索文档，如：配置 / 路由 / 插件"
              @keydown="onKeydown"
            />
            <kbd class="doc-search-kbd">ESC</kbd>
          </div>

          <div class="doc-search-results">
            <template v-if="keyword.trim()">
              <div v-if="!results.length" class="doc-search-empty">
                没有找到与「{{ keyword }}」相关的内容
              </div>
              <a
                v-for="(item, i) in results"
                :key="`${item.docPath}-${item.anchor}-${i}`"
                class="doc-search-item"
                :class="{ active: i === activeIndex }"
                @click="go(item)"
                @mouseenter="activeIndex = i"
              >
                <div class="doc-search-item-title" v-html="item.titleHtml"></div>
                <div v-if="item.heading" class="doc-search-item-heading">
                  <icon-right /> {{ item.heading }}
                </div>
                <div
                  v-if="item.snippet"
                  class="doc-search-item-snippet"
                  v-html="item.snippet"
                ></div>
              </a>
            </template>
            <div v-else class="doc-search-empty">
              输入关键词开始搜索，支持标题与正文匹配
            </div>
          </div>

          <div class="doc-search-footer">
            <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
            <span><kbd>Enter</kbd> 打开</span>
            <span><kbd>ESC</kbd> 关闭</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";
import docsConfig from "../docs-config";
import { searchDocs } from "../search";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const router = useRouter();
const keyword = ref("");
const activeIndex = ref(0);
const inputRef = ref(null);

const results = computed(() => {
  const list = searchDocs(keyword.value, docsConfig);
  if (activeIndex.value >= list.length) {
    activeIndex.value = 0;
  }
  return list;
});

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      keyword.value = "";
      activeIndex.value = 0;
      nextTick(() => inputRef.value && inputRef.value.focus());
    }
  }
);

watch(keyword, () => {
  activeIndex.value = 0;
});

const close = () => emit("update:modelValue", false);

const go = (item) => {
  close();
  const path = `/view/docs/${item.docPath}`;
  if (item.anchor) {
    router.push({ path, hash: `#${item.anchor}` });
  } else {
    router.push(path);
  }
};

const onKeydown = (e) => {
  if (e.key === "Escape") {
    close();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex.value = (activeIndex.value + 1) % Math.max(results.value.length, 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex.value =
      (activeIndex.value - 1 + results.value.length) %
      Math.max(results.value.length, 1);
  } else if (e.key === "Enter") {
    const item = results.value[activeIndex.value];
    if (item) {
      go(item);
    }
  }
};

// 暴露给全局快捷键：layout 或页面可通过 ref 调 open()（本模板用 v-model 控制即可）
defineExpose({ close });
</script>
