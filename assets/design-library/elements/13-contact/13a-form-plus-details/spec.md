# 13a — Formulario + Detalhes de Contato

## Quando usar
- Pagina /contato padrao de sites institucionais.
- SaaS com atendimento personalizado antes da compra.
- Quando empresa quer mostrar transparencia (endereco fisico, horario).

## Quando NAO usar
- Contato e 100% self-service (use help center / chatbot).
- Empresa 100% remota sem endereco fisico (adaptar campos).
- Volume alto de leads — preferir formulario especifico por intent.

## Props principais
- `onSubmit`: callback com `{ name, email, message }`.
- `className`: override.

## Dependencias
- `react` com `useState`.
- `lucide-react` (`Mail`, `MapPin`, `Phone`, `Clock`, `Send`).
- Tailwind.

## Variacoes
- Com campo "Assunto" (dropdown de categoria).
- Integracao com HubSpot Forms ou Formspree.
- Mapa embedado substituindo o card de upgrade.
- reCAPTCHA v3 para evitar spam.

## Anti-patterns
- Formulario sem `<label>` acessivel em cada input.
- Sem feedback apos submit (role="status" ausente).
- Campos obrigatorios sem marcacao visual de erro.
- Enviar sem validar email (aceitar "abc@abc").
