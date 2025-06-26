import os
import time
import random
import logging
from google import genai

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiClient:
    def __init__(self, api_key: str = None):
        if api_key is None:
            api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment or passed to GeminiClient.")
        self.client = genai.Client(api_key=api_key)

    def exponential_backoff(self, func, *args, max_retries=5, base_delay=1, factor=2, jitter=True, **kwargs):
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if attempt < max_retries - 1:
                    delay = base_delay * (factor ** attempt)
                    if jitter:
                        delay += random.uniform(0, base_delay)
                    print(f"Error: {e}. Retrying in {delay:.2f} seconds...")
                    time.sleep(delay)
                else:
                    print(f"Max retries reached. Failed to execute {func.__name__}.")
                    raise

    def generate_response(self, prompt, system_instruction=None, model="gemini-2.5-flash", max_retries=6):
        def call_model():
            config = None
            if system_instruction:
                from google.genai import types
                config = types.GenerateContentConfig(system_instruction=system_instruction)
            response = self.client.models.generate_content(
                model=model,
                config=config,
                contents=prompt
            )
            logger.info(f"GeminiUtils - Total token count: {response.usage_metadata.total_token_count}")

            return response.text.strip()
        return self.exponential_backoff(call_model, max_retries=max_retries)