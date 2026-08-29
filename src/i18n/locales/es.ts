import type { Translation } from "../types";

export const es: Translation = {
  app: {
    title: "WoW Font Changer",
    subtitle: "Widget compacto de fuentes",
  },
  header: { notInstalled: " (no instalado)" },
  dropzone: {
    loadingPreview: "Cargando vista previa de la fuente…",
    dragDrop: "Arrastra y suelta .ttf / .otf aquí",
    dragDropHint:
      "La vista previa se actualiza al instante. Las fuentes .otf se guardan como .ttf para WoW.",
    browseFont: "Buscar archivo de fuente",
    loadedFont: "Fuente cargada",
    clear: "Borrar",
  },
  preview: {
    title: "Vista previa en vivo",
    combatLabel: "Texto de combate",
    combatSample: "¡Golpe crítico! 4.821",
    questLabel: "Texto de misiones e interfaz",
    questSample: "Aceptar misión",
    chatLabel: "Texto del chat",
    chatSample: "¡Listo!",
    chatPlayer: "Jugador",
  },
  footer: {
    working: "Procesando…",
    loading: "Cargando…",
    applyFont: "Aplicar fuente",
    restoreDefaults: "Restaurar valores predeterminados",
  },
  settings: {
    title: "Ajustes",
    close: "Cerrar ajustes",
    autoDetect: "Detectar WoW automáticamente",
    autoDetectHintWindows: "Buscar en el registro, todas las unidades y rutas habituales",
    autoDetectHintMac: "Buscar en Applications, volúmenes y rutas habituales",
    autoDetectHintLinux: "Buscar en Games, prefijos de Wine y Lutris/Bottles",
    noPathSelected: "Ninguna ruta seleccionada",
    browseWow: "Buscar carpeta de WoW",
    activeTarget: "Destino activo",
    notDetected: "No detectado",
    fontTargets: "Destinos de fuente",
    fontTargetsHint:
      "WoW requiere nombres de archivo exactos (distinguen mayúsculas) con extensión .ttf, aunque la fuente original sea .otf. Al aplicar también se eliminan archivos de caché GPU .slug / .slugo obsoletos.",
    perSlotFonts: "Fuentes por ranura",
    perSlotFontsHint:
      "Opcional. Asigna a una ranura su propia fuente. Las ranuras vacías usan la fuente principal de arriba.",
    perSlotUsesMain: "Usa la fuente principal",
    localePacks: "Ranuras de fuente regional",
    localePacksHint:
      "También escribe archivos de fuente específicos de la región usados por clientes de WoW no latinos (cirílico, coreano, chino).",
    compressBackup: "Comprimir copia de seguridad",
    compressBackupHint: "Comprimir la carpeta .backup en zip tras aplicar",
    language: "Idioma",
    languageHint: "Idioma de la interfaz de la aplicación",
    about: "Acerca de",
  },
  fontMappings: {
    combat: {
      label: "Texto de combate",
      description: "Números de daño flotantes",
    },
    chat: { label: "Chat", description: "Chat y textos informativos pequeños" },
    mail: {
      label: "Correo y encabezados de misiones",
      description: "Ventana de correo y títulos del registro de misiones",
    },
    quest: {
      label: "Misiones e interfaz",
      description: "Diálogos de misiones, botones, nombres",
    },
    all: {
      label: "Reemplazar todo",
      description: "Todas las ranuras de fuente latinas de WoW",
    },
  },
  localePacks: {
    cyrillic: {
      label: "Cirílico",
      description: "Clientes rusos y de Europa del Este",
    },
    korean: {
      label: "Coreano",
      description: "Ranuras de fuente del cliente coreano",
    },
    chinese: {
      label: "Chino",
      description: "Ranuras de chino simplificado y tradicional",
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
    applyTitle: "¿Aplicar fuente personalizada?",
    applyBody:
      "Esto reemplazará los archivos de fuente de WoW en tu carpeta Fonts. Los originales se respaldan primero. Reinicia WoW después de aplicar.",
    applyOk: "Aplicar",
    applyCancel: "Cancelar",
    restoreTitle: "¿Restaurar valores predeterminados?",
    restoreBody: "¿Restaurar las fuentes originales desde la carpeta .backup?",
    restoreOk: "Restaurar",
    restoreCancel: "Cancelar",
    pickFontTitle: "Seleccionar archivo de fuente",
    pickWowTitle: "Seleccionar carpeta de World of Warcraft",
    fontFilter: "Fuente",
  },
  status: {
    pathUpdated: "Ruta de WoW actualizada.",
    applied: "Aplicado a {{count}} ranuras. Reinicia WoW para ver los cambios.",
    appliedOne: "Aplicado a 1 ranura. Reinicia WoW para ver los cambios.",
    slugCleared: " Se eliminaron {{count}} archivos de caché Slug.",
    slugClearedOne: " Se eliminó 1 archivo de caché Slug.",
    backupZip: " Zip de copia de seguridad: {{path}}",
    restored: "Se restauraron {{count}} fuentes desde la copia de seguridad.",
    restoredOne: "Se restauró 1 fuente desde la copia de seguridad.",
    nothingToRestore: "Nada que restaurar.",
  },
  errors: {
    dropFontFirst: "Primero suelta un archivo de fuente.",
    selectTarget: "Selecciona al menos un destino de fuente en Ajustes.",
    wowNotFound: "Instalación de WoW no encontrada. Configura una ruta en Ajustes.",
    fontMustBeTtfOtf: "La fuente debe ser un archivo .ttf o .otf",
  },
};
