from api.api.models import ChatMessage, SourceItem


def _format_history(history: list[ChatMessage]) -> str:
    labels = {"user": "User", "assistant": "Assistant"}
    return "\n".join(
        f"{labels.get(m.role, m.role.title())}: {m.content.strip()}" for m in history
    )


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
    history: list[ChatMessage] | None = None,
    low_confidence: bool = False,
) -> list[dict]:
    precedents = precedents or []
    history = history or []
    statute_blocks = [_format_statute(s) for s in statutes]
    precedent_blocks = [_format_precedent_background(p) for p in precedents]

    system_prompt = (
        "You are an expert legal assistant for Bangladesh law. The user may ask a "
        "plain statutory question OR describe a real situation and ask what the law "
        "says or what the likely outcome is. Answer concisely and bullet-first: "
        "lead with the answer, no preamble, no repetition, omit empty sections.\n"
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
        "If the statute sources are insufficient, say so in one bullet and state "
        "what additional legal text is needed. End with one short line: general "
        "legal information, not legal advice; consult a lawyer.\n"
        "If the question lacks key facts needed to identify the governing law, or "
        "is too vague to answer reliably, do NOT guess — ask 1-2 short clarifying "
        "questions instead of answering. When you can answer but one missing "
        "detail would change it, you may end with a single short follow-up "
        "question. Prefer answering whenever the sources are sufficient.\n"
        "When earlier conversation is provided, use it to interpret the current "
        "question (e.g. resolve references like 'it', 'that', or 'the punishment'), "
        "but ground every legal claim ONLY in the statute sources below."
    )

    user_parts: list[str] = []
    if history:
        user_parts.append("Conversation so far:")
        user_parts.append(_format_history(history))
        user_parts.append("")
    user_parts.append(f"Question / situation: {question}")
    if low_confidence:
        user_parts.append(
            "(Retrieval confidence is low — if these sources do not clearly fit "
            "the question, ask a brief clarifying question instead of answering.)"
        )
    user_parts.append("")
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
        "Answer as a short bulleted list — no preamble, do not restate the "
        "question:\n"
        "- First bullet: the direct answer (the offence, rule, or likely outcome).\n"
        "- Cite the governing section number(s) as [Source N] on the relevant "
        "bullet.\n"
        "- One bullet for the penalty/consequence or likely outcome, with the "
        "reasoning folded in from the precedent background but WITHOUT naming any "
        "case.\n"
        "- Add a practical-step or key-distinction bullet only if the sources "
        "support it.\n"
        "- If the statute sources are insufficient, say so in one bullet.\n"
        "- End with one short line: general info, not legal advice.\n"
        "Keep it concise — a simple question needs only 2-4 bullets."
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "\n".join(user_parts)},
    ]


def build_clarify_prompt(
    question: str, history: list[ChatMessage] | None = None
) -> list[dict]:
    """Prompt for when retrieval found no usable sources.

    There is nothing to ground an answer in, so instead of dead-ending, ask the
    user for the specifics that would make the question searchable. Plain text,
    no citations.
    """
    history = history or []
    system_prompt = (
        "You are a legal assistant for Bangladesh law. No matching statute was "
        "found for the user's question — it is likely too vague, off-topic, or "
        "missing key facts. Do NOT answer or guess at the law. Instead ask 1-2 "
        "short clarifying questions that would let you find the right statute — "
        "e.g. the area of law, the specific act, the key facts, or the "
        "jurisdiction. Be brief and friendly; do not cite anything."
    )
    user_parts: list[str] = []
    if history:
        user_parts.append("Conversation so far:")
        user_parts.append(_format_history(history))
        user_parts.append("")
    user_parts.append(f"Question / situation: {question}")
    user_parts.append("")
    user_parts.append("Ask 1-2 short clarifying questions:")
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "\n".join(user_parts)},
    ]


def build_condense_messages(
    question: str, history: list[ChatMessage]
) -> list[dict]:
    """Prompt that rewrites a follow-up into a standalone retrieval query."""
    system_prompt = (
        "You rewrite a user's follow-up into a standalone search query for a "
        "Bangladesh legal statute database. Use the conversation only to resolve "
        "references (pronouns, ellipsis, 'the punishment', 'that offence'). Keep the "
        "user's intent and legal terms. If the follow-up is already self-contained, "
        "return it unchanged. Output ONLY the rewritten query — no preamble, no "
        "quotes, no explanation."
    )
    user_content = (
        f"Conversation so far:\n{_format_history(history)}\n\n"
        f"Follow-up question: {question}\n\n"
        "Standalone search query:"
    )
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]
