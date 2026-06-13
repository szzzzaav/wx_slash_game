const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function toast(message) {
  let node = qs(".toast");
  if (!node) {
    node = document.createElement("div");
    node.className = "toast";
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.classList.add("show");
  window.clearTimeout(node.dataset.timer);
  node.dataset.timer = window.setTimeout(() => node.classList.remove("show"), 1500);
}

function setActiveButtons(selector, message) {
  qsa(selector).forEach((button) => {
    button.addEventListener("click", () => {
      qsa(selector).forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      if (message) toast(message.replace("{value}", button.textContent.trim()));
    });
  });
}

function initCommon() {
  qsa("[data-toast]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.toggleAction) {
        button.classList.toggle("active");
        const isActive = button.classList.contains("active");
        toast(isActive ? button.dataset.toast : "已取消");
        return;
      }
      toast(button.dataset.toast);
    });
  });
  qsa(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const href = item.getAttribute("href");
      if (!href || href === "#") toast("当前页面");
    });
  });
}

function initFeed() {
  const games = [
    {
      title: "空中回廊",
      meta: "AI 生成 · 解谜 · 中等 · 4 分钟",
      creator: "由 Lumen 创建",
      label: "自动演示 01 · 旋转平台"
    },
    {
      title: "云端避让",
      meta: "AI 生成 · 躲避 · 简单 · 2 分钟",
      creator: "由 NeoLan 创建",
      label: "自动演示 02 · 轻量动作"
    },
    {
      title: "玻璃迷宫",
      meta: "AI 生成 · 迷宫 · 困难 · 6 分钟",
      creator: "由 QuietBot 创建",
      label: "自动演示 03 · 反射路径"
    }
  ];
  let index = 0;
  const screen = qs(".phone-screen");
  const title = qs("[data-game-title]");
  const meta = qs("[data-game-meta]");
  const creator = qs("[data-game-creator]");
  const label = qs("[data-scene-label]");
  const disliked = qs("[data-disliked]");
  const drawer = qs("[data-comment-drawer]");
  const backdrop = qs("[data-comment-backdrop]");
  const commentTrigger = qs("[data-comment-trigger]");
  const commentClose = qs("[data-comment-close]");
  const commentForm = qs("[data-comment-form]");
  const commentInput = qs("[data-comment-input]");
  const commentList = qs("[data-comment-list]");
  const commentCount = qs("[data-comment-count]");
  const render = () => {
    const game = games[index];
    title.textContent = game.title;
    meta.textContent = game.meta;
    creator.textContent = game.creator;
    label.textContent = game.label;
    screen.dataset.variant = String(index);
    disliked.textContent = "左滑可减少此类游戏";
  };
  let startY = 0;
  let startX = 0;
  screen.addEventListener("pointerdown", (event) => {
    startY = event.clientY;
    startX = event.clientX;
  });
  screen.addEventListener("pointerup", (event) => {
    if (drawer?.classList.contains("open")) return;
    const dy = event.clientY - startY;
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 82 && dx < 0) {
      disliked.textContent = "已减少同类推荐";
      toast("已记录偏好");
      return;
    }
    if (Math.abs(dy) > 74) {
      index = dy < 0 ? (index + 1) % games.length : (index + games.length - 1) % games.length;
      render();
      toast(index === 0 ? "回到推荐起点" : "切换到下一款");
    }
  });
  qs("[data-play]").addEventListener("click", () => toast("进入试玩"));
  const openComments = () => {
    drawer.classList.add("open");
    backdrop.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    window.setTimeout(() => commentInput?.focus(), 180);
  };
  const closeComments = () => {
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  };
  if (drawer && backdrop && commentTrigger) {
    commentTrigger.addEventListener("click", openComments);
    commentClose?.addEventListener("click", closeComments);
    backdrop.addEventListener("click", closeComments);
    commentForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = commentInput.value.trim();
      if (!text) {
        toast("先写一句评论");
        return;
      }
      const item = document.createElement("article");
      const avatar = document.createElement("span");
      const body = document.createElement("div");
      const name = document.createElement("strong");
      const time = document.createElement("em");
      const copy = document.createElement("p");
      item.className = "comment-item";
      avatar.className = "comment-avatar";
      name.textContent = "我 ";
      time.textContent = "刚刚";
      copy.textContent = text;
      name.appendChild(time);
      body.append(name, copy);
      item.append(avatar, body);
      commentList.prepend(item);
      commentInput.value = "";
      const nextCount = Number(commentCount.textContent) + 1;
      commentCount.textContent = String(nextCount);
      toast("评论已发送");
    });
  }
  render();
}

function initWorkshop() {
  setActiveButtons("[data-template]", "已选择：{value}");
  setActiveButtons("[data-time]", "时长：{value}");
  setActiveButtons("[data-theme]", "主题：{value}");
  qsa("[data-switch]").forEach((item) => {
    item.addEventListener("click", () => {
      const sw = qs(".switch", item);
      sw.classList.toggle("active");
      toast(sw.classList.contains("active") ? "已开启" : "已关闭");
    });
  });
  const range = qs("[data-difficulty]");
  const label = qs("[data-difficulty-label]");
  if (range && label) {
    range.addEventListener("input", () => {
      const map = ["入门", "轻度", "标准", "进阶", "高压"];
      label.textContent = map[Number(range.value) - 1];
    });
  }
  const generate = qs("[data-generate]");
  if (generate) {
    generate.addEventListener("click", () => {
      toast("创意已送入生成队列");
      window.setTimeout(() => {
        window.location.href = "04-generating.html";
      }, 650);
    });
  }
}

function initGeneration() {
  const steps = qsa(".step");
  const orb = qs(".progress-orb");
  const percent = qs("[data-percent]");
  const status = qs("[data-status]");
  let active = 1;
  function tick() {
    active = Math.min(active + 1, steps.length);
    const progress = Math.round((active / steps.length) * 100);
    orb.style.setProperty("--progress", progress);
    percent.textContent = `${progress}%`;
    steps.forEach((step, idx) => {
      step.classList.toggle("done", idx < active - 1);
      step.classList.toggle("active", idx === active - 1);
      const badge = qs("em", step);
      if (badge) badge.textContent = idx < active - 1 ? "完成" : idx === active - 1 ? "进行中" : "等待";
    });
    status.textContent = active === steps.length ? "预览已可试玩" : steps[active - 1].dataset.label;
    if (active < steps.length) window.setTimeout(tick, 900);
  }
  window.setTimeout(tick, 800);
  qs("[data-regenerate]")?.addEventListener("click", () => {
    active = 0;
    toast("重新生成中");
    window.setTimeout(tick, 400);
  });
}

function initProfile() {
  setActiveButtons("[data-profile-tab]", "已切换：{value}");
}

document.addEventListener("DOMContentLoaded", () => {
  initCommon();
  const page = document.body.dataset.page;
  if (page === "feed") initFeed();
  if (page === "workshop") initWorkshop();
  if (page === "generating") initGeneration();
  if (page === "profile") initProfile();
});
