import os
from tavily import TavilyClient
from dotenv import load_dotenv


class TavilySearchClient:
    def __init__(self):
        load_dotenv()
        self.client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))


