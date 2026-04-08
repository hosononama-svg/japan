const { createApp, ref, computed, watch, nextTick } = Vue;

// ===== ルーティング =====
function parseRoute() {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith('era-')) return { view: 'era', eraId: hash.slice(4) };
  return { view: 'overview', eraId: null };
}

// ===== ユーティリティ =====
function formatYear(year) {
  if (year === null) return '現在';
  if (year < 0) return `紀元前${Math.abs(year)}年`;
  return `${year}年`;
}

function formatYearRange(start, end) {
  const s = formatYear(start);
  const e = end === null ? '現在' : formatYear(end);
  return `${s} 〜 ${e}`;
}

function formatLifespan(person) {
  const birth = formatYear(person.birthYear);
  const death = person.deathYear === null ? '現在' : person.deathYear ? `${person.deathYear}年` : '没年不詳';
  return `${birth} 〜 ${death}`;
}
// ===== Vue アプリ =====
createApp({
  setup() {
    const route = ref(parseRoute());
    const viewMode = ref('events');   // 'events' | 'people'
    const selectedEvent = ref(null);
    const wikiData = ref(null);
    const wikiLoading = ref(false);
    const wikiError = ref(false);
    const currentYear = new Date().getFullYear();
    const searchQuery = ref('');
    const selectedCategory = ref('');

    window.addEventListener('hashchange', () => {
      route.value = parseRoute();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // スクロールで .reveal 要素を表示する
    const setupReveal = () => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
      }, { threshold: 0.1 });
      document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
    };
    // ビュー切替後に再セットアップ
    setTimeout(setupReveal, 100);
    window.addEventListener('hashchange', () => setTimeout(setupReveal, 100));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && selectedEvent.value) closeModal();
    });

    const currentView = computed(() => route.value.view);

    const selectedEra = computed(() =>
      ERAS.find(e => e.id === route.value.eraId) || null
    );

    const selectedEraEvents = computed(() => {
      if (!route.value.eraId) return [];
      return (EVENTS[route.value.eraId] || []).sort((a, b) => a.year - b.year);
    });

    const selectedEraPeople = computed(() => {
      if (!route.value.eraId) return [];
      return (PEOPLE[route.value.eraId] || []).sort((a, b) => a.birthYear - b.birthYear);
    });

    const prevEra = computed(() => {
      if (!selectedEra.value) return null;
      const idx = ERAS.findIndex(e => e.id === selectedEra.value.id);
      return idx > 0 ? ERAS[idx - 1] : null;
    });

    const nextEra = computed(() => {
      if (!selectedEra.value) return null;
      const idx = ERAS.findIndex(e => e.id === selectedEra.value.id);
      return idx < ERAS.length - 1 ? ERAS[idx + 1] : null;
    });

    const totalEventCount = computed(() =>
      Object.values(EVENTS).reduce((sum, arr) => sum + arr.length, 0)
    );

    const totalPeopleCount = computed(() =>
      Object.values(PEOPLE).reduce((sum, arr) => sum + arr.length, 0)
    );

    const goToEra = (eraId) => { window.location.hash = `era-${eraId}`; };
    const goToOverview = () => { window.location.hash = ''; };

    const getDurationLabel = (era) => {
      const years = (era.endYear ?? currentYear) - era.startYear;
      if (years >= 10000) return `約${Math.round(years / 10000)}万年`;
      if (years >= 1000) return `約${(years / 1000).toFixed(1)}万年`;
      if (years >= 100) return `約${Math.round(years / 100) * 100}年間`;
      return `${years}年間`;
    };

    const getEventCount = (eraId) => (EVENTS[eraId] || []).length;
    const getPeopleCount = (eraId) => (PEOPLE[eraId] || []).length;
    const getEraTopPeople = (eraId) => (PEOPLE[eraId] || []).slice(0, 3);

    const EVENT_CATS_MODERN   = ['政治', '外交', '内政', '戦争', '文化', '経済', '宗教'];
    const EVENT_CATS_PREMODERN = ['政治', '外交', '内政', '戦争', '文化', '宗教'];
    const PEOPLE_CATS          = ['政治', '宗教', '文化', '経済'];
    const MODERN_ERA_IDS       = ['meiji', 'taisho', 'showa', 'heisei', 'reiwa'];

    const filteredEraEvents = computed(() => {
      let list = selectedEraEvents.value;
      if (selectedCategory.value) list = list.filter(e => e.category.includes(selectedCategory.value));
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter(e =>
          e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
        );
      }
      return list;
    });

    const filteredEraPeople = computed(() => {
      let list = selectedEraPeople.value;
      if (selectedCategory.value) list = list.filter(p => p.category.includes(selectedCategory.value));
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter(p =>
          p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
        );
      }
      return list;
    });

    const currentEraCategories = computed(() => {
      const eraId = route.value.eraId;
      if (!eraId) return [];
      if (viewMode.value === 'people') {
        const items = PEOPLE[eraId] || [];
        return PEOPLE_CATS
          .map(name => ({ name, count: items.filter(p => p.category.includes(name)).length }))
          .filter(c => c.count > 0);
      } else {
        const isModern = MODERN_ERA_IDS.includes(eraId);
        const cats = isModern ? EVENT_CATS_MODERN : EVENT_CATS_PREMODERN;
        const items = EVENTS[eraId] || [];
        return cats
          .map(name => ({ name, count: items.filter(e => e.category.includes(name)).length }))
          .filter(c => c.count > 0);
      }
    });

    // Wikipedia モーダル（イベント・人物共通）
    const openModal = async (item) => {
      selectedEvent.value = item;
      wikiData.value = null;
      wikiError.value = false;
      wikiLoading.value = true;
      try {
        const title = encodeURIComponent(item.wikipediaTitle);
        const res = await fetch(
          `https://ja.wikipedia.org/api/rest_v1/page/summary/${title}`,
          { headers: { Accept: 'application/json' } }
        );
        if (res.ok) wikiData.value = await res.json();
        else wikiError.value = true;
      } catch {
        wikiError.value = true;
      } finally {
        wikiLoading.value = false;
      }
    };

    const closeModal = () => {
      selectedEvent.value = null;
      wikiData.value = null;
    };

    // モーダルのタイトルを動的に（イベント名 or 人物名）
    const modalTitle = computed(() => {
      if (!selectedEvent.value) return '';
      return selectedEvent.value.name || selectedEvent.value.title || '';
    });

    const modalSubtitle = computed(() => {
      if (!selectedEvent.value) return '';
      if (selectedEvent.value.name) {
        // 人物の場合: 生没年と肩書き
        return `${formatLifespan(selectedEvent.value)}  ／  ${selectedEvent.value.title}`;
      }
      // イベントの場合: 年
      return formatYear(selectedEvent.value.year);
    });

    // フィルター・検索変更後に新しいDOM要素をreveal監視対象に追加
    watch([selectedCategory, searchQuery, viewMode], () => {
      nextTick(() => setupReveal());
    });

    return {
      eras: ERAS,
      currentView,
      viewMode,
      selectedEra,
      selectedEraEvents,
      selectedEraPeople,
      prevEra,
      nextEra,
      totalEventCount,
      totalPeopleCount,
      selectedEvent,
      wikiData,
      wikiLoading,
      wikiError,
      currentYear,
      modalTitle,
      modalSubtitle,
      goToEra,
      goToOverview,
      formatYear,
      formatYearRange,
      formatLifespan,
      getDurationLabel,
      getEventCount,
      getPeopleCount,
      getEraTopPeople,
      openModal,
      closeModal,
      searchQuery,
      selectedCategory,
      filteredEraEvents,
      filteredEraPeople,
      currentEraCategories,
    };
  },
}).mount('#app');
