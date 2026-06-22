from api.api.models import SourceItem


def _format_source(source: SourceItem) -> str:
    if source.source_type == "precedent":
        return "\n".join(
            [
                f"[Source {source.citation_id}] (precedent)",
                f"Case: {source.full_case_ref or 'Unknown'}",
                f"Court: {source.court or 'Unknown'}",
                f"Outcome: {source.disposition or 'Unknown'}",
                f"Date: {source.judgment_date or 'Unknown'}",
                f"Holding/Excerpt: {source.excerpt}",
            ]
        )
    return "\n".join(
        [
            f"[Source {source.citation_id}] (statute)",
            f"Act: {source.act_title or 'Unknown'}",
            f"Year: {source.act_year if source.act_year is not None else 'Unknown'}",
            f"Section: {source.section_index or 'Unknown'}",
            f"Text: {source.excerpt}",
            f"URL: {source.source_url or 'N/A'}",
        ]
    )


def build_grounded_prompt(question: str, sources: list[SourceItem]) -> list[dict]:
    context_blocks = [_format_source(source) for source in sources]
    has_precedent = any(s.source_type == "precedent" for s in sources)

    system_prompt = (
        "You are an expert legal assistant for Bangladesh law. The user may ask a "
        "plain statutory question OR describe a real situation and ask what the law "
        "says or what the likely outcome is. Using ONLY the supplied legal sources, "
        "write a clear, thorough, well-structured answer.\n"
        "Treat the two source kinds differently:\n"
        "- STATUTE sources are BINDING law. Identify the governing act and section "
        "number(s) and state the rule they set.\n"
        "- PRECEDENT sources are court judgments — PERSUASIVE authority showing how "
        "courts have applied the law to similar facts. Use them to explain likely "
        "treatment and cite the case reference and its outcome.\n"
        "Synthesize across ALL relevant sources (general rule plus aggravated forms, "
        "exceptions, definitions, procedure) — do not stop at the first source. "
        "Cite every source you rely on as [Source N]. "
        "Do not fabricate statutes, sections, cases, facts, or outcomes. "
        "Never invent a case number or holding. "
        + (
            ""
            if has_precedent
            else "No precedent sources were supplied; answer from the statute "
            "sources and explicitly note that no directly on-point precedent was "
            "found in the corpus. "
        )
        + "If the sources are insufficient, say so and state what additional legal "
        "text is needed. Add a brief closing note that this is general legal "
        "information, not legal advice, and a lawyer should be consulted."
    )

    user_prompt = (
        f"Question / situation: {question}\n\n"
        f"Legal sources:\n{chr(10).join(context_blocks)}\n\n"
        "Write the answer so that it:\n"
        "- Restates the situation in legal terms (when the user gave a scenario).\n"
        "- States the governing statute rule and the specific section number(s) "
        "(binding).\n"
        "- Explains how courts have applied it, citing case reference(s) and "
        "outcome(s) (persuasive precedent), when precedent sources are provided.\n"
        "- Notes practical steps or relief available where the sources support it.\n"
        "- Cites every source it relies on as [Source N] (use multiple where "
        "multiple are relevant).\n"
        "- Uses short paragraphs or bullet points when that makes it clearer.\n"
        "- Notes any limitations if the sources do not fully cover the question."
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
