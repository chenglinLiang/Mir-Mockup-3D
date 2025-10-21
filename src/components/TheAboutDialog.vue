<template>
  <button class="btn btn-circle" onclick="aboutModal.showModal()">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="size-6"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
      />
    </svg>
  </button>
  <dialog id="aboutModal" class="modal">
    <div class="modal-box">
      <h3 class="text-lg font-bold mb-5">{{ t('dialogs.about.title') }}</h3>
      <p class="mb-5">
        <strong>{{ t('dialogs.about.details.developer.label') }}</strong>
        Julien Da costa
      </p>
      <small class="opacity-80">
        {{ t('dialogs.about.text') }}
        <a href="https://julien-dacosta.dev" class="underline">https://julien-dacosta.dev</a>
      </small>
      <div class="modal-action">
        <form method="dialog">
          <button class="btn">{{ t('dialogs.about.actions.close') }}</button>
        </form>
      </div>
    </div>
  </dialog>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
