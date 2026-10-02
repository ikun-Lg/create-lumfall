<template>
  <DocLayout :sidebar="false">
    <div class="doc-home">
      <section class="doc-hero">
        <h1 class="doc-hero-name">{{ hero.name }}</h1>
        <p class="doc-hero-tagline">{{ hero.tagline }}</p>
        <p class="doc-hero-text">{{ hero.text }}</p>
        <div class="doc-hero-actions">
          <template v-for="action in hero.actions" :key="action.text">
            <router-link
              v-if="action.path"
              :to="action.path"
              class="doc-hero-btn"
              :class="action.theme || ''"
            >
              {{ action.text }}
            </router-link>
            <a
              v-else
              :href="action.link"
              target="_blank"
              rel="noopener noreferrer"
              class="doc-hero-btn"
              :class="action.theme || ''"
            >
              {{ action.text }}
            </a>
          </template>
        </div>
      </section>

      <section class="doc-features">
        <div v-for="feature in hero.features" :key="feature.title" class="doc-feature-card">
          <div class="doc-feature-icon">{{ feature.icon }}</div>
          <h3 class="doc-feature-title">{{ feature.title }}</h3>
          <p class="doc-feature-details">{{ feature.details }}</p>
        </div>
      </section>

      <footer v-if="footerText" class="doc-home-footer">{{ footerText }}</footer>
    </div>
  </DocLayout>
</template>

<script setup>
import { computed } from "vue";
import DocLayout from "../components/doc-layout.vue";
import docsConfig from "../docs-config";

const hero = docsConfig.hero;
const footerText = computed(
  () => docsConfig.footer.text || docsConfig.footer.copyright || ""
);

document.title = docsConfig.site.description;
</script>
