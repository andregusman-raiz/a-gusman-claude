/**
 * QAT Cenario Exemplo — Chat com pergunta complexa
 *
 * Copie para `tests/qat/scenarios/qat-XX-nome.spec.ts` no seu projeto.
 * Ajuste o cenario para as funcionalidades do seu projeto.
 *
 * Este exemplo demonstra o fluxo completo:
 * 1. Navegar ate a funcionalidade
 * 2. Executar a acao do usuario
 * 3. Aguardar output completo
 * 4. Capturar output (texto + screenshot)
 * 5. Avaliar com AI-as-Judge
 * 6. Verificar score contra threshold
 */

import { test, expect } from '../fixtures/qat-fixture';
import { qatConfig } from '../qat.config';
import { waitForOutputStable } from '../helpers/capture';

/**
 * CUSTOMIZE: Defina o cenario que este arquivo testa.
 * O ID deve corresponder ao cenario em qat.config.ts.
 */
const SCENARIO = qatConfig.scenarios.find((s) => s.id === 'QAT-02');

test.describe('QAT-02: Chat Agente — pergunta juridica complexa', () => {
  // Pular se cenario nao esta configurado ou desabilitado
  test.skip(!SCENARIO || !SCENARIO.enabled, 'Cenario QAT-02 nao habilitado');

  // Usar auth state para acessar funcionalidades protegidas
  test.use({ storageState: qatConfig.authStorageState });

  test('QAT-02: avaliar qualidade da resposta do chat', async ({
    page,
    captureScreenshotToDir,
    captureTextToDir,
    evaluateOutput,
  }) => {
    // Timeout do cenario (de qat.config.ts ou default)
    test.setTimeout(SCENARIO!.timeoutMs || qatConfig.defaultTimeoutMs);

    // --- 1. Navegar ate o chat ---
    await page.goto(`${qatConfig.baseUrl}/chat`);
    await page.waitForLoadState('networkidle');

    // Verificar que pagina de chat carregou
    await expect(page.getByRole('textbox')).toBeVisible({ timeout: 10_000 });

    // --- 2. Executar acao do usuario ---
    const userPrompt =
      'Explique os direitos do consumidor em caso de produto com defeito segundo o CDC brasileiro. ' +
      'Inclua: prazo para reclamacao, opcoes do consumidor, e responsabilidade do fornecedor.';

    await page.getByRole('textbox').fill(userPrompt);
    await page.getByRole('button', { name: /enviar/i }).click();

    // --- 3. Aguardar output completo ---
    // CUSTOMIZE: Ajuste o seletor para o elemento de resposta do seu app
    const outputSelector = '.message-assistant, [data-role="assistant"]';

    const outputComplete = await waitForOutputStable(
      page,
      outputSelector,
      SCENARIO!.timeoutMs || qatConfig.defaultTimeoutMs
    );

    if (!outputComplete) {
      // Timeout — capturar estado atual e avaliar como timeout
      await captureScreenshotToDir(page);
      const evaluation = await evaluateOutput(SCENARIO!, '', undefined);
      evaluation.overallScore = 0;
      evaluation.summary = `TIMEOUT: output nao completou em ${SCENARIO!.timeoutMs}ms`;
      evaluation.pass = false;
      expect(evaluation.pass).toBe(true); // Fail o teste
      return;
    }

    // --- 4. Capturar output ---
    const outputText = await captureTextToDir(page, outputSelector);
    await captureScreenshotToDir(page);

    // Verificar que output nao esta vazio
    expect(outputText.length).toBeGreaterThan(0);

    // --- 5. Avaliar com AI-as-Judge ---
    const evaluation = await evaluateOutput(
      SCENARIO!,
      `Pergunta do usuario: "${userPrompt}"\n\nResposta do agente:\n${outputText}`
    );

    // --- 6. Verificar score ---
    console.log(
      `[QAT-02] Score: ${evaluation.overallScore}/10 | Pass: ${evaluation.pass}`
    );
    console.log(`[QAT-02] Summary: ${evaluation.summary}`);

    // Log criterios individuais
    for (const criterion of evaluation.criteria) {
      console.log(
        `  - ${criterion.name}: ${criterion.score}/10 — ${criterion.feedback}`
      );
    }

    // Assert: score deve atingir threshold
    expect(
      evaluation.pass,
      `QAT-02 falhou: score ${evaluation.overallScore} < threshold ${qatConfig.passThreshold}. ` +
        `Summary: ${evaluation.summary}`
    ).toBe(true);
  });
});
