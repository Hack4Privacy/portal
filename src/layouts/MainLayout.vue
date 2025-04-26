<script setup>
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { LxShell, LxSiteMap, LxIcon } from "@wntr/lx-ui";
import { invoke, until, useIdle, useIntervalFn } from "@vueuse/core";

import LoginView from "@/views/Login.vue";
import useErrors from "@/hooks/useErrors";
import useAuthStore from "@/stores/useAuthStore";
import useAppStore from "@/stores/useAppStore";
import useNotifyStore from "@/stores/useNotifyStore";
import useConfirmStore from "@/stores/useConfirmStore";
import useViewStore from "@/stores/useViewStore";

const authStore = useAuthStore();
const notify = useNotifyStore();
const viewStore = useViewStore();
const errors = useErrors();
const router = useRouter();
const confirmStore = useConfirmStore();
const appStore = useAppStore();

const secondsToIdle = 10;
const secondsCheckApiInterval = 30;

const { idle } = useIdle(secondsToIdle * 1000);

const idleModalOpened = ref(false);

// ToDo: develop login & get session
// eslint-disable-next-line no-unused-vars

const i18n = useI18n();
const { t } = useI18n();
const route = useRoute();
const routes = router.getRoutes();
const shellMode = computed(() => {
  let ret = "public";
  if (route.name === "home") {
    ret = "cover";
  }
  return ret;
});

const systemName = computed(() => i18n.t("title.shortName"));
const pageTitle = computed(() =>
  i18n.t(String(router.currentRoute.value.meta.title)),
);

const breadcrumbs = computed(() => {
  const ret = [];

  if (route.meta.breadcrumbs) {
    // @ts-ignore
    route.meta.breadcrumbs.forEach((item) => {
      ret.push({
        label: i18n.t(item.text),
        to: item.to,
      });
    });
  }
  return ret;
});

const showBackButton = computed(() => breadcrumbs.value.length > 0);

const selectedNavItems = computed(() => {
  const ret = {};
  ret[router.currentRoute.value.name] = true;
  if (route.meta?.breadcrumbs) {
    // @ts-ignore
    route.meta?.breadcrumbs.forEach((item) => {
      ret[item.to?.name] = true;
    });
  }
  return ret;
});

function goBack(path) {
  if (path !== -1) {
    router.push(path);
  } else {
    router.back();
  }
}
function goHome(path) {
  router.push(path);
}

onMounted(() => {
  if (authStore.session.active) {
    authStore.keepAlive();
  }
});

const userInfo = computed(() => {
  if (authStore.isAuthorized) {
    return {
      firstName: authStore.session?.given_name,
      lastName: authStore.session?.family_name,
      description: authStore.session?.role,
      institution: null,
    };
  }
  return null;
});

const closeModal = () => {
  idleModalOpened.value = false;
};

const openModal = () => {
  idleModalOpened.value = true;
};

async function logout() {
  try {
    const resp = await authStore.logout();
    if (resp.status === 200 && resp.data) {
      window.location.href = resp.data;
    } else {
      notify.pushSuccess(i18n.t("shell.notifications.logOut"));
    }
  } catch (err) {
    const error = errors.get(err);
    if (error.status !== 401 && error.data) {
      notify.pushError(error.data);
    }
  } finally {
    closeModal();
    router.push({ name: "sessionEnded" });
  }
}

function primary() {
  logout();
  confirmStore.$state.isOpen = false;
}
function secondary() {
  confirmStore.$state.isOpen = false;
}

function openConfirmModal() {
  confirmStore.push(
    i18n.t("shell.notifications.logoutConfirmTitle"),
    i18n.t("shell.notifications.logoutConfirm"),
    i18n.t("shell.notifications.logoutConfirmYes"),
    i18n.t("shell.notifications.logoutConfirmNo"),
    primary,
    secondary,
  );
}

function confirmModalClosed() {
  confirmStore.$state.isOpen = false;
}

async function getSession() {
  try {
    await authStore.fetchSession();
  } catch (err) {
    const error = errors.get(err);
    if (error.status === 401) {
      logout();
    } else if (error.data) {
      notify.pushError(error.data);
    }
  }
}

async function callKeepAlive() {
  try {
    await authStore.keepAlive();
  } catch (err) {
    const error = errors.get(err);
    if (error.status === 401) {
      logout();
    } else if (error.data) {
      notify.pushError(error.data);
    }
  }
}

const checkApiSession = () => {
  if (idle.value || idleModalOpened.value) {
    getSession();
  } else {
    callKeepAlive();
  }
};

useIntervalFn(() => {
  if (!authStore.session.active) {
    if (idleModalOpened.value) {
      closeModal();
      router.push({ name: "sessionEnded" });
    }
    return;
  }
  if (authStore.session.secondsToLive < 1) {
    logout();
    closeModal();
    return;
  }
  if (authStore.session.secondsToLive < authStore.session.secondsToCountdown) {
    if (!idleModalOpened.value) {
      openModal();
    }
  } else if (idleModalOpened.value) {
    closeModal();
    return;
  }
  const refreshIntervals =
    authStore.session.secondsToLive % secondsCheckApiInterval === 0;
  const refreshBeforeWarn =
    authStore.session.secondsToLive - 3 <
      authStore.session.secondsToCountdown && !idle.value;
  const refreshBeforeLogout = authStore.session.secondsToLive === 3;
  if (refreshIntervals || refreshBeforeWarn || refreshBeforeLogout) {
    checkApiSession();
  }
  authStore.session.secondsToLive -= 1;
}, 1000);

async function continueSession() {
  try {
    await authStore.keepAlive();
    notify.pushSuccess(i18n.t("shell.notifications.sessionContinued"));
  } catch (err) {
    notify.pushError(i18n.t("shell.notifications.sessionContinuedFailed"));
    if (err.response.status === 401) {
      logout();
    }
  } finally {
    closeModal();
  }
}

invoke(async () => {
  // @ts-ignore
  await until(() => authStore.showSessionEndCountdown).toBe(true);
  notify.pushWarning(i18n.t("shell.notifications.sessionEndingSoon"));
});

function idleModalPrimary() {
  continueSession();
}
function idleModalSecondary() {
  logout();
}
</script>
<template>
  <div>
    <div>
      <LxShell
        :system-name="i18n.t('title.fullName')"
        :system-subheader="i18n.t('title.subheader')"
        :system-name-short="systemName"
        :user-info="userInfo"
        :nav-items-selected="selectedNavItems"
        :mode="shellMode"
        :page-label="pageTitle"
        :page-back-button-visible="showBackButton"
        :page-breadcrumbs="breadcrumbs"
        :page-index-path="{ name: 'home' }"
        system-icon="zz-lx"
        :has-cover-logo="false"
        :cover-image="null"
        :cover-image-dark="null"
        :cover-logo="null"
        :navigating="appStore.$state.isNavigating"
        :showIdleModal="idleModalOpened"
        :secondsToLive="authStore.session.secondsToLive"
        :confirmDialogData="confirmStore"
        :confirmPrimaryButtonBusy="false"
        :confirmPrimaryButtonDestructive="true"
        v-model:notifications="notify.notifications"
        :hideNavBar="!viewStore.navBar"
        @confirmModalClosed="confirmModalClosed"
        @go-home="goHome"
        @go-back="goBack"
        @log-out="openConfirmModal"
        @idleModalPrimary="idleModalPrimary"
        @idleModalSecondary="idleModalSecondary"
      >
        <template #backdrop>
          <div class="lx-backdrop">
            <svg
              class="wavy-bg"
              viewBox="0 0 1440 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="waveGradient1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#223A5E" stop-opacity="0.6" />
                  <stop offset="100%" stop-color="#1B2845" stop-opacity="0.6" />
                </linearGradient>
                <linearGradient id="waveGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#2B4865" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="#16305A" stop-opacity="0.5" />
                </linearGradient>
                <linearGradient id="waveGradient3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#304269" stop-opacity="0.4" />
                  <stop offset="100%" stop-color="#1A263B" stop-opacity="0.4" />
                </linearGradient>
                <linearGradient id="waveGradient4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#1C2541" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="#0B132B" stop-opacity="0.3" />
                </linearGradient>
              </defs>
              <path
                class="wave-path wave1"
                fill="url(#waveGradient1)"
                d="M0,320 C360,340 1080,300 1440,320 L1440,320 L0,320 Z"
              />
              <path
                class="wave-path wave2"
                fill="url(#waveGradient2)"
                d="M0,330 C360,350 1080,310 1440,330 L1440,320 L0,320 Z"
              />
              <path
                class="wave-path wave3"
                fill="url(#waveGradient3)"
                d="M0,340 C360,360 1080,320 1440,340 L1440,320 L0,320 Z"
              />
              <path
                class="wave-path wave4"
                fill="url(#waveGradient4)"
                d="M0,350 C360,370 1080,330 1440,350 L1440,320 L0,320 Z"
              />
            </svg>
          </div>
        </template>
        <template #coverArea>
          <div class="lx-button-set">
            <LoginView></LoginView>
          </div>
        </template>
        <template #footer v-if="route.path === '/site-map'">
          <div class="footer-sitemap">
            <div class="footer-sitemap-left">
              <div class="footer-logo">
                <LxIcon value="zz-lx" icon-set="brand" />
                <p>Demo portāls</p>
              </div>
              <p class="footer-sitemap-text">
                LX komponenšu un moduļu demo portāls
              </p>
            </div>
            <div class="footer-sitemap-item">
              <LxSiteMap
                :routes="routes"
                category="useful"
                label="Noderīgi"
                :translator="t"
              />
            </div>
            <div class="footer-sitemap-right">
              <p class="footer-sitemap-text">
                Demo portāls ir paredzēts LX komponenšu un moduļu
                demonstrēšanai.
              </p>
              <p class="footer-sitemap-text">Versija 0.1.11 20.12.2022</p>
            </div>
          </div>
        </template>
        <template #logo>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 50 50"
          >
            <path
              d="M25,1.7C12.1,1.7,1.7,12.1,1.7,25c0,8.4,4.5,15.8,11.2,19.9L25,32.8l0,0l0,0l9.1,9.1c0,0,0,0,0,0l3,3
	c6.7-4.1,11.2-11.5,11.2-20C48.3,12.1,37.9,1.7,25,1.7z M12.6,39.6C8.4,36.1,5.8,30.8,5.8,25c0-3.3,0.8-6.3,2.3-9L22.1,30L12.6,39.6
	z M10.4,12.6c3.5-4.1,8.8-6.8,14.6-6.8c5.8,0,11.1,2.6,14.6,6.8L25,27.2L10.4,12.6z M37.4,39.6L27.8,30l14.1-14.1
	c1.5,2.7,2.3,5.8,2.3,9.1C44.2,30.9,41.5,36.1,37.4,39.6z"
            />
          </svg>
        </template>

        <template #logoSmall>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 50 50"
          >
            <path
              d="M25,1.7C12.1,1.7,1.7,12.1,1.7,25c0,8.4,4.5,15.8,11.2,19.9L25,32.8l0,0l0,0l9.1,9.1c0,0,0,0,0,0l3,3
	c6.7-4.1,11.2-11.5,11.2-20C48.3,12.1,37.9,1.7,25,1.7z M12.6,39.6C8.4,36.1,5.8,30.8,5.8,25c0-3.3,0.8-6.3,2.3-9L22.1,30L12.6,39.6
	z M10.4,12.6c3.5-4.1,8.8-6.8,14.6-6.8c5.8,0,11.1,2.6,14.6,6.8L25,27.2L10.4,12.6z M37.4,39.6L27.8,30l14.1-14.1
	c1.5,2.7,2.3,5.8,2.3,9.1C44.2,30.9,41.5,36.1,37.4,39.6z"
            />
          </svg>
        </template>
        <router-view />
      </LxShell>
    </div>
  </div>
</template>

<style scoped>
.lx-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  background-color: rgba(0, 0, 120, 0.025);
  justify-content: center;
  align-items: center;
}

.wavy-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.wave-path {
  /* Default animation, overridden per wave */
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

.wave1 {
  animation-name: wave1-animation;
  animation-duration: 14s;
  animation-delay: 0s;
}
.wave2 {
  animation-name: wave2-animation;
  animation-duration: 11s;
  animation-delay: -2s;
}
.wave3 {
  animation-name: wave3-animation;
  animation-duration: 17s;
  animation-delay: -4s;
}
.wave4 {
  animation-name: wave4-animation;
  animation-duration: 13s;
  animation-delay: -6s;
}

@keyframes wave1-animation {
  0% {
    d: path("M0,240 C360,260 1080,220 1440,240 L1440,360 L0,360 Z");
  }
  50% {
    d: path("M0,245 C360,250 1080,230 1440,245 L1440,360 L0,360 Z");
  }
  100% {
    d: path("M0,240 C360,260 1080,220 1440,240 L1440,360 L0,360 Z");
  }
}
@keyframes wave2-animation {
  0% {
    d: path("M0,250 C360,270 1080,230 1440,250 L1440,360 L0,360 Z");
  }
  50% {
    d: path("M0,255 C360,265 1080,240 1440,255 L1440,360 L0,360 Z");
  }
  100% {
    d: path("M0,250 C360,270 1080,230 1440,250 L1440,360 L0,360 Z");
  }
}
@keyframes wave3-animation {
  0% {
    d: path("M0,260 C360,280 1080,240 1440,260 L1440,360 L0,360 Z");
  }
  50% {
    d: path("M0,265 C360,275 1080,250 1440,265 L1440,360 L0,360 Z");
  }
  100% {
    d: path("M0,260 C360,280 1080,240 1440,260 L1440,360 L0,360 Z");
  }
}
@keyframes wave4-animation {
  0% {
    d: path("M0,270 C360,290 1080,250 1440,270 L1440,360 L0,360 Z");
  }
  50% {
    d: path("M0,275 C360,285 1080,260 1440,275 L1440,360 L0,360 Z");
  }
  100% {
    d: path("M0,270 C360,290 1080,250 1440,270 L1440,360 L0,360 Z");
  }
}
</style>
