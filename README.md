# SIGEA Mobile

Sistema de Gestão de Espaços Acadêmicos — versão mobile nativa (Android) do
SIGEA, construída com **Expo Router** e **React Native**. Permite localizar
salas em um mapa 2D interativo, gerenciar reservas e administrar usuários,
tudo em um único app.

Este projeto é a migração da versão web do SIGEA (React + Vite + react-router)
para um app nativo, mantendo a identidade visual original e adicionando CRUD
completo para salas, reservas e usuários.

## Índice

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração de ambiente](#configuração-de-ambiente)
- [Executando o projeto](#executando-o-projeto)
- [Scripts disponíveis](#scripts-disponíveis)
- [CRUD implementado](#crud-implementado)
- [Limitações conhecidas](#limitações-conhecidas)
- [Equipe](#equipe)
- [Licença](#licença)

## Funcionalidades

- 🗺️ **Mapa 2D de salas** por bloco e andar, com status em tempo real
  (disponível / ocupada / manutenção).
- ✏️ **Editor de mapa por toque**: monte, mova e remova salas e elementos
  (corredor, banheiro, escada, entrada, parede) diretamente no celular.
- 📅 **Gestão de reservas**: criar, concluir, cancelar e excluir reservas, com
  indicadores de ocupação e sincronização com API externa.
- 👥 **Gestão de usuários**: cadastro, edição e remoção de usuários, com
  perfis de acesso (administrador, coordenador, professor, aluno).
- 🔐 **Autenticação** com sessão persistente opcional ("manter sessão ativa").
- 🌗 **Tema claro/escuro** automático (segue o sistema), com alternância manual.

## Tecnologias

| Categoria | Tecnologia |
|---|---|
| Framework | [Expo](https://expo.dev) (SDK 56) + [React Native](https://reactnative.dev) |
| Roteamento | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| Estilização | [NativeWind](https://www.nativewind.dev/) (Tailwind CSS para React Native) |
| Linguagem | TypeScript |
| HTTP | [axios](https://axios-http.com/) |
| Persistência local | [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) |
| Ícones | [lucide-react-native](https://lucide.dev/) |
| Gestos/animações | react-native-gesture-handler, react-native-reanimated |
| Outros | expo-linear-gradient, @react-native-community/datetimepicker |

Veja a justificativa de cada escolha técnica em [APRESENTACAO.md](./APRESENTACAO.md).

## Estrutura do projeto

```
src/
├── app/            # Rotas (Expo Router): login, tabs (Início/Cadastro/Reservas/Usuários)
├── components/      # Componentes de tela + design system (components/ui)
├── contexts/          # AuthContext (autenticação)
├── data/               # Camada de dados/CRUD (roomsApi, reservationsApi, usersApi)
├── services/            # Cliente HTTP (authService)
├── hooks/                # useFloorMap, useBlocks, useFloors
├── lib/                   # Helpers (cn, mixedChildren)
└── theme/                  # Cores de marca
```

Diagrama completo de pastas e fluxo de dados em [ARCHITECTURE.md](./ARCHITECTURE.md).

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- npm (instalado junto com o Node.js)
- App **[Expo Go](https://expo.dev/go)** instalado no celular Android (para
  testar sem precisar de Android Studio), ou um emulador Android configurado

## Instalação

```bash
git clone <url-do-repositorio>
cd sigeaMobileNovo/sigeaMobile
npm install
```

## Configuração de ambiente

Copie o arquivo de exemplo e ajuste se necessário:

```bash
cp .env.example .env
```

| Variável | Descrição | Padrão |
|---|---|---|
| `EXPO_PUBLIC_HOST_API` | URL base da API de autenticação/usuários | `https://api.sigea.fun` |

## Executando o projeto

```bash
npx expo start
```

No terminal vai aparecer um QR code:

- **Celular Android**: escaneie o QR code com o app Expo Go.
- **Emulador Android**: pressione `a` no terminal (requer Android Studio configurado).
- **Web** (preview rápido no navegador, sem todos os recursos nativos): `npm run web`.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run start` | Inicia o servidor de desenvolvimento (Metro) |
| `npm run android` | Inicia e abre no emulador/dispositivo Android |
| `npm run web` | Inicia a versão web (react-native-web) |
| `npm run lint` | Executa o lint do Expo |
| `npx tsc --noEmit` | Verifica os tipos TypeScript sem gerar build |

## CRUD implementado

| Entidade | Criar | Ler | Atualizar | Excluir |
|---|---|---|---|---|
| Salas | ✅ paleta no mapa / diálogo "Nova Sala" | ✅ | ✅ detalhes dinâmicos | ✅ |
| Reservas | ✅ diálogo "Nova Reserva" | ✅ | ✅ concluir/cancelar | ✅ |
| Usuários | ✅ | ✅ | ✅ | ✅ |

## Limitações conhecidas

- **Salas e reservas** ainda usam uma camada de dados em memória (mock) — a
  estrutura já está pronta em `src/data/` para ser trocada por chamadas reais
  de API sem alterar as telas.
- **Usuários** já consomem a API real do projeto (`https://api.sigea.fun`).
- A geração da build nativa final (`.apk`/`.aab`) via **EAS Build** ou
  **Android Studio local** ainda não foi configurada neste repositório.

## Equipe

Projeto desenvolvido por: Nicolas Wolf, Vinicius Antonio Lourençon, Ryan Lopes
Hadas, Guilherme Alves Bispo, Fillype Oliveira Amorim e Jonathan Patrocínio
dos Santos.

## Licença

Projeto acadêmico desenvolvido para fins educacionais. Consulte o arquivo
[LICENSE](./LICENSE) para mais detalhes.
