import { describe, expect, it } from "vitest";
import { validateRichContent } from "../../src/server/questions/content-service";

const themeId="11111111-1111-4111-8111-111111111111";

describe("question content validation",()=>{
  it("requires exactly one correct alternative and keeps stable ids",()=>{
    const result=validateRichContent({grade:1,difficulty:3,themeId,statement:"Quanto é dois mais dois?",answerType:"MULTIPLE_CHOICE",options:[{stableId:"22222222-2222-4222-8222-222222222222",text:"4",isCorrect:true},{stableId:"33333333-3333-4333-8333-333333333333",text:"5",isCorrect:false}]});
    expect(result.options).toMatchObject([{stableId:"22222222-2222-4222-8222-222222222222",position:0,isCorrect:true},{stableId:"33333333-3333-4333-8333-333333333333",position:1,isCorrect:false}]);
    expect(()=>validateRichContent({grade:1,difficulty:3,themeId,statement:"Quanto é dois mais dois?",answerType:"MULTIPLE_CHOICE",options:[{text:"4",isCorrect:true},{text:"5",isCorrect:true}]})).toThrow(/exatamente uma/);
  });

  it("normalizes comma decimals without evaluating expressions",()=>{
    expect(validateRichContent({grade:2,difficulty:2,themeId,statement:"Informe o resultado.",answerType:"NUMERIC",numericExpected:" 2,50 "}).numericExpected).toBe("2.500000");
    expect(()=>validateRichContent({grade:2,difficulty:2,themeId,statement:"Informe o resultado.",answerType:"NUMERIC",numericExpected:"1+1"})).toThrow(/somente um número/);
  });

  it("rejects active SVG even when declared as an image",()=>{
    const bytes=new TextEncoder().encode('<svg onload="alert(1)"></svg>');
    expect(()=>validateRichContent({grade:3,difficulty:1,themeId,statement:"Observe a imagem.",answerType:"NUMERIC",numericExpected:"1",media:{bytes,mimeType:"image/svg+xml",altText:"Imagem perigosa"}})).toThrow(/PNG, JPEG, WebP ou GIF/);
  });
});
