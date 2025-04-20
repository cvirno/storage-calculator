# InfiniSizing

Uma aplicação web moderna para dimensionamento de recursos de TI, incluindo servidores físicos, ambientes virtualizados, soluções de backup e vSAN.

## Funcionalidades

- **Calculadora de Servidores Físicos**: Dimensione servidores com base em processadores Intel Xeon
- **Calculadora de Virtualização**: Planeje ambientes virtualizados com precisão
- **Calculadora de Backup**: Dimensione soluções de backup
- **Calculadora vSAN**: Planeje sua infraestrutura vSAN

## Estrutura do Projeto

### Componentes Principais

- `ServerCalculator.tsx`: Calculadora de servidores físicos
- `VirtualizationCalculator.tsx`: Calculadora de virtualização
- `BackupCalculator.tsx`: Calculadora de backup
- `VsanCalculator.tsx`: Calculadora de vSAN
- `Header.tsx`: Componente de cabeçalho da aplicação

### Bibliotecas e Dados

- `mockData.ts`: Dados mockados para processadores e outros recursos
- Utiliza Radix UI para componentes de interface
- Styled com TailwindCSS

## Tecnologias

- React
- TypeScript
- Vite
- TailwindCSS
- Radix UI
- Phosphor Icons

## Como Executar

1. Instale as dependências:
```bash
npm install
```

2. Execute o projeto em modo de desenvolvimento:
```bash
npm run dev
```

3. Para build de produção:
```bash
npm run build
```

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 