# import os
# from django.http import JsonResponse
# from django.views.decorators.http import require_http_methods
# from django.views.decorators.csrf import csrf_exempt
# from pypdf import PdfReader
# from openai import OpenAI


# @csrf_exempt
# @require_http_methods(["POST"])
# def generate_question(request):
#     """Accept a PDF resume, extract text, and generate an interview question via OpenAI."""
#     if "resume" not in request.FILES:
#         return JsonResponse(
#             {"error": "No PDF file provided. Use form field 'resume'."},
#             status=400,
#         )

#     pdf_file = request.FILES["resume"]
#     if not pdf_file.name.lower().endswith(".pdf"):
#         return JsonResponse(
#             {"error": "File must be a PDF."},
#             status=400,
#         )

#     try:
#         reader = PdfReader(pdf_file)
#         text = ""
#         for page in reader.pages:
#             text += page.extract_text() or ""
#         text = text.strip()
#     except Exception as e:
#         return JsonResponse(
#             {"error": f"Failed to extract text from PDF: {str(e)}"},
#             status=400,
#         )

#     if not text:
#         return JsonResponse(
#             {"error": "No text could be extracted from the PDF."},
#             status=400,
#         )

#     client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
#     if not client.api_key:
#         return JsonResponse(
#             {"error": "OPENAI_API_KEY environment variable is not set."},
#             status=500,
#         )

#     try:
#         response = client.chat.completions.create(
#             model="gpt-4o-mini",
#             messages=[
#                 {
#                     "role": "system",
#                     "content": (
#                         "You are an expert interviewer. Based on the candidate's resume, "
#                         "generate one relevant, professional interview question. "
#                         "The question should be specific to their experience, skills, or background. "
#                         "Return only the question text, no preamble or numbering."
#                     ),
#                 },
#                 {
#                     "role": "user",
#                     "content": text[:8000],
#                 },
#             ],
#             max_tokens=256,
#         )
#         question = response.choices[0].message.content.strip()
#     except Exception as e:
#         return JsonResponse(
#             {"error": f"Failed to generate question: {str(e)}"},
#             status=500,
#         )

#     return JsonResponse({"question": question})
from rest_framework.decorators import api_view
from rest_framework.response import Response
import time
import random

# We will just pick a random question from this list to simulate AI
FAKE_QUESTIONS = [
    "Explain the difference between React State and Props.",
    "How does the Virtual DOM work in React?",
    "Explain the concept of 'closure' in JavaScript.",
    "What are the differences between SQL and NoSQL databases?",
    "Explain the 'M' in MVC architecture.",
]

@api_view(['POST'])
def generate_question(request):
    # 1. Fake the "thinking" time so it feels like AI (1.5 seconds)
    time.sleep(1.5)
    
    # 2. Pick a random question
    question = random.choice(FAKE_QUESTIONS)
    
    # 3. Return it to the frontend
    return Response({"question": question})