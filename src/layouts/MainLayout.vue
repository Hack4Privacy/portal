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
        :has-cover-logo="true"
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
          <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">
          <svg
            version="1.0"
            xmlns="http://www.w3.org/2000/svg"
            width="150"
            height="150"
            viewBox="100 100 820 820"
            preserveAspectRatio="xMidYMid meet"
          >
            <g
              transform="translate(0.000000,1024.000000) scale(0.100000,-0.100000)"
              stroke="none"
            >
              <path
                d="M2538 9000 c-259 -44 -488 -254 -553 -506 -14 -54 -15 -412 -13
-3390 l3 -3329 23 -65 c67 -188 215 -349 394 -429 133 -60 -52 -56 2728 -56
2432 0 2558 1 2625 18 197 51 372 192 460 372 70 142 65 -77 65 2700 0 2762 5
2555 -61 2695 -28 60 -94 128 -927 959 -951 947 -972 966 -1112 1014 l-65 22
-1760 1 c-968 1 -1781 -2 -1807 -6z m3424 -997 l3 -638 27 -80 c69 -203 219
-361 415 -440 103 -42 181 -46 863 -45 l645 1 3 -2438 c2 -1780 0 -2454 -8
-2498 -22 -117 -89 -202 -199 -254 l-56 -26 -2539 -3 -2538 -2 -60 27 c-73 32
-138 102 -170 181 l-23 57 0 3265 c0 3121 1 3267 18 3317 30 85 113 166 206
199 29 11 370 13 1723 14 l1687 0 3 -637z m1516 -841 c-62 -1 -291 -1 -508 0
l-395 3 -67 33 c-80 39 -139 102 -168 178 -19 52 -20 77 -20 550 l0 496 635
-629 636 -628 -113 -3z"
              />
              <path
                d="M3860 6924 c-127 -25 -261 -80 -359 -147 -68 -47 -189 -165 -237
-234 -111 -155 -167 -334 -167 -533 0 -197 51 -364 163 -531 47 -70 2302
-2323 2394 -2392 65 -49 214 -122 289 -141 377 -98 748 29 979 334 113 148
167 308 175 511 6 155 -9 252 -58 379 -65 170 -45 148 -1268 1373 -680 682
-1168 1163 -1216 1199 -90 69 -206 128 -310 159 -53 16 -105 22 -215 24 -80 2
-156 1 -170 -1z m291 -370 c122 -36 162 -66 412 -313 130 -129 237 -240 237
-246 0 -5 -176 -185 -391 -400 l-391 -389 -232 234 c-254 258 -289 306 -322
446 -79 337 195 683 542 684 54 0 112 -6 145 -16z m1394 -2084 l-395 -395
-452 452 -453 453 395 395 395 395 452 -452 453 -453 -395 -395z m1133 -386
c113 -217 72 -474 -103 -649 -114 -114 -235 -165 -389 -165 -100 0 -212 31
-291 81 -27 17 -155 135 -283 262 l-232 232 392 393 393 392 241 -242 c187
-190 247 -256 272 -304z"
              />
            </g>
          </svg>
        </template>

        <template #logoSmall>
          <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">
          <svg
            version="1.0"
            xmlns="http://www.w3.org/2000/svg"
            width="50"
            height="50"
            viewBox="100 100 820 820"
            preserveAspectRatio="xMidYMid meet"
          >
            <g
              transform="translate(0.000000,1024.000000) scale(0.100000,-0.100000)"
              stroke="none"
            >
              <path
                d="M2538 9000 c-259 -44 -488 -254 -553 -506 -14 -54 -15 -412 -13
-3390 l3 -3329 23 -65 c67 -188 215 -349 394 -429 133 -60 -52 -56 2728 -56
2432 0 2558 1 2625 18 197 51 372 192 460 372 70 142 65 -77 65 2700 0 2762 5
2555 -61 2695 -28 60 -94 128 -927 959 -951 947 -972 966 -1112 1014 l-65 22
-1760 1 c-968 1 -1781 -2 -1807 -6z m3424 -997 l3 -638 27 -80 c69 -203 219
-361 415 -440 103 -42 181 -46 863 -45 l645 1 3 -2438 c2 -1780 0 -2454 -8
-2498 -22 -117 -89 -202 -199 -254 l-56 -26 -2539 -3 -2538 -2 -60 27 c-73 32
-138 102 -170 181 l-23 57 0 3265 c0 3121 1 3267 18 3317 30 85 113 166 206
199 29 11 370 13 1723 14 l1687 0 3 -637z m1516 -841 c-62 -1 -291 -1 -508 0
l-395 3 -67 33 c-80 39 -139 102 -168 178 -19 52 -20 77 -20 550 l0 496 635
-629 636 -628 -113 -3z"
              />
              <path
                d="M3860 6924 c-127 -25 -261 -80 -359 -147 -68 -47 -189 -165 -237
-234 -111 -155 -167 -334 -167 -533 0 -197 51 -364 163 -531 47 -70 2302
-2323 2394 -2392 65 -49 214 -122 289 -141 377 -98 748 29 979 334 113 148
167 308 175 511 6 155 -9 252 -58 379 -65 170 -45 148 -1268 1373 -680 682
-1168 1163 -1216 1199 -90 69 -206 128 -310 159 -53 16 -105 22 -215 24 -80 2
-156 1 -170 -1z m291 -370 c122 -36 162 -66 412 -313 130 -129 237 -240 237
-246 0 -5 -176 -185 -391 -400 l-391 -389 -232 234 c-254 258 -289 306 -322
446 -79 337 195 683 542 684 54 0 112 -6 145 -16z m1394 -2084 l-395 -395
-452 452 -453 453 395 395 395 395 452 -452 453 -453 -395 -395z m1133 -386
c113 -217 72 -474 -103 -649 -114 -114 -235 -165 -389 -165 -100 0 -212 31
-291 81 -27 17 -155 135 -283 262 l-232 232 392 393 393 392 241 -242 c187
-190 247 -256 272 -304z"
              />
            </g>
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
