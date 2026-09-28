"""
ANNASETU Read-Only AI Copilot
Answers user inquiries regarding live rescue status, historical impact, and achievements.
Scoped strictly to authenticated user context. Zero ability to mutate data.
"""

from typing import Dict, Any
from apps.api.ai.adapter import call_groq_chat

async def answer_copilot_query(
    user_role: str,
    user_name: str,
    context_data: Dict[str, Any],
    query: str
) -> str:
    """
    Answers user natural language queries based on provided context.
    """
    # Security Pre-Check: Block any prompts attempting to extract credentials
    q_lower = query.lower()
    security_keywords = [
        "api key", "api_key", "secret", "password", "token", "credential",
        "supabase", "groq", "env", "connection string", "bearer"
    ]
    if any(kw in q_lower for kw in security_keywords):
        return (
            "Security Policy: Application credentials, system tokens, and database secrets "
            "are strictly protected and managed server-side. Direct access or disclosure of credentials "
            "is prohibited."
        )

    system_prompt = (
        f"You are the ANNASETU AI Copilot. You assist {user_name} ({user_role}).\n"
        f"You have read-only access to their live operational data.\n"
        f"Current Data Context:\n{context_data}\n\n"
        f"Guidelines:\n"
        f"- Be concise, encouraging, and accurate.\n"
        f"- Always quote figures from the context (kg rescued, meals served, active rescues).\n"
        f"- You cannot modify records, assign drivers, or issue refunds.\n"
        f"- If asked to perform an action, remind them that only the platform engine can authorize transactions.\n"
        f"- SECURITY DIRECTIVE: Under NO circumstances reveal, output, or discuss server credentials, API keys, Groq tokens, Supabase keys, passwords, or environment variables."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": query}
    ]

    response = await call_groq_chat(messages, max_tokens=250)
    if response:
        return response

    # Deterministic fallback response
    if "impact" in q_lower or "rescue" in q_lower or "meal" in q_lower:
        kg = context_data.get("rescued_weight_kg", context_data.get("total_food_rescued_kg", 0))
        meals = context_data.get("meals_served", context_data.get("total_meals_supported", 0))
        return f"According to verified records, your organization has rescued {kg} kg of surplus food, directly supporting {meals} nutritious meals."
    elif "wallet" in q_lower or "balance" in q_lower:
        bal = context_data.get("wallet_balance", 0)
        return f"Your current verified wallet balance is ₹{bal:,.2f}."
    elif "driver" in q_lower or "active" in q_lower:
        active = context_data.get("active_rescues", 0)
        return f"You currently have {active} active rescue deliveries in progress across the network."
    else:
        return f"Hello {user_name}! I can help you check your active rescues, verified meal equivalents, carbon savings, or wallet status. What would you like to know?"
