import json
import os
import random
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from pypdf import PdfReader
from openai import OpenAI
from .models import InterviewSession 

FAKE_QUESTIONS = [
    "Explain the difference between React State and Props.",
    "How does the Virtual DOM work in React?",
    "Explain the concept of 'closure' in JavaScript.",
    "What are the differences between SQL and NoSQL databases?",
]

@api_view(['POST'])
@permission_classes([IsAuthenticated]) # <-- SECURED
def generate_question(request):
    """Step 1: Accept PDF, extract text, generate question for the LOGGED IN user."""
    if "resume" not in request.FILES:
        return Response({"error": "No PDF file provided."}, status=400)

    pdf_file = request.FILES["resume"]
    user = request.user # <-- REAL USER

    try:
        reader = PdfReader(pdf_file)
        text = "".join([page.extract_text() or "" for page in reader.pages]).strip()
    except Exception as e:
        return Response({"error": f"PDF Error: {str(e)}"}, status=400)

    api_key = os.environ.get("OPENAI_API_KEY")
    question = random.choice(FAKE_QUESTIONS) 

    if api_key:
        try:
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are InterviewHawk, a specialized AI Career Coach. Generate ONE tough, project-specific technical interview question based on the candidate's resume. Focus on the most complex project. Return ONLY the question string."
                    },
                    {"role": "user", "content": text[:8000]},
                ],
                max_tokens=256,
            )
            question = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI Error: {e}")

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
@permission_classes([IsAuthenticated]) # <-- SECURED
def grade_answer(request):
    """Step 2: Grade the answer and save it to the user's session."""
    data = request.data
    session_id = data.get('session_id')
    user_answer = data.get('answer')
    question = data.get('question')

    if not session_id or not user_answer:
        return Response({"error": "Missing session_id or answer."}, status=400)

    api_key = os.environ.get("OPENAI_API_KEY")
    score_val = 0
    feedback = "Manual review required."

    if api_key:
        try:
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system", 
                        "content": "Evaluate the technical answer. Return JSON: {'score': 'X/10', 'feedback': '...'}."
                    },
                    {"role": "user", "content": f"Q: {question}\nA: {user_answer}"},
                ],
            )
            evaluation = json.loads(response.choices[0].message.content)
            score_raw = evaluation.get('score', '0/10')
            feedback = evaluation.get('feedback', '')
            score_val = int(str(score_raw).split('/')[0])
        except Exception as e:
            print(f"Grading Error: {e}")

    try:
        # <-- REAL USER CHECK: Ensures they can't grade someone else's session
        session = InterviewSession.objects.get(id=session_id, user=request.user)
        session.user_answer = user_answer
        session.technical_score = score_val
        session.feedback = feedback
        session.save()
    except InterviewSession.DoesNotExist:
        return Response({"error": "Session not found or unauthorized"}, status=404)

    return Response({
        "score": f"{score_val}/10", 
        "feedback": feedback
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated]) # <-- SECURED
def get_interview_history(request):
    """Step 3: Fetch history exclusively for the logged-in user."""
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