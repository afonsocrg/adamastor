export const urenoContent = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Olá, Carlos!" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "No dia 20 de janeiro criámos este " },
        { type: "text", marks: [{ type: "italic" }], text: "proof of concept" },
        { type: "text", text: " de editor de texto." },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Aqui podemos escrever texto em " },
        { type: "text", marks: [{ type: "bold" }], text: "negrito" },
        { type: "text", text: ", " },
        { type: "text", marks: [{ type: "italic" }], text: "itálico" },
        { type: "text", marks: [{ type: "bold" }, { type: "italic" }], text: ", " },
        { type: "text", marks: [{ type: "underline" }], text: "sublinhado" },
        { type: "text", text: ", etc." },
      ],
    },
    { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Como usar" }] },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Para formatar texto, podemos selecionar o texto que queremos formatar, e irá aparecer um menu com todas as opções.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: 'Este editor suporta também os famosos "' },
        { type: "text", marks: [{ type: "italic" }], text: "slash commands" },
        {
          type: "text",
          text: '" do Notion. Para tal, basta inserir uma barra ("/") numa linha em branco, e irá aparecer um menu com todas as opções.',
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Os slash commands permitem inserir bullet lists, checkboxes e ainda embeber videos de youtube ou posts do twitter.",
        },
      ],
    },
    { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Próximos passos" }] },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Neste momento este post está gravado localmente, no computador de cada pessoa. O próximo passo será integrar isto com uma base de dados!",
        },
      ],
    },
  ],
};
