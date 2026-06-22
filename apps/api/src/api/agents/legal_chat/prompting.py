from api.api.models import SourceItem


def _format_statute(source: SourceItem) -> str:
    return "\n".join(
        [
            f"[Source {source.citation_id}]",
            f"Act: {source.act_title or 'Unknown'}",
            f"Year: {source.act_year if source.act_year is not None else 'Unknown'}",
            f"Section: {source.section_index or 'Unknown'}",
            f"Text: {source.excerpt}",
            f"URL: {source.source_url or 'N/A'}",
        ]
    )


def _format_precedent_background(source: SourceItem) -> str:
    # Reasoning-only context: NO case reference / number / date — so the model
    # cannot quote or cite a specific judgment. Just the outcome + the reasoning.
    return "\n".join(
        [
            "- Court treatment of similar facts:",
            f"  Outcome: {source.disposition or 'Unknown'}",
            f"  Reasoning: {source.excerpt}",
        ]
    )


def build_grounded_prompt(
    question: str,
    statutes: list[SourceItem],
    precedents: list[SourceItem] | None = None,
) -> list[dict]:
    precedents = precedents or []
    statute_blocks = [_format_statute(s) for s in statutes]
    precedent_blocks = [_format_precedent_background(p) for p in precedents]

    system_prompt = (
        "You are an expert legal assistant for Bangladesh law. The user may ask a "
        "plain statutory question OR describe a real situation and ask what the law "
        "says or what the likely outcome is. Write a clear, thorough, well-"
        "structured answer.\n"
        "You are given two kinds of material, which you must treat very "
        "differently:\n"
        "1. STATUTE SOURCES — the BINDING law and your ONLY citable sources. "
        "Identify the governing act and section number(s), state the rule, and "
        "cite each one you rely on as [Source N].\n"
        "2. PRECEDENT BACKGROUND — how courts have reasoned about similar facts. "
        "This is for YOUR REASONING ONLY. Use it to judge the likely outcome and to "
        "reason like a court would, but DO NOT cite it, DO NOT present it as a "
        "source, and DO NOT mention, quote, or refer to any specific case, case "
        "number, party name, judge, or date. Never write things like 'in a "
        "previous case' or a case citation. Simply fold the legal reasoning into "
        "your own analysis.\n"
        "Cite ONLY statute sources as [Source N]. Do not fabricate statutes, "
        "sections, facts, or outcomes. "
        "If the statute sources are insufficient, say so and state what additional "
        "legal text is needed. End with a brief note that this is general legal "
        "information, not legal advice, and a lawyer should be consulted."
    )

    user_parts = [f"Question / situation: {question}", ""]
    user_parts.append("Statute sources (citable):")
    user_parts.append(chr(10).join(statute_blocks) if statute_blocks else "(none)")
    if precedent_blocks:
        user_parts.append("")
        user_parts.append(
            "Precedent background (for your reasoning ONLY — do NOT cite, do NOT "
            "mention any case number/name/date):"
        )
        user_parts.append(chr(10).join(precedent_blocks))
    user_parts.append("")
    user_parts.append(
        "Write the answer so that it:\n"
        "- Restates the situation in legal terms (when the user gave a scenario).\n"
        "- States the governing statute rule and the specific section number(s), "
        "citing them as [Source N].\n"
        "- Explains the likely outcome and reasoning, informed by the precedent "
        "background but WITHOUT referring to any case.\n"
        "- Notes practical steps or relief where the sources support it.\n"
        "- Uses short paragraphs or bullet points when that makes it clearer.\n"
        "- Notes any limitations if the statute sources do not fully cover the "
        "question."
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "\n".join(user_parts)},
    ]
