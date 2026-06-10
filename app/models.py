from pydantic import BaseModel, Field

class TranslateRequest(BaseModel):
    """Request payload for translating a prompt to Thai."""
    prompt: str = Field(..., min_length=1, description="Text to translate")

class TranslateResponse(BaseModel):
    """Response payload containing provider and translated text."""
    provider: str
    translated: str