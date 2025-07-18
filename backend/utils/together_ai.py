import logging
from together import Together

logger = logging.getLogger(__name__)

class TogetherAIClient:
    def __init__(self, model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"):
        self.client = Together()
        self.model = model

    def get_completion(self, prompt, role="user"):
        logger.info(f"TogetherAI Prompt: {prompt}")
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": role, "content": prompt}]
        )
        content = response.choices[0].message.content.strip()
        logger.info(f"TogetherAI Response: {content}")
        return content 