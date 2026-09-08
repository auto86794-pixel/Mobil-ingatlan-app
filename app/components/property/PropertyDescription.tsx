import { Fragment } from "react";

function renderInlineMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} className="font-bold text-[#263129]">{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  );
}

export default function PropertyDescription({ value }: { value?: string }) {
  const paragraphs = (value?.trim() || "Nincs megadott leírás.").split(/\n{2,}/).filter(Boolean);
  return <div className="space-y-4 leading-8 text-[#4d5a51]">{paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-line">{renderInlineMarkdown(paragraph)}</p>)}</div>;
}
