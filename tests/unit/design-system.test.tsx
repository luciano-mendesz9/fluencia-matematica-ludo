import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Badge } from "../../src/components/ui/badge";
import { Button, buttonClassName } from "../../src/components/ui/button";

describe("design system", () => {
  it("mantém o alvo mínimo e a variante visual do botão", () => {
    expect(buttonClassName("secondary")).toContain("min-h-11");
    expect(buttonClassName("secondary")).toContain("border-border");
  });

  it("expõe estado ocupado com texto e sem interação", () => {
    const html = renderToStaticMarkup(<Button busy>Salvar</Button>);
    expect(html).toContain("aria-busy=\"true\"");
    expect(html).toContain("disabled");
    expect(html).toContain("Aguarde...");
  });

  it("não depende apenas de cor para comunicar o badge", () => {
    const html = renderToStaticMarkup(<Badge variant="success">Concluído</Badge>);
    expect(html).toContain("Concluído");
  });
});
