# 🌎 **Screenless: Plataforma Comunitária para Bem-Estar Digital**

![Status](https://img.shields.io/badge/Status-Desenvolvido-brightgreen)

## 📚 Índice

- [Descrição](#descrição)
- [Objetivos do Projeto](#objetivos-do-projeto)
- [Justificativa e Benefícios](#justificativa-e-benefícios)
- [Alinhamento Estratégico](#alinhamento-estratégico)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Como Rodar a Aplicação](#como-rodar-a-aplicação)
- [Contribuição](#contribuição)
- [Licença](#licença)
- [Equipe](#equipe)

---

## 📝 Descrição

O projeto **Screenless** é uma plataforma comunitária inovadora que visa fortalecer o bem-estar, promover a educação de qualidade e prevenir a dependência digital entre crianças e adolescentes. Em um mundo cada vez mais conectado, a iniciativa oferece alternativas de convivência offline, incentivando hábitos saudáveis, a interação social e o desenvolvimento de competências socioemocionais. Através de eventos educativos, atividades dinâmicas e ações de valorização da participação, o Screenless busca fortalecer os vínculos familiares e sociais, promover o uso consciente da tecnologia e contribuir para a formação integral de jovens, criando um ambiente mais equilibrado e acolhedor.

---

## ✨ Objetivos do Projeto

Os principais objetivos do projeto Screenless são:

- Promover o bem-estar físico, emocional e social de crianças e adolescentes.

- Incentivar a educação de qualidade e o desenvolvimento de competências socioemocionais.

- Prevenir a dependência digital, estimulando o uso consciente da tecnologia.

- Fortalecer os vínculos familiares e sociais através de atividades offline.

- Realizar eventos educativos e atividades dinâmicas que estimulem a participação e a socialização.

- Valorizar a participação da comunidade por meio de premiações e reconhecimento.

---

## 💡 Justificativa e Benefícios

Em um cenário global onde a exposição prolongada às telas se tornou uma preocupação crescente, o projeto Screenless surge como uma resposta ativa aos impactos negativos do uso excessivo da internet na saúde mental, desenvolvimento social, qualidade do sono, aprendizagem e vínculos familiares de crianças e adolescentes. Muitos jovens enfrentam dificuldades para equilibrar o uso da tecnologia com outras dimensões importantes da vida, como o convívio social, as atividades físicas e a construção da autonomia. A dependência digital, frequentemente associada a problemas como ansiedade, baixa autoestima, isolamento e dificuldade de concentração, afeta diretamente o desempenho escolar e o bem-estar emocional.

O Screenless oferece alternativas de convivência offline por meio de eventos, atividades dinâmicas, oficinas e ações comunitárias que incentivam a presença, a participação e a socialização humana. Os benefícios incluem:

- **Promoção da Saúde Integral**: Redução dos riscos associados ao uso excessivo de telas, como problemas de visão, sedentarismo e distúrbios do sono.

- **Desenvolvimento Social e Emocional**: Estímulo à interação face a face, empatia, colaboração e resiliência.

- **Fortalecimento de Vínculos**: Reaproximação de famílias e amigos através de experiências compartilhadas no mundo real.

- **Educação e Conscientização**: Promoção do uso consciente e equilibrado da tecnologia, com foco na segurança online e no pensamento crítico.

- **Engajamento Comunitário**: Criação de um senso de pertencimento e responsabilidade coletiva pelo bem-estar das novas gerações.

Trata-se de uma iniciativa voltada para a transformação social, o autocuidado e a valorização de experiências reais e significativas.

---

## 🎯 Alinhamento Estratégico

Este projeto está alinhado com os seguintes Objetivos de Desenvolvimento Sustentável (ODS) da ONU para a Agenda 2030:

- **ODS 4: Educação de Qualidade**
  - Meta 4.1: Até 2030, garantir que todas as meninas e meninos concluam o ensino primário e secundário gratuito, equitativo e de qualidade, que conduza a resultados de aprendizagem relevantes e eficazes.

- **ODS 3: Boa Saúde e Bem-Estar**
  - Meta 3.4: Até 2030, reduzir em um terço a mortalidade prematura por doenças não transmissíveis por meio da prevenção e tratamento e promover a saúde mental e o bem-estar.

---

## 🛠️ Tecnologias Utilizadas

Este projeto utiliza as seguintes tecnologias:

### Frontend

- **React**: Biblioteca JavaScript para construção de interfaces de usuário.

- **React Router DOM**: Para roteamento de componentes na aplicação.

- **Axios**: Cliente HTTP baseado em Promises para fazer requisições a uma API.

- **React Icons**: Biblioteca de ícones.

- **Python:** Linguagem utilizada no Back-end

- **Web Vitals**: Para medição de métricas de desempenho web.

### Backend

- **Flask**: Microframework web para Python.

- **Flask-CORS**: Extensão para lidar com Cross-Origin Resource Sharing (CORS).

- **Flask-MySQL**: Extensão para integração com bancos de dados MySQL.

- **MySQL Connector/Python**: Driver para conectar Python a MySQL.

- **Werkzeug**: Conjunto de ferramentas WSGI para aplicações Python.

- **PyJWT**: Para codificação e decodificação de tokens JWT.

- **Gunicorn**: Servidor WSGI para Python.

- **Cloudinary**: Para gerenciamento de imagens e vídeos na nuvem.

---

## 📊 Estrutura do Projeto

O projeto Screenless é dividido em duas partes principais: `frontend` e `backend`.

```
📌 Raiz
├── 📂backend
│   ├── 📜app.py
│   ├── 📜database.py
│   ├── 📂models
│   ├── 📂routes
│   ├── 📂services
│   ├── 📂utils
│   └── 📝requirements.txt
├── 📂frontend            
│   ├── 📂public
│   ├── 📂src
│   │   ├── 📂assets
│   │   ├── 📂components
│   │   ├── 📂context
│   │   └── 📂pages
│   ├── 📝package.json
│   └── 📝package-lock.json
├── 📝LICENSE
├── 📝README.md
└── 📝package.json
```

---

## 📖 Funcionalidades

O projeto Screenless oferece as seguintes funcionalidades principais:

- **Gerenciamento de Eventos**: Criação, edição e visualização de eventos offline para a comunidade.

- **Gerenciamento de Desafios**: Definição e acompanhamento de desafios para incentivar a participação em atividades sem tela.

- **Perfis de Usuários**: Criação e gerenciamento de perfis para crianças, adolescentes e suas famílias.

- **Mural de Insígnias**: Sistema de gamificação com insígnias para reconhecer a participação e o engajamento.

---

## 🤝 Contribuição

Contribuições são bem-vindas! Se você deseja contribuir com o projeto, por favor, siga estas etapas:

1. Faça um fork do repositório.

1. Crie uma nova branch (`git checkout -b feature/sua-feature`).

1. Faça suas alterações e commit-as (`git commit -m 'feat: Adiciona nova feature'`).

1. Envie para a branch original (`git push origin feature/sua-feature`).

1. Abra um Pull Request.

---

## 📜 Licença

Este projeto está licenciado sob a Licença MIT.

---

## 👥 Equipe

- **Vitor Hugo Dias da Silva**
- **Bruno Klisman da Silva Serafim**
- **Isael Garcia Silva**

---