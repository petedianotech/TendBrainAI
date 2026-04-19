import os
import asyncio
from fastapi import FastAPI, HTTPException
from google import genai

app = FastAPI()

# Initialize Gemini Client
# Assumes GEMINI_API_KEY is set in the environment
client = genai.Client()

def get_global_trends():
    """
    Simulated function to fetch global internet trends.
    In a real app, this might hit Twitter/X API, Google Trends, or News APIs.
    """
    return [
        "Artificial Intelligence in Healthcare",
        "Sustainable Tech Startups",
        "The Rise of Remote Work Tools 2.0"
    ]

@app.post("/generate_post")
async def generate_post(niche: str, tone: str):
    """
    Takes a user's niche and tone, fetches global trends, 
    and generates an engaging post using Gemini.
    """
    try:
        trends = get_global_trends()
        trends_str = ", ".join(trends)
        
        prompt = f"""
        You are an expert social media manager.
        My niche is: {niche}.
        My brand tone is: {tone}.

        Today's global trends are: {trends_str}

        Please write a highly engaging social media post that connects my niche 
        with one or more of these trends. The post should be ready to publish 
        on LinkedIn, Twitter, and Facebook.
        """

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        return {
            "status": "success",
            "post_content": response.text,
            "trends_used": trends
        }
    
    except Exception as e:
        # Standard error block with rate limit / fallback handling
        raise HTTPException(status_code=500, detail=f"AI Generation Failed: {str(e)}")

# To run: uvicorn ai_engine:app --reload
