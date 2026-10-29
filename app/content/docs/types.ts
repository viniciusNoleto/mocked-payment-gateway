import type { SupportedLocale } from '#shared/constants/locale';

/** Campo de um corpo de requisição. `name` usa ponto para campos aninhados (`payer.name`). */
export type DocsBodyField = { name: string; type: string; required?: boolean; text: string };

export type DocsBodyLabels = { body: string; required: string; more: string; less: string; head: [string, string, string] };

/** Rota da referência. Com corpo, o exemplo aparece logo abaixo dela e os campos ficam num "ver mais". */
export type DocsEndpoint = { method: string; path: string; description: string; body?: { fields: DocsBodyField[]; example: string } };

export type CodeSample = { label: string; lang: string; code: string };

/**
 * Blocos de uma página da documentação. Texto aceita uma marcação mínima:
 * `código`, **negrito** e [rótulo](/caminho).
 */
export type DocsBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'code'; code: string; lang: string; title?: string }
  | { type: 'tabs'; samples: CodeSample[] }
  | { type: 'table'; head: string[]; rows: string[][]; code?: number[]; numeric?: number[] }
  | { type: 'endpoints'; head: [string, string, string]; rows: DocsEndpoint[]; bodyLabels: DocsBodyLabels }
  | { type: 'lifecycle' };

export type DocsSectionContent = { id: string; title: string; blocks: DocsBlock[] };

export type DocsPageContent = {
  title: string;
  lead: string;
  sections: DocsSectionContent[];
  next?: { to: string; label: string };
};

/** Uma página nos três idiomas. Recebe a URL do gateway para os exemplos saírem prontos para copiar. */
export type DocsPageDefinition = (ctx: { origin: string }) => Record<SupportedLocale, DocsPageContent>;
