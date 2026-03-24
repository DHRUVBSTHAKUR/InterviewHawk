import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def analyze_resume(text):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {
                "role": "system", 
                "content": "You are InterviewHawk, a senior technical recruiter. Analyze the resume for skill gaps and suggest 3 high-level technical interview questions tailored to their projects."
            },
            {"role": "user", "content": text}
        ]
    )
    return response.choices[0].message.content