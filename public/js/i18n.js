/* =========================================================
   FERMAJA — CENTRAL i18n SYSTEM
   Languages: Arabic (RTL), Français (LTR), English (LTR)
   Visual/functionality layer only.
   ========================================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "fermaja_language";
  const DEFAULT_LANGUAGE = "ar";

  const LANGUAGES = {
    ar: {
      name: "العربية",
      short: "AR",
      dir: "rtl",
      flag: "🇩🇿",
      font: "Cairo"
    },
    fr: {
      name: "Français",
      short: "FR",
      dir: "ltr",
      flag: "🇫🇷",
      font: "Cairo"
    },
    en: {
      name: "English",
      short: "EN",
      dir: "ltr",
      flag: "🇬🇧",
      font: "Cairo"
    }
  };

  /*
   * Arabic is the source language.
   * Every visible text that already has data-i18n is mapped here.
   * Additional keys can be added safely as the remaining pages are updated.
   */
  const translations = {
    nav_home: {
      ar: "الرئيسية",
      fr: "Accueil",
      en: "Home"
    },
    nav_menu: {
      ar: "القائمة",
      fr: "Menu",
      en: "Menu"
    },
    nav_about: {
      ar: "من نحن",
      fr: "À propos",
      en: "About us"
    },
    nav_contact: {
      ar: "اتصل بنا",
      fr: "Contact",
      en: "Contact"
    },
    nav_order: {
      ar: "📩 اطلب الآن",
      fr: "📩 Commander maintenant",
      en: "📩 Order now"
    },

    hero_title: {
      ar: "مفرمجة الحالة!",
      fr: "Mfermja lhala !",
      en: "Mfermja lhala!"
    },
    hero_desc: {
      ar: "نقدم لك أشهى ساندويشات الجبن المصنوعة من أجود المكونات الطازجة. شخصيتنا «فرماجة» هنا لتخدمك!",
      fr: "Nous vous proposons de délicieux sandwichs au fromage préparés avec les meilleurs ingrédients frais. Notre personnage « Fermaja » est là pour vous servir !",
      en: "We serve delicious cheese sandwiches made with the finest fresh ingredients. Our Fermaja character is here to serve you!"
    },
    hero_order_btn: {
      ar: "📩 اطلب الآن",
      fr: "📩 Commander maintenant",
      en: "📩 Order now"
    },
    hero_menu_btn: {
      ar: "استعرض القائمة",
      fr: "Voir le menu",
      en: "View menu"
    },

    features_title: {
      ar: "لماذا تختار فرماجة؟",
      fr: "Pourquoi choisir Fermaja ?",
      en: "Why choose Fermaja?"
    },
    feature1_title: {
      ar: "جبن طازج",
      fr: "Fromage frais",
      en: "Fresh cheese"
    },
    feature1_desc: {
      ar: "نستخدم أفضل أنواع الجبن المحلية والمستوردة",
      fr: "Nous utilisons les meilleurs fromages locaux et importés",
      en: "We use the finest local and imported cheeses"
    },
    feature2_title: {
      ar: "خبز طازج",
      fr: "Pain frais",
      en: "Fresh bread"
    },
    feature2_desc: {
      ar: "يُخبز يومياً لتقديم قرمشة لا تُقاوم",
      fr: "Cuit chaque jour pour un croquant irrésistible",
      en: "Baked fresh every day for an irresistible crunch"
    },
    feature3_title: {
      ar: "صنع بحب",
      fr: "Fait avec amour",
      en: "Made with love"
    },
    feature3_desc: {
      ar: "كل ساندويش يحضر بشغف ليرضيك",
      fr: "Chaque sandwich est préparé avec passion pour vous faire plaisir",
      en: "Every sandwich is prepared with passion to delight you"
    },

    menu_title: {
      ar: "الساندويشات",
      fr: "Nos sandwichs",
      en: "Our sandwiches"
    },
    menu_subtitle: {
      ar: "اختر ما يشتهيه قلبك، كلها محضرة بأجود أنواع الجبن",
      fr: "Choisissez ce que votre cœur désire, préparé avec les meilleurs fromages",
      en: "Choose what your heart desires, prepared with the finest cheeses"
    },
    menu_fermaja_desc: {
      ar: "جبن مذوب، غرويار، شيدار",
      fr: "Fromage fondu, Gruyère, Cheddar",
      en: "Melted cheese, Gruyère, Cheddar"
    },
    menu_fermajinho_desc: {
      ar: "جبن مذوب، غرويار، شيدار، كاممبارت",
      fr: "Fromage fondu, Gruyère, Cheddar, Camembert",
      en: "Melted cheese, Gruyère, Cheddar, Camembert"
    },
    menu_fermajo_desc: {
      ar: "جبن مذوب، غرويار، شيدار، كاممبارت، كيري، فروماج روج، غودا",
      fr: "Fromage fondu, Gruyère, Cheddar, Camembert, Kiri, fromage rouge, Gouda",
      en: "Melted cheese, Gruyère, Cheddar, Camembert, Kiri, red cheese, Gouda"
    },
    supplements_title: {
      ar: "الإضافات (+100 دج / +150 دج)",
      fr: "Suppléments (+100 DA / +150 DA)",
      en: "Extras (+100 DA / +150 DA)"
    },
    desserts_title: {
      ar: "🍰 التحليات",
      fr: "🍰 Desserts",
      en: "🍰 Desserts"
    },
    drinks_title: {
      ar: "🥤 المشروبات",
      fr: "🥤 Boissons",
      en: "🥤 Drinks"
    },

    about_title: {
      ar: "حكاية فرماجة",
      fr: "L'histoire de Fermaja",
      en: "The story of Fermaja"
    },
    about_p1: {
      ar: "فرماجة ليست مجرد محل ساندويشات، إنها فكرة ولدت من حب الجبن والشغف بتقديم أطباق فريدة.",
      fr: "Fermaja n’est pas seulement une sandwicherie, c’est une idée née d’un amour du fromage et d’une passion pour les plats uniques.",
      en: "Fermaja is more than a sandwich shop. It is an idea born from a love of cheese and a passion for unique dishes."
    },
    about_p2: {
      ar: "شخصيتنا «فرماجة» تعكس المرح والجودة العالية التي نقدمها. كل ساندويش لدينا يحكي قصة نكهة، بدءاً من اختيار الأجبان الطازجة وصولاً إلى الخبز المقرمش.",
      fr: "Notre personnage « Fermaja » reflète le plaisir et la qualité que nous offrons. Chaque sandwich raconte une histoire de saveurs, du choix des fromages frais au pain croustillant.",
      en: "Our Fermaja character reflects the fun and high quality we offer. Every sandwich tells a story of flavor, from fresh cheese selection to crispy bread."
    },
    about_p3: {
      ar: "نحن نفتخر بتقديم تجربة طعام لا تُنسى لكل زبون. سواء كنت تبحث عن وجبة سريعة أو طلب خاص لمناسبة، فنحن هنا لخدمتك!",
      fr: "Nous sommes fiers d’offrir une expérience culinaire inoubliable à chaque client. Que vous cherchiez un repas rapide ou une commande spéciale, nous sommes là pour vous servir !",
      en: "We are proud to offer every customer an unforgettable food experience. Whether you need a quick meal or a special order, we are here to serve you!"
    },
    about_order_btn: {
      ar: "📨 اطلب الآن",
      fr: "📨 Commander maintenant",
      en: "📨 Order now"
    },

    contact_title: {
      ar: "📞 تواصلوا معنا",
      fr: "📞 Contactez-nous",
      en: "📞 Contact us"
    },
    contact_sub: {
      ar: "نحن هنا لخدمتكم طوال أيام الأسبوع",
      fr: "Nous sommes là pour vous servir tous les jours de la semaine",
      en: "We are here to serve you every day of the week"
    },
    contact_address: {
      ar: "📍 القبة، الجزائر العاصمة",
      fr: "📍 Kouba, Alger",
      en: "📍 Kouba, Algiers"
    },
    contact_phone: {
      ar: "📱 0550074864",
      fr: "📱 0550074864",
      en: "📱 0550074864"
    },
    contact_hours: {
      ar: "🕒 ساعات العمل: 11:00 - 23:00",
      fr: "🕒 Heures de travail : 11:00 - 23:00",
      en: "🕒 Opening hours: 11:00 - 23:00"
    },

    lead_title: {
      ar: "قدم طلبك الآن",
      fr: "Passez votre commande maintenant",
      en: "Place your order now"
    },
    lead_desc: {
      ar: "املأ البيانات وسنتواصل معك قريباً لتأكيد طلبك",
      fr: "Remplissez les détails et nous vous contacterons bientôt pour confirmer votre commande",
      en: "Fill in your details and we will contact you shortly to confirm your order"
    },
    lead_name: {
      ar: "الاسم الكامل",
      fr: "Nom complet",
      en: "Full name"
    },
    lead_phone: {
      ar: "رقم الهاتف",
      fr: "N° de téléphone",
      en: "Phone number"
    },
    lead_submit: {
      ar: "📨 تقديم الطلب",
      fr: "📨 Envoyer la commande",
      en: "📨 Submit order"
    }
  };

  function getLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved && LANGUAGES[saved]) {
      return saved;
    }

    return DEFAULT_LANGUAGE;
  }

  function setDocumentDirection(lang) {
    const config = LANGUAGES[lang];

    document.documentElement.lang = lang;
    document.documentElement.dir = config.dir;

    document.body.classList.toggle("rtl", config.dir === "rtl");
    document.body.classList.toggle("ltr", config.dir === "ltr");

    document.body.dataset.language = lang;
    document.body.dataset.direction = config.dir;
  }

  function translateElement(element, lang) {
    const key = element.getAttribute("data-i18n");
    if (!key || !translations[key]) return;

    const value =
      translations[key][lang] ??
      translations[key][DEFAULT_LANGUAGE] ??
      "";

    /*
     * textContent is intentional:
     * it prevents translation strings from injecting HTML.
     */
    element.textContent = value;
  }

  function translateAttributes(lang) {
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      const value = translations[key]?.[lang] ?? translations[key]?.[DEFAULT_LANGUAGE];
      if (value) element.setAttribute("placeholder", value);
    });

    document.querySelectorAll("[data-i18n-title]").forEach((element) => {
      const key = element.getAttribute("data-i18n-title");
      const value = translations[key]?.[lang] ?? translations[key]?.[DEFAULT_LANGUAGE];
      if (value) element.setAttribute("title", value);
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      const key = element.getAttribute("data-i18n-aria-label");
      const value = translations[key]?.[lang] ?? translations[key]?.[DEFAULT_LANGUAGE];
      if (value) element.setAttribute("aria-label", value);
    });
  }

  function translatePage(lang) {
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      translateElement(element, lang);
    });

    translateAttributes(lang);
    setDocumentDirection(lang);
    updateLanguageSwitcher(lang);

    window.dispatchEvent(
      new CustomEvent("fermaja:languageChanged", {
        detail: {
          language: lang,
          direction: LANGUAGES[lang].dir
        }
      })
    );
  }

  function createLanguageSwitcher() {
    let existing = document.getElementById("fermajaLanguageSwitcher");

    if (existing) return existing;

    const wrapper = document.createElement("div");
    wrapper.id = "fermajaLanguageSwitcher";
    wrapper.className = "fermaja-language-switcher";

    wrapper.innerHTML = `
      <button
        type="button"
        class="fermaja-language-trigger"
        id="fermajaLanguageTrigger"
        aria-haspopup="true"
        aria-expanded="false"
        aria-label="Change language"
      >
        <span class="fermaja-language-globe" aria-hidden="true">🌐</span>
        <span class="fermaja-language-current">العربية</span>
        <span class="fermaja-language-chevron" aria-hidden="true">⌄</span>
      </button>

      <div
        class="fermaja-language-menu"
        id="fermajaLanguageMenu"
        role="menu"
        aria-hidden="true"
      >
        ${Object.entries(LANGUAGES).map(([code, item]) => `
          <button
            type="button"
            class="fermaja-language-option"
            data-language="${code}"
            role="menuitem"
          >
            <span class="fermaja-language-flag">${item.flag}</span>
            <span class="fermaja-language-name">${item.name}</span>
            <span class="fermaja-language-check" aria-hidden="true">✓</span>
          </button>
        `).join("")}
      </div>
    `;

    const controls = document.querySelector(".controls");

    if (controls) {
      controls.appendChild(wrapper);
    } else {
      const nav = document.querySelector("nav");

      if (nav) {
        nav.appendChild(wrapper);
      } else {
        document.body.prepend(wrapper);
      }
    }

    const trigger = wrapper.querySelector("#fermajaLanguageTrigger");
    const menu = wrapper.querySelector("#fermajaLanguageMenu");

    trigger.addEventListener("click", function (event) {
      event.stopPropagation();

      const opened = wrapper.classList.toggle("open");

      trigger.setAttribute("aria-expanded", String(opened));
      menu.setAttribute("aria-hidden", String(!opened));
    });

    wrapper.querySelectorAll(".fermaja-language-option").forEach((button) => {
      button.addEventListener("click", function () {
        const language = button.dataset.language;

        setLanguage(language);

        wrapper.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
        menu.setAttribute("aria-hidden", "true");
      });
    });

    document.addEventListener("click", function (event) {
      if (!wrapper.contains(event.target)) {
        wrapper.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
        menu.setAttribute("aria-hidden", "true");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        wrapper.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
        menu.setAttribute("aria-hidden", "true");
      }
    });

    return wrapper;
  }

  function updateLanguageSwitcher(lang) {
    const wrapper = document.getElementById("fermajaLanguageSwitcher");

    if (!wrapper) return;

    const config = LANGUAGES[lang];

    const current = wrapper.querySelector(".fermaja-language-current");

    if (current) {
      current.textContent = config.name;
    }

    wrapper.querySelectorAll(".fermaja-language-option").forEach((button) => {
      const active = button.dataset.language === lang;

      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  function setLanguage(language) {
    if (!LANGUAGES[language]) {
      language = DEFAULT_LANGUAGE;
    }

    localStorage.setItem(STORAGE_KEY, language);
    translatePage(language);
  }

  function injectStyles() {
    if (document.getElementById("fermaja-i18n-styles")) return;

    const style = document.createElement("style");
    style.id = "fermaja-i18n-styles";

    style.textContent = `
      /* =====================================================
         FERMAJA LANGUAGE SWITCHER
         ===================================================== */

      .fermaja-language-switcher {
        position: relative;
        display: inline-flex;
        align-items: center;
        z-index: 1200;
        margin-inline-start: 4px;
      }

      .fermaja-language-trigger {
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 8px 12px;
        border: 1px solid var(--border-soft, rgba(35,91,53,.12));
        border-radius: 12px;
        background: var(--glass, rgba(255,255,255,.82));
        color: var(--text, #222823);
        font: inherit;
        font-size: .82rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 6px 18px rgba(20,35,25,.06);
        transition: .25s ease;
        white-space: nowrap;
      }

      .fermaja-language-trigger:hover,
      .fermaja-language-switcher.open .fermaja-language-trigger {
        border-color: rgba(217,154,0,.38);
        background: var(--gold-soft, rgba(217,154,0,.10));
        transform: translateY(-1px);
      }

      .fermaja-language-globe {
        font-size: 1rem;
        line-height: 1;
      }

      .fermaja-language-chevron {
        font-size: 1rem;
        line-height: .7;
        transition: transform .25s ease;
      }

      .fermaja-language-switcher.open .fermaja-language-chevron {
        transform: rotate(180deg);
      }

      .fermaja-language-menu {
        position: absolute;
        top: calc(100% + 9px);
        inset-inline-end: 0;
        width: 180px;
        padding: 7px;
        border: 1px solid var(--border-soft, rgba(35,91,53,.12));
        border-radius: 16px;
        background: var(--white, #fff);
        box-shadow: 0 18px 45px rgba(15,30,20,.14);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-7px) scale(.98);
        transform-origin: top right;
        transition: .22s ease;
      }

      .fermaja-language-switcher.open .fermaja-language-menu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
      }

      .fermaja-language-option {
        width: 100%;
        min-height: 42px;
        display: grid;
        grid-template-columns: 26px 1fr 18px;
        align-items: center;
        gap: 7px;
        padding: 8px 10px;
        border: 0;
        border-radius: 11px;
        background: transparent;
        color: var(--text, #222823);
        font: inherit;
        font-size: .82rem;
        text-align: start;
        cursor: pointer;
        transition: .2s ease;
      }

      .fermaja-language-option:hover {
        background: var(--gold-soft, rgba(217,154,0,.10));
      }

      .fermaja-language-option.active {
        background: rgba(35,91,53,.07);
        color: var(--green, #235b35);
        font-weight: 800;
      }

      .fermaja-language-flag {
        font-size: 1.1rem;
      }

      .fermaja-language-check {
        opacity: 0;
        color: var(--gold, #d99a00);
        font-weight: 900;
      }

      .fermaja-language-option.active .fermaja-language-check {
        opacity: 1;
      }

      html[dir="rtl"] .fermaja-language-menu {
        transform-origin: top left;
      }

      /* RTL/LTR base helpers */
      html[dir="rtl"] body {
        direction: rtl;
      }

      html[dir="ltr"] body {
        direction: ltr;
      }

      html[dir="rtl"] .fermaja-language-trigger,
      html[dir="rtl"] .fermaja-language-option {
        font-family: "Cairo", sans-serif;
      }

      html[dir="ltr"] .fermaja-language-trigger,
      html[dir="ltr"] .fermaja-language-option {
        font-family: "Cairo", sans-serif;
      }

      @media (max-width: 768px) {
        .fermaja-language-trigger {
          min-height: 36px;
          padding: 7px 9px;
          font-size: .72rem;
        }

        .fermaja-language-current {
          display: none;
        }

        .fermaja-language-menu {
          width: 165px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .fermaja-language-trigger,
        .fermaja-language-menu,
        .fermaja-language-chevron {
          transition: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function init() {
    injectStyles();
    createLanguageSwitcher();

    const language = getLanguage();
    translatePage(language);

    /*
     * Make the selected language available to other project scripts.
     * This does not replace or modify existing application logic.
     */
    window.FermajaI18n = {
      getLanguage,
      setLanguage,
      translatePage,
      languages: LANGUAGES,
      translations
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
