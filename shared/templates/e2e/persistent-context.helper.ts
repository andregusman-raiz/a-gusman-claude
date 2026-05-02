/**
 * Persistent Context Helper — Playwright
 *
 * Lança browser com profile persistente por projeto. Sessão (cookies, localStorage,
 * tokens) é mantida entre runs em ~/.cache/playwright-claude/<projeto>/.
 *
 * Suporta 3 modos:
 *  1. Profile isolado por projeto (default)
 *  2. SSO Google centralizado — 1 login Google, N apps autenticadas
 *  3. Multi-role (admin/user) com profiles separados
 *
 * USO APENAS PARA QAT MANUAL E EXPLORAÇÃO. NUNCA EM CI.
 *
 * Em CI: usar `storageState` (login fresco por run) — ver smoke.template.spec.ts.
 */
import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

export type ProjectId =
  | 'raiz-platform'
  | 'profdigital'
  | 'automata'
  | 'totvs-educacional'
  | 'sophia-educacional'
  | 'fgts-platform'
  | 'raiz-agent-dashboard'
  | 'chamada-app'
  | 'jusraiz'
  | 'salarios-platform'
  | 'bi-raiz'
  | 'supabase-studio'
  | 'vercel-dashboard'
  | 'hubspot'
  | 'github'
  | 'sentry'
  | 'google-sso'; // perfil compartilhado para SSO Google

const PROJECT_URLS: Record<ProjectId, string> = {
  'raiz-platform': 'http://localhost:3000',
  profdigital: 'http://localhost:3001',
  automata: 'http://localhost:3002',
  'totvs-educacional': 'http://localhost:3003',
  'sophia-educacional': 'http://localhost:3004',
  'fgts-platform': 'http://localhost:3005',
  'raiz-agent-dashboard': 'http://localhost:4200',
  'chamada-app': 'http://localhost:3001',
  jusraiz: 'https://app.jusraiz.com',
  'salarios-platform': 'http://localhost:3000',
  'bi-raiz': 'http://localhost:3000',
  'supabase-studio': 'https://supabase.com/dashboard',
  'vercel-dashboard': 'https://vercel.com/dashboard',
  hubspot: 'https://app.hubspot.com',
  github: 'https://github.com',
  sentry: 'https://sentry.io',
  'google-sso': 'https://accounts.google.com',
};

/**
 * Apps que suportam SSO Google. Para esses, recomendado usar `googleSso: true`
 * para compartilhar profile com Google e auto-autenticar via OAuth.
 */
export const GOOGLE_SSO_SUPPORTED: ProjectId[] = [
  'raiz-platform', // Supabase Auth com Google OAuth habilitado
  'profdigital',
  'automata',
  'sophia-educacional',
  'fgts-platform',
  'raiz-agent-dashboard',
  'jusraiz',
  'salarios-platform',
  'bi-raiz',
  'supabase-studio',
  'vercel-dashboard',
  'hubspot',
  'sentry',
];

/**
 * Apps que NAO suportam Google SSO (usam auth proprio).
 */
export const GOOGLE_SSO_UNSUPPORTED: ProjectId[] = [
  'totvs-educacional', // TOTVS Auth proprio
  'chamada-app', // TOTVS Auth proprio
  'github', // auth GitHub proprio
];

export interface LaunchOptions {
  url?: string;
  headless?: boolean;
  viewport?: { width: number; height: number };
  /** profile suffix para multi-role (ex: 'admin' → raiz-platform-admin) */
  role?: string;
  openPage?: boolean;
  /**
   * Usa profile compartilhado `google-sso` em vez de profile do projeto.
   * Permite que 1 login Google autentique todas apps que suportam OAuth Google.
   * Ignora `role` (SSO sempre 1 sessao por conta Google).
   */
  googleSso?: boolean;
  /**
   * Auto-clica em "Continue with Google" / "Sign in with Google" ao detectar.
   * Requer googleSso: true OU profile que ja tenha sessao Google.
   * Default: true quando googleSso: true.
   */
  autoGoogleLogin?: boolean;
}

export interface LaunchResult {
  context: BrowserContext;
  page: Page;
  profileDir: string;
  isFirstRun: boolean;
  /** Disparado se autoGoogleLogin clicou no botao OAuth */
  googleSsoTriggered: boolean;
}

export async function launchPersistentContext(
  project: ProjectId,
  options: LaunchOptions = {}
): Promise<LaunchResult> {
  const useGoogleSso = options.googleSso === true;

  if (useGoogleSso && GOOGLE_SSO_UNSUPPORTED.includes(project)) {
    throw new Error(
      `Projeto "${project}" nao suporta Google SSO. Apps suportadas: ${GOOGLE_SSO_SUPPORTED.join(', ')}`
    );
  }

  // SSO usa profile compartilhado. Sem SSO usa profile-por-projeto (com role opcional).
  const profileName = useGoogleSso
    ? 'google-sso'
    : options.role
      ? `${project}-${options.role}`
      : project;

  const profileDir = join(homedir(), '.cache', 'playwright-claude', profileName);
  const isFirstRun = !existsSync(join(profileDir, 'Default'));

  if (!existsSync(profileDir)) {
    mkdirSync(profileDir, { recursive: true });
  }

  const context = await chromium.launchPersistentContext(profileDir, {
    channel: 'chromium',
    headless: options.headless ?? false,
    viewport: options.viewport ?? { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });

  const targetUrl = options.url ?? PROJECT_URLS[project];
  const page = context.pages()[0] ?? (await context.newPage());

  if (options.openPage !== false && targetUrl) {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  }

  let googleSsoTriggered = false;
  const shouldAutoLogin = useGoogleSso && (options.autoGoogleLogin ?? true);

  if (shouldAutoLogin && project !== 'google-sso') {
    googleSsoTriggered = await tryClickGoogleLogin(page);
  }

  if (isFirstRun) {
    if (useGoogleSso) {
      console.log(
        `[persistent-context] PRIMEIRA RUN do profile google-sso. ` +
          `Faça login no Google manualmente. ` +
          `Apos isso, todos os apps que suportam OAuth Google ficarao autenticados.`
      );
    } else {
      console.log(
        `[persistent-context] PRIMEIRA RUN para "${profileName}". ` +
          `Faça login manualmente. Profile salvo em: ${profileDir}`
      );
    }
  } else {
    console.log(
      `[persistent-context] reusando profile "${profileName}". ` +
        `Se sessão expirou, faça login novamente.`
    );
  }

  return { context, page, profileDir, isFirstRun, googleSsoTriggered };
}

/**
 * Tenta clicar em botão "Sign in with Google" / "Continue with Google" / "Login with Google"
 * detectando textos comuns. Retorna true se clicou.
 */
export async function tryClickGoogleLogin(page: Page): Promise<boolean> {
  const googleButtonPatterns = [
    /sign in with google/i,
    /continue with google/i,
    /log ?in with google/i,
    /entrar com google/i,
    /continuar com google/i,
    /com google/i,
  ];

  for (const pattern of googleButtonPatterns) {
    const button = page.getByRole('button', { name: pattern }).first();
    const link = page.getByRole('link', { name: pattern }).first();

    for (const candidate of [button, link]) {
      try {
        if (await candidate.isVisible({ timeout: 1500 })) {
          await candidate.click();
          await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });
          return true;
        }
      } catch {
        // continua tentando proximo pattern
      }
    }
  }

  // Fallback: img/span com texto "Google" dentro de um botao
  const googleByText = page.locator(
    'button:has-text("Google"), a:has-text("Google"), [role="button"]:has-text("Google")'
  );
  try {
    if (await googleByText.first().isVisible({ timeout: 1500 })) {
      await googleByText.first().click();
      await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });
      return true;
    }
  } catch {
    // sem botao Google detectavel
  }

  return false;
}

/**
 * Helper especifico para fluxos onde voce ja tem Google logado e quer abrir
 * uma app autenticando direto via OAuth.
 *
 * Exemplo:
 *   const { context, page, googleSsoTriggered } = await loginViaGoogleSso('raiz-platform');
 *   if (googleSsoTriggered) {
 *     await page.waitForURL('**\/dashboard');  // aguarda redirect pos-OAuth
 *   }
 */
export async function loginViaGoogleSso(
  project: ProjectId,
  options: Omit<LaunchOptions, 'googleSso' | 'autoGoogleLogin'> = {}
): Promise<LaunchResult> {
  return launchPersistentContext(project, {
    ...options,
    googleSso: true,
    autoGoogleLogin: true,
  });
}

export const PERSISTENT_CONTEXT_WARNING =
  'launchPersistentContext NÃO deve ser usado em CI. Use storageState.';
