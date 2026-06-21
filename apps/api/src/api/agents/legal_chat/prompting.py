from api.api.models import SourceItem


def build_grounded_prompt(question: str, sources: list[SourceItem]) -> list[dict]:
    context_blocks = []
    for source in sources:
        context_blocks.append(
            "\n".join(
                [
                    f"[Source {source.citation_id}]",
                    f"Act: {source.act_title or 'Unknown'}",
                    f"Year: {source.act_year if source.act_year is not None else 'Unknown'}",
                    f"Section: {source.section_index or 'Unknown'}",
                    f"Text: {source.excerpt}",
                    f"URL: {source.source_url or 'N/A'}",
                ]
            )
        )

    system_prompt = (
        "You are an expert legal assistant for Bangladesh statutory law. "
        "Using ONLY the supplied legal sources, write a clear, thorough, and well-structured answer. "
        "Synthesize across ALL relevant sources: when several sections give related rules "
        "(a general rule plus aggravated forms, exceptions, definitions, or procedure), explain each of them — "
        "do not stop at the first source. "
        "Reference the specific section numbers, and cite every source you rely on as [Source N]. "
        "Do not fabricate statutes, sections, facts, or outcomes. "
        "If the sources are insufficient, say so and state what additional legal text is needed."
    )
    user_prompt = (
        f"Question: {question}\n\n"
        f"Legal sources:\n{chr(10).join(context_blocks)}\n\n"
        "Write the answer so that it:\n"
        "- States the main rule, then any relevant variations, exceptions, or related provisions found in the sources.\n"
        "- References the specific section numbers.\n"
        "- Cites every source you rely on as [Source N] (use multiple where multiple are relevant).\n"
        "- Uses short paragraphs or bullet points when that makes it clearer.\n"
        "- Notes any limitations if the sources do not fully cover the question."
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
