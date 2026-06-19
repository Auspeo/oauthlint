<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';
import ScanDemo from './ScanDemo.vue';

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #home-hero-image>
      <ScanDemo />
    </template>
  </Layout>
</template>
