import type { Translation } from "../types";

export const ru: Translation = {
  app: {
    title: "WoW Font Changer",
    subtitle: "Компактный виджет шрифтов",
  },
  header: { notInstalled: " (не установлено)" },
  dropzone: {
    loadingPreview: "Загрузка предпросмотра шрифта…",
    dragDrop: "Перетащите .ttf / .otf сюда",
    dragDropHint:
      "Предпросмотр обновляется мгновенно. Исходники .otf сохраняются как .ttf для WoW.",
    browseFont: "Выбрать файл шрифта",
    loadedFont: "Загруженный шрифт",
    clear: "Очистить",
  },
  preview: {
    title: "Предпросмотр",
    combatLabel: "Боевой текст",
    combatSample: "Критический удар! 4 821",
    questLabel: "Текст заданий и интерфейса",
    questSample: "Принять задание",
    chatLabel: "Текст чата",
    chatSample: "Готов!",
    chatPlayer: "Игрок",
  },
  footer: {
    working: "Выполняется…",
    loading: "Загрузка…",
    applyFont: "Применить шрифт",
    restoreDefaults: "Восстановить по умолчанию",
  },
  settings: {
    title: "Настройки",
    close: "Закрыть настройки",
    autoDetect: "Автоопределение WoW",
    autoDetectHintWindows: "Поиск в реестре, на всех дисках и в типичных путях",
    autoDetectHintMac: "Поиск в Applications, томах и типичных путях",
    autoDetectHintLinux: "Поиск в папке Games, префиксах Wine и Lutris/Bottles",
    noPathSelected: "Путь не выбран",
    browseWow: "Выбрать папку WoW",
    activeTarget: "Активная цель",
    notDetected: "Не обнаружено",
    fontTargets: "Цели шрифтов",
    fontTargetsHint:
      "WoW требует точные имена файлов (с учётом регистра) с расширением .ttf, даже если исходный шрифт в формате .otf. При применении также удаляются устаревшие файлы GPU-кэша .slug / .slugo.",
    perSlotFonts: "Шрифты по слотам",
    perSlotFontsHint:
      "Необязательно. Назначьте слоту свой шрифт. Пустые слоты используют основной шрифт выше.",
    perSlotUsesMain: "Использует основной шрифт",
    localePacks: "Региональные слоты шрифтов",
    localePacksHint:
      "Также записывает региональные файлы шрифтов для нелатинских клиентов WoW (кириллица, корейский, китайский).",
    compressBackup: "Сжать резервную копию",
    compressBackupHint: "Архивировать папку .backup в zip после применения",
    language: "Язык",
    languageHint: "Язык интерфейса приложения",
    about: "О программе",
  },
  fontMappings: {
    combat: {
      label: "Боевой текст",
      description: "Всплывающие цифры урона",
    },
    chat: { label: "Чат", description: "Чат и мелкий информационный текст" },
    mail: {
      label: "Почта и заголовки заданий",
      description: "Окно почты и заголовки журнала заданий",
    },
    quest: {
      label: "Задания и интерфейс",
      description: "Диалоги заданий, кнопки, имена",
    },
    all: {
      label: "Заменить все",
      description: "Все латинские слоты шрифтов WoW",
    },
  },
  localePacks: {
    cyrillic: {
      label: "Кириллица",
      description: "Русские и восточноевропейские клиенты",
    },
    korean: {
      label: "Корейский",
      description: "Слоты шрифтов корейского клиента",
    },
    chinese: {
      label: "Китайский",
      description: "Слоты упрощённого и традиционного китайского",
    },
  },
  gameVersions: {
    retail: "Retail",
    ptr: "Retail PTR",
    beta: "Retail Beta",
    xptr: "Retail PTR 2",
    classic: "Classic",
    classicPtr: "Classic PTR",
    classicBeta: "Classic Beta",
    classicTitan: "Classic Titan",
    anniversary: "Anniversary",
    era: "Era",
    classicEraPtr: "Era PTR",
    classicEraBeta: "Era Beta",
  },
  gameGroups: {
    retail: "Retail",
    classic: "Classic",
    classicEra: "Classic Era",
  },
  dialogs: {
    applyTitle: "Применить пользовательский шрифт?",
    applyBody:
      "Это заменит файлы шрифтов WoW в папке Fonts. Сначала создаётся резервная копия оригиналов. Перезапустите WoW после применения.",
    applyOk: "Применить",
    applyCancel: "Отмена",
    restoreTitle: "Восстановить по умолчанию?",
    restoreBody: "Восстановить оригинальные шрифты из папки .backup?",
    restoreOk: "Восстановить",
    restoreCancel: "Отмена",
    pickFontTitle: "Выбрать файл шрифта",
    pickWowTitle: "Выбрать папку World of Warcraft",
    fontFilter: "Шрифт",
  },
  status: {
    pathUpdated: "Путь к WoW обновлён.",
    applied: "Применено к {{count}} слотам. Перезапустите WoW, чтобы увидеть изменения.",
    appliedOne: "Применено к 1 слоту. Перезапустите WoW, чтобы увидеть изменения.",
    slugCleared: " Удалено {{count}} файлов кэша Slug.",
    slugClearedOne: " Удалён 1 файл кэша Slug.",
    backupZip: " Архив резервной копии: {{path}}",
    restored: "Восстановлено {{count}} шрифтов из резервной копии.",
    restoredOne: "Восстановлен 1 шрифт из резервной копии.",
    nothingToRestore: "Нечего восстанавливать.",
  },
  errors: {
    dropFontFirst: "Сначала перетащите файл шрифта.",
    selectTarget: "Выберите хотя бы одну цель шрифта в Настройках.",
    wowNotFound: "Установка WoW не найдена. Укажите путь в Настройках.",
    fontMustBeTtfOtf: "Шрифт должен быть файлом .ttf или .otf",
  },
};
