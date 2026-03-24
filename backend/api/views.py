import json
import os
import random
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from pypdf import PdfReader
from openai import OpenAI
from .models import InterviewSession 

# Your safety net questions for demo stability
FAKE_QUESTIONS = [
    "Explain the difference between React State and Props.",
    "How does the Virtual DOM work in React?",
    "Explain the concept of 'closure' in JavaScript.",
    "What are the differences between SQL and NoSQL databases?",
    "Explain the 'M' in MVC architecture.",
]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_question(request):
    """Step 1: Accept PDF, Generate Question, and Create Database Entry."""
    if "resume" not in request.FILES:
        return Response({"error": "No PDF file provided."}, status=400)

    pdf_file = request.FILES["resume"]
    user = request.user 

    # 1. Extract text from PDF
    try:
        reader = PdfReader(pdf_file)
        text = "".join([page.extract_text() or "" for page in reader.pages]).strip()
    except Exception as e:
        return Response({"error": f"PDF Error: {str(e)}"}, status=400)

    # 2. Generate Question using OpenAI or Fallback
    api_key = os.environ.get("OPENAI_API_KEY")
    question = random.choice(FAKE_QUESTIONS) 

    if api_key:
        try:
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a technical interviewer. Generate ONE tough question based on this resume. Return ONLY the question."},
                    {"role": "user", "content": text[:8000]},
                ],
                max_tokens=256,
            )
            question = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI Error: {e}")

    # 3. SAVE TO DATABASE (Review 3 Feature)
    session = InterviewSession.objects.create(
        user=user,
        resume_name=pdf_file.name,
        ai_question=question
    )

    return Response({
        "session_id": session.id, 
        "question": question
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def grade_answer(request):
    """Step 2: Grade the answer and UPDATE the existing database record."""
    data = request.data
    session_id = data.get('session_id')
    user_answer = data.get('answer')
    question = data.get('question')

    if not session_id or not user_answer:
        return Response({"error": "Missing session_id or answer."}, status=400)

    # AI Grading Logic
    api_key = os.environ.get("OPENAI_API_KEY")
    score = "N/A"
    feedback = "Manual review required."

    if api_key:
        try:
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "Evaluate the answer. Return JSON: {'score': 'X/10', 'feedback': '...'} "},
                    {"role": "user", "content": f"Q: {question}\nA: {user_answer}"},
                ],
            )
            evaluation = json.loads(response.choices[0].message.content)
            score = evaluation.get('score', 'N/A')
            feedback = evaluation.get('feedback', '')
        except Exception as e:
            print(f"Grading Error: {e}")

    # UPDATE DATABASE: Link the score to the previous session
    try:
        session = InterviewSession.objects.get(id=session_id, user=request.user)
        session.user_answer = user_answer
        session.technical_score = int(score.split('/')[0]) if '/' in score else 0
        session.feedback = feedback
        session.save()
    except InterviewSession.DoesNotExist:
        return Response({"error": "Session not found"}, status=404)

    return Response({"score": score, "feedback": feedback})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_interview_history(request):
    """Step 3: Let the Mobile App fetch all past results."""
    interviews = InterviewSession.objects.filter(user=request.user).order_by('-created_at')
    
    data = [{
        "id": item.id,
        "resume": item.resume_name,
        "question": item.ai_question,
        "score": f"{item.technical_score}/10",
        "feedback": item.feedback,
        "date": item.created_at.strftime("%b %d, %Y")
    } for item in interviews]
    
    return Response(data)