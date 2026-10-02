<template>
  <aside class="doc-sidebar">
    <div v-for="group in sidebar" :key="group.text" class="doc-sidebar-group">
      <div class="doc-sidebar-group-title">{{ group.text }}</div>
      <router-link
        v-for="item in group.items"
        :key="item.path"
        :to="item.path"
        class="doc-sidebar-link"
        :class="{ active: isActive(item.path) }"
        @click="$emit('navigate')"
      >
        {{ item.text }}
      </router-link>
    </div>
  </aside>
</template>

<script setup>
import { useRoute } from "vue-router";
import docsConfig from "../docs-config";

defineEmits(["navigate"]);

const route = useRoute();
const sidebar = docsConfig.sidebar;

const isActive = (path) => route.path === path || route.path === `${path}/`;
</script>
