/**
 * QAT v2 Rubrics — Index
 *
 * Exporta todas as rubricas especificas v2.
 * Importar rubricas por ID ou por nome.
 */

export { chatEducacionalRubric } from './chat-educacional.rubric';
export { extendedThinkingRubric } from './extended-thinking.rubric';
export { ragQueryRubric } from './rag-query.rubric';
export { planoDeAulaRubric } from './plano-de-aula.rubric';
export { relatorioExecutivoRubric } from './relatorio-executivo.rubric';
export { geracaoCodigoRubric } from './geracao-codigo.rubric';
export { imagemEducacionalRubric } from './imagem-educacional.rubric';

import type { QatRubricV2 } from '../specific-rubric.template';
import { chatEducacionalRubric } from './chat-educacional.rubric';
import { extendedThinkingRubric } from './extended-thinking.rubric';
import { ragQueryRubric } from './rag-query.rubric';
import { planoDeAulaRubric } from './plano-de-aula.rubric';
import { relatorioExecutivoRubric } from './relatorio-executivo.rubric';
import { geracaoCodigoRubric } from './geracao-codigo.rubric';
import { imagemEducacionalRubric } from './imagem-educacional.rubric';

/** Registry de todas as rubricas v2 por ID */
export const v2Rubrics: Record<string, QatRubricV2> = {
  'chat-educacional-v2': chatEducacionalRubric,
  'extended-thinking-v2': extendedThinkingRubric,
  'rag-query-v2': ragQueryRubric,
  'plano-de-aula-v2': planoDeAulaRubric,
  'relatorio-executivo-v2': relatorioExecutivoRubric,
  'geracao-codigo-v2': geracaoCodigoRubric,
  'imagem-educacional-v2': imagemEducacionalRubric,
};

/**
 * Busca rubrica v2 por ID.
 * Retorna undefined se nao encontrada (permite fallback para v1).
 */
export function getV2Rubric(id: string): QatRubricV2 | undefined {
  return v2Rubrics[id];
}

/**
 * Busca rubrica v2 por tipo + dominio.
 * Util quando cenario nao especifica ID diretamente.
 */
export function findV2Rubric(type: string, domain?: string): QatRubricV2 | undefined {
  return Object.values(v2Rubrics).find(
    (r) => r.type === type && (!domain || r.domain === domain)
  );
}
