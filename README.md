# Progressão Financeira 📈

Aplicativo de controle financeiro pessoal **100% Offline-first**, moderno e intuitivo, construído com SvelteKit e IndexedDB.

## 🚀 Tecnologias

- **Framework**: [SvelteKit](https://kit.svelte.dev/)
- **Estilização**: [TailwindCSS](https://tailwindcss.com/)
- **Banco de Dados**: [IndexedDB](https://developer.mozilla.org/pt-BR/docs/Web/API/IndexedDB_API) com [Dexie.js](https://dexie.org/)
- **Ícones**: [Lucide Svelte](https://lucide.dev/)
- **Offline**: PWA via Service Workers

## ✨ Funcionalidades (MVP)

1.  **Dashboard Inteligente**: Visualização de saldo, receitas, despesas e variação percentual.
2.  **Gráfico Anual**: Acompanhe as altas e baixas de seus gastos ao longo do ano.
3.  **Gestão de Lançamentos**: CRUD completo de receitas e despesas com filtros por data e categoria.
4.  **Categorização**: Organize seus gastos com cores e nomes personalizados.
5.  **Orçamentos**: Defina limites mensais por categoria e acompanhe o progresso em tempo real.
6.  **Recorrências**: Automatize lançamentos fixos (mensalidades, assinaturas) com geração em um clique.
7.  **Backup Local**: Exporte seus dados para JSON e importe em qualquer navegador.
8.  **Tema Dark/Light**: Interface adaptável para melhor conforto visual.

## 🛠️ Como Rodar Localmente

1.  Clone o repositório
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
4.  Acesse `http://localhost:5173`

## 💻 Versão Desktop (Electron)

Você pode transformar este projeto em um aplicativo nativo para Windows.

### Rodar em modo de desenvolvimento (Hot Reload)

Abre uma janela do Electron com as ferramentas de desenvolvedor ativadas:

```bash
npm run electron:dev
```

### Gerar executável (Instalador)

Gera o instalador `.exe` na pasta `dist`:

```bash
npm run electron:build
```

O arquivo final estará em: `dist/Progressão Financeira Setup X.X.X.exe`

## 📂 Estrutura do Projeto

- `src/lib/db`: Esquema do banco de dados e repositórios.
- `src/lib/domain`: Tipos globais e utilitários (moeda, datas).
- `src/lib/services`: Lógica de negócio (agregação, cálculos, backups).
- `src/lib/stores`: Estado global (tema, data selecionada, filtros).
- `src/lib/ui`: Componentes de interface e layouts.
- `src/routes`: Páginas e roteamento.

## 🔒 Privacidade e Sincronização

Atualmente, todos os dados são armazenados **exclusivamente no seu navegador**. Nenhuma informação é enviada para servidores externos.
Para sincronização em múltiplos dispositivos no futuro, o app está preparado para uma camada de storage abstrata que permitirá integração com Firebase ou Supabase.

## 💾 Backup

Para garantir que você não perca seus dados ao limpar o cache do navegador, utilize a função de **Exportar Backup** na tela de Configurações regularmente.
