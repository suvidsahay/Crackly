import logging
from backend.utils import TavilySearchClient
import requests
import re
from urllib.parse import urlparse, urlunparse
import cloudscraper
from bs4 import BeautifulSoup
from backend.utils.together_ai import TogetherAIClient

logger = logging.getLogger(__name__)

class JobDescriptionExtractor:
    def __init__(self):
        self.tavily = TavilySearchClient()

    def extract_from_workday(self, url):
        logger.info(f"Extracting job description from Workday: {url}")
        try:
            parsed = urlparse(url)
            # Construct the new path for the API endpoint
            new_path = re.sub(r'^/[^/]+/', f'/wday/cxs/{parsed.hostname.split(".")[0]}/', parsed.path)
            new_url = urlunparse(parsed._replace(path=new_path))
            resp = requests.get(new_url)
            resp.raise_for_status()
            data = resp.json()
            job_desc = data['jobPostingInfo']['jobDescription']
            position = data['jobPostingInfo']['title']
            company = parsed.hostname.split(".")[0]
            if not job_desc:
                raise ValueError(f"Job description not found in Workday response: {resp} for url: {url}")
            return {
                "job_description": job_desc,
                "job_title": position,
                "company": company
            }
        except Exception as e:
            logger.error(f"Error extracting Workday job description: {e}")
            raise RuntimeError(f"Failed to extract job description from Workday: {e}")

    def extract_with_llama(self, url):
        logger.info(f"Extracting job description using Llama for URL: {url}")
        try:
            # Scrape the page using cloudscraper
            scraper = cloudscraper.create_scraper()
            resp = scraper.get(url)
            if resp.status_code == 404:
                raise FileNotFoundError(f"Page not found: {url} (status 404)")
            if resp.status_code != 200:
                raise RuntimeError(f"Failed to fetch page: {url} (status {resp.status_code})")
            html = resp.text
            soup = BeautifulSoup(html, 'html.parser')
            visible_text = soup.get_text(separator=' ', strip=True)
            logger.info(f"Extracted visible text from page (snippet): {visible_text[:300]}")

            # Use Together Llama API to extract all fields in one prompt
            client = TogetherAIClient()
            prompt = f"""You are provided the job description, you need to output 3 lines by extracting the details and nothing else. If you are not able to extract any details, just print \"ERROR\" only for that line.\n1. The job title.\n2. The company hiring.\n3. The job description focusing on responsibilities and qualifications only as it is in the description. You can output this in multiple lines.\n\nJob Posting:\n{visible_text}"""
            result = client.get_completion(prompt)
            logger.info(f"Llama extraction result:\n{result}")
            # Parse the result into three fields
            lines = result.strip().split('\n', 2)
            job_title = lines[0].strip() if len(lines) > 0 else "ERROR"
            company = lines[1].strip() if len(lines) > 1 else "ERROR"
            job_desc = lines[2].strip() if len(lines) > 2 else "ERROR"
            return {
                "job_description": job_desc,
                "job_title": job_title,
                "company": company
            }
        except FileNotFoundError:
            raise  # Let Flask handle this
        except Exception as e:
            logger.error(f"Error extracting job description from url: {e}")
            return {
                "job_description": "",
                "job_title": "",
                "company": ""
            }

    def extract(self, url):
        if 'myworkdayjobs.com' in url:
            return self.extract_from_workday(url)
        else:
            result = self.extract_with_llama(url)
            if not result["job_description"]:
                raise ValueError(f"Failed to extract job description from url: {url}")
            return result 
        