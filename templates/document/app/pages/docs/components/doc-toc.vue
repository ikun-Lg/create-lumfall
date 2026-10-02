<template>
  <div v-if="items.length" class="doc-toc">
    <div class="doc-toc-title">页面内容</div>
    <a
      v-for="item in items"
      :key="item.id"
      :href="`#${item.id}`"
      class="doc-toc-link"
      :class="[`level-${item.level}`, { active: item.id === activeId }]"
    >
      {{ item.text }}
    </a>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  activeId: { type: String, default: "" },
});
</script>
