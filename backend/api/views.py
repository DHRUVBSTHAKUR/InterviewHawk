import json
import os
import random
from rest_framework.decorators import api_view
from rest_framework.response import Response
from pypdf import PdfReader
from openai import OpenAI

# Your fallback questions to simulate AI if the real API fails during the demo
FAKE_QUESTIONS = [
    "Explain the difference between React State and Props.",
    "How does the Virtual DOM work in React?",
    "Explain the concept of 'closure' in JavaScript.",
    "What are the differences between SQL and NoSQL databases?",
    "Explain the 'M' in MVC architecture.",
]

@api_view(['POST'])
def generate_question(request):
    """Accept a PDF resume, extract text, and generate an interview question via AI."""
    
    # 1. Validate that a file was actually sent
    if "resume" not in request.FILES:
        return Response({"error": "No PDF file provided. Use form field 'resume'."}, status=400)

    pdf_file = request.FILES["resume"]
    if not pdf_file.name.lower().endswith(".pdf"):
        return Response({"error": "File must be a PDF."}, status=400)

    # 2. Extract text from the PDF
    try:
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        text = text.strip()
    except Exception as e:
        return Response({"error": f"Failed to extract text from PDF: {str(e)}"}, status=400)

    if not text:
        return Response({"error": "No text could be extracted from the PDF."}, status=400)

    # 3. Check for the OpenAI API Key
    api_key = os.environ.get("OPENAI_API_KEY")
    
    # SAFETY NET: If no API key is set, use a fake question so your demo doesn't crash!
    if not api_key:
        print("WARNING: No OPENAI_API_KEY found. Using fallback question.")
        return Response({"question": random.choice(FAKE_QUESTIONS)})

    # 4. Generate the custom question using OpenAI
    client = OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert technical interviewer. Based on the candidate's resume, "
                        "generate ONE relevant, professional interview question. "
                        "The question should be specific to their experience, skills, or background. "
                        "Return ONLY the question text, no preamble or numbering."
                    ),
                },
                {
                    "role": "user",
                    "content": text[:8000], # Limit text size to avoid breaking token limits
                },
            ],
            max_tokens=256,
        )
        question = response.choices[0].message.content.strip()
        return Response({"question": question})
        
    except Exception as e:
        print(f"OpenAI Error: {str(e)}")
        # FINAL SAFETY NET: If the API call fails (e.g., no internet), return a fake question
        return Response({"question": random.choice(FAKE_QUESTIONS)})


@api_view(['POST'])
def grade_answer(request):
    """Receive the question and the candidate's answer, and grade it using AI."""
    
    # 1. Get the data sent from React
    data = request.data
    question = data.get('question')
    answer = data.get('answer')

    if not question or not answer:
        return Response({"error": "Missing question or answer."}, status=400)

    # 2. Check for the API Key
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("WARNING: No OPENAI_API_KEY found. Using fallback grading.")
        return Response({
            "score": "7/10", 
            "feedback": "Fallback Mode: Good attempt, but try to use more specific technical terms next time."
        })

    client = OpenAI(api_key=api_key)

    # 3. Ask OpenAI to grade it and force it to return a clean JSON format
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"}, # Forces AI to return clean data, not a conversational paragraph
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a strict technical interviewer. Evaluate the candidate's answer to the question. "
                        "Return a JSON object strictly with two keys: 'score' (a string like '8/10') and 'feedback' (1-2 sentences of actionable, direct advice)."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Question: {question}\nCandidate Answer: {answer}",
                },
            ],
            max_tokens=200,
        )
        
        # Parse the AI's JSON response and send it to the frontend
        evaluation = json.loads(response.choices[0].message.content)
        return Response(evaluation)
        
    except Exception as e:
        print(f"OpenAI Error during grading: {str(e)}")
        return Response({
            "score": "N/A", 
            "feedback": "An error occurred while grading. Please try answering again."
        })