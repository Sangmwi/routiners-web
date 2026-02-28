import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let THEME_TOKENS;
const localDist = path.resolve(
  process.cwd(),
  '..',
  'routiners-shared-contracts',
  'dist',
  'theme-tokens.js'
);

if (fs.existsSync(localDist)) {
  ({ THEME_TOKENS } = require(localDist));
} else {
  try {
    ({ THEME_TOKENS } = require('@sauhi/shared-contracts'));
  } catch {
    // no-op: handled by guard below
  }
}

if (!THEME_TOKENS) {
  throw new Error(
    'THEME_TOKENS not found. Build/publish @sauhi/shared-contracts or build local shared dist.'
  );
}

const { semantic, surface, edge, hint, ring, brand, layout } = THEME_TOKENS;

const mapSemantic = (mode) => ({
  '--background': semantic[mode].background,
  '--foreground': semantic[mode].foreground,
  '--primary': semantic[mode].primary,
  '--primary-foreground': semantic[mode].primaryForeground,
  '--primary-muted': semantic[mode].primaryMuted,
  '--secondary': semantic[mode].secondary,
  '--secondary-foreground': semantic[mode].secondaryForeground,
  '--muted': semantic[mode].muted,
  '--muted-foreground': semantic[mode].mutedForeground,
  '--card': semantic[mode].card,
  '--card-foreground': semantic[mode].cardForeground,
  '--border': semantic[mode].border,
  '--input': semantic[mode].input,
  '--destructive': semantic[mode].destructive,
  '--destructive-foreground': semantic[mode].destructiveForeground,
  '--like': semantic[mode].like,
  '--success': semantic[mode].success,
  '--success-foreground': semantic[mode].successForeground,
  '--warning': semantic[mode].warning,
  '--warning-foreground': semantic[mode].warningForeground,
  '--warning-muted': semantic[mode].warningMuted,
  '--scheduled': semantic[mode].scheduled,
  '--scheduled-foreground': semantic[mode].scheduledForeground,
  '--positive': semantic[mode].positive,
  '--negative': semantic[mode].negative,
  '--incomplete': semantic[mode].incomplete,
  '--surface-incomplete': semantic[mode].surfaceIncomplete,
});

const mapScale = (mode) => {
  const light = brand.green;
  if (mode === 'light') {
    return {
      '--color-green-50': light[50],
      '--color-green-100': light[100],
      '--color-green-200': light[200],
      '--color-green-300': light[300],
      '--color-green-400': light[400],
      '--color-green-500': light[500],
      '--color-green-600': light[600],
      '--color-green-700': light[700],
      '--color-green-800': light[800],
      '--color-green-900': light[900],
      '--color-green-950': light[950],
    };
  }
  return {
    '--color-green-50': light[950],
    '--color-green-100': light[900],
    '--color-green-200': light[800],
    '--color-green-300': light[700],
    '--color-green-400': light[600],
    '--color-green-500': light[500],
    '--color-green-600': light[400],
    '--color-green-700': light[300],
    '--color-green-800': light[200],
    '--color-green-900': light[100],
    '--color-green-950': light[50],
  };
};

const mapDerived = (mode) => ({
  '--surface-secondary': surface[mode].secondary,
  '--surface-hover': surface[mode].hover,
  '--surface-muted': surface[mode].muted,
  '--surface-accent': surface[mode].accent,
  '--surface-accent-strong': surface[mode].accentStrong,
  '--surface-danger': surface[mode].danger,
  '--surface-scheduled': surface[mode].scheduled,
  '--surface-glass': surface[mode].glass,
  '--surface-pressed': surface[mode].pressed,
  '--hint-faint': hint[mode].faint,
  '--hint': hint[mode].normal,
  '--hint-strong': hint[mode].strong,
  '--edge-subtle': edge[mode].subtle,
  '--edge-faint': edge[mode].faint,
  '--edge-divider': edge[mode].divider,
  '--edge-error': edge[mode].error,
  '--ring-focus': ring[mode].focus,
  '--ring-accent': ring[mode].accent,
  '--ring-error': ring[mode].error,
  '--modal-backdrop': mode === 'dark' ? layout.modal.backdropDark : layout.modal.backdropLight,
});

const mapLayout = () => ({
  '--space-2': `${layout.space[2]}px`,
  '--space-4': `${layout.space[4]}px`,
  '--space-6': `${layout.space[6]}px`,
  '--space-8': `${layout.space[8]}px`,
  '--space-10': `${layout.space[10]}px`,
  '--space-12': `${layout.space[12]}px`,
  '--space-16': `${layout.space[16]}px`,
  '--space-20': `${layout.space[20]}px`,
  '--space-24': `${layout.space[24]}px`,
  '--radius-sm': `${layout.radius.sm}px`,
  '--radius-md': `${layout.radius.md}px`,
  '--radius-lg': `${layout.radius.lg}px`,
  '--radius-xl': `${layout.radius.xl}px`,
  '--radius-2xl': `${layout.radius.x2}px`,
  '--text-title': `${layout.typography.title}px`,
  '--text-body': `${layout.typography.body}px`,
  '--text-caption': `${layout.typography.caption}px`,
  '--text-button': `${layout.typography.button}px`,
  '--row-height': `${layout.row.height}px`,
  '--row-padding-x': `${layout.row.paddingX}px`,
  '--row-padding-y': `${layout.row.paddingY}px`,
  '--row-divider-inset': `${layout.row.dividerInset}px`,
  '--section-gap': `${layout.section.gap}px`,
  '--section-title-size': `${layout.section.titleSize}px`,
  '--modal-radius': `${layout.modal.cardRadius}px`,
  '--modal-max-width': `${layout.modal.maxWidth}px`,
  '--modal-padding-x': `${layout.modal.paddingX}px`,
  '--modal-padding-y': `${layout.modal.paddingY}px`,
  '--modal-title-size': `${layout.modal.titleSize}px`,
  '--modal-message-size': `${layout.modal.messageSize}px`,
  '--modal-message-line-height': `${layout.modal.messageLineHeight}px`,
  '--modal-action-min-height': `${layout.modal.actionMinHeight}px`,
  '--modal-action-min-width': `${layout.modal.actionMinWidth}px`,
  '--modal-action-radius': `${layout.modal.actionRadius}px`,
  '--modal-content-gap': `${layout.modal.contentGap}px`,
  '--modal-action-gap': `${layout.modal.actionGap}px`,
  '--modal-button-gap': `${layout.modal.buttonGap}px`,
  '--modal-backdrop-blur': `${Math.max(2, Math.round(layout.modal.blurIntensity / 6))}px`,
});

const toCssBlock = (selector, values) => {
  const lines = Object.entries(values).map(([key, value]) => `  ${key}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
};

const lightVars = {
  ...mapSemantic('light'),
  ...mapScale('light'),
  ...mapDerived('light'),
  ...mapLayout(),
};
const darkVars = {
  ...mapSemantic('dark'),
  ...mapScale('dark'),
  ...mapDerived('dark'),
  ...mapLayout(),
};

const content = [
  '/* Auto-generated from @sauhi/shared-contracts THEME_TOKENS */',
  toCssBlock(':root', lightVars),
  '@media (prefers-color-scheme: dark) {',
  toCssBlock('  :root', darkVars),
  '}',
  toCssBlock('[data-theme="light"]', lightVars),
  toCssBlock('[data-theme="dark"]', darkVars),
  '',
].join('\n\n');

const outputPath = path.join(process.cwd(), 'app', 'theme-tokens.generated.css');
fs.writeFileSync(outputPath, content, 'utf8');
console.log(`Generated ${outputPath}`);
