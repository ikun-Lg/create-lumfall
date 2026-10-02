<template>
  <main class="home-page">
    <section class="hero">
      <h1 class="hero-title">Lumfall Basic Project</h1>
      <p class="hero-desc">
        基于 lumfall 的基础业务项目骨架。这个页面演示了：页面入口约定、
        $lumfallCurl 调用 /api 接口、参数校验与统一响应结构。
      </p>
      <div class="hero-links">
        <a-button type="primary" @click="goHealth">健康检查页</a-button>
        <a-button @click="loadData">刷新数据</a-button>
      </div>
    </section>

    <a-card class="panel" title="服务端配置（GET /api/demo/info）">
      <a-descriptions :column="1" size="medium" v-if="info">
        <a-descriptions-item label="应用名">{{ info.appName }}</a-descriptions-item>
        <a-descriptions-item label="demoMessage">
          <a-tag color="arcoblue">{{ info.demoMessage }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="服务端时间">{{ info.serverTime }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card class="panel" title="笔记列表（GET /api/demo/note/list）">
      <template #extra>
        <a-space>
          <a-input-search
            v-model="newNote"
            placeholder="输入内容，回车新建笔记"
            style="width: 260px"
            @search="handleCreate"
            allow-clear
          />
        </a-space>
      </template>

      <a-table
        :data="noteList"
        :loading="loading"
        :pagination="pagination"
        size="medium"
      >
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="80" />
          <a-table-column title="内容" data-index="content" />
          <a-table-column title="创建时间" data-index="createdAt" :width="200" />
        </template>
      </a-table>
    </a-card>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { Message } from "@arco-design/web-vue";
import $curl from "$lumfallCurl";

const info = ref(null);
const noteList = ref([]);
const loading = ref(false);
const newNote = ref("");
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const pagination = computed(() => ({
  total: total.value,
  current: currentPage.value,
  pageSize: pageSize.value,
  showTotal: true,
}));

async function loadInfo() {
  const res = await $curl({ method: "get", url: "/api/demo/info" });
  if (res && res.success) {
    info.value = res.data;
  }
}

async function loadNoteList() {
  loading.value = true;
  const res = await $curl({
    method: "get",
    url: "/api/demo/note/list",
    query: {
      page: String(currentPage.value),
      pageSize: String(pageSize.value),
    },
  });
  loading.value = false;
  if (res && res.success) {
    noteList.value = res.data;
    total.value = res.metadata.total;
  }
}

async function handleCreate() {
  const content = newNote.value.trim();
  if (!content) {
    Message.warning("请输入笔记内容");
    return;
  }

  const res = await $curl({
    method: "post",
    url: "/api/demo/note",
    data: { content },
  });
  if (res && res.success) {
    newNote.value = "";
    Message.success("创建成功");
    currentPage.value = 1;
    await loadNoteList();
  }
}

function loadData() {
  loadInfo();
  loadNoteList();
}

function goHealth() {
  window.location.href = "/view/health";
}

onMounted(loadData);
</script>

<style lang="less" scoped>
.home-page {
  box-sizing: border-box;
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 24px 64px;

  .hero {
    margin-bottom: 32px;

    .hero-title {
      margin: 0 0 12px;
      font-size: 32px;
      font-weight: 700;
      color: var(--color-text-1);
    }

    .hero-desc {
      margin: 0 0 20px;
      font-size: 15px;
      line-height: 1.8;
      color: var(--color-text-2);
    }

    .hero-links {
      display: flex;
      gap: 12px;
    }
  }

  .panel {
    margin-bottom: 20px;
  }
}
</style>
