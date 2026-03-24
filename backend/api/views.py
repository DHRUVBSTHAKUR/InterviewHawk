import json
import os
import random
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from pypdf import PdfReader
from openai import OpenAI
from .models import InterviewSession 

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_question(request):
    """Step 1: Generate question based on resume and selected difficulty."""
    if "resume" not in request.FILES:
        return Response({"error": "No PDF file provided."}, status=400)

    pdf_file = request.FILES["resume"]
    difficulty = request.data.get("difficulty", "Easy")
    user = request.user 

    try:
        reader = PdfReader(pdf_file)
        text = "".join([page.extract_text() or "" for page in reader.pages]).strip()
    except Exception as e:
        return Response({"error": f"PDF Error: {str(e)}"}, status=400)

    api_key = os.environ.get("OPENAI_API_KEY")
    question = "Could you tell me about your most significant technical project?"

    if api_key:
        try:
            client = OpenAI(api_key=api_key)
            
            difficulty_instruction = ""
            if difficulty == "Easy":
                difficulty_instruction = "Generate a fundamental, high-level conceptual question. Keep it encouraging."
            elif difficulty == "Medium":
                difficulty_instruction = "Generate a standard technical interview question about implementation details."
            else: # Hard
                difficulty_instruction = "Generate a very tough, deep-dive architectural or edge-case technical question. Be rigorous."

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": f"You are InterviewHawk. {difficulty_instruction} Focus on the user's resume projects. Return ONLY the question string."
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
@permission_classes([IsAuthenticated])
def grade_answer(request):
    """Step 2: Grade the answer with a supportive bias."""
    data = request.data
    session_id = data.get('session_id')
    user_answer = data.get('answer')
    question = data.get('question')
    difficulty = data.get('difficulty', 'Easy')

    if not session_id or not user_answer:
        return Response({"error": "Missing session_id or answer."}, status=400)

    api_key = os.environ.get("OPENAI_API_KEY")
    score_val = 0
    feedback = "Manual review required."

    if api_key:
        try:
            client = OpenAI(api_key=api_key)
            scoring_logic = """
            SCORING GUIDELINES:
            - If the user makes a genuine attempt, the baseline score is 6/10.
            - Be very encouraging and highlight what they did well first.
            - For 'Easy' difficulty: Grade leniently. 
            - For 'Hard' difficulty: Grade more strictly on technical accuracy.
            """

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system", 
                        "content": f"You are a supportive Career Coach. {scoring_logic} Return JSON: {{'score': 'X/10', 'feedback': '...'}}."
                    },
                    {"role": "user", "content": f"Difficulty: {difficulty}\nQuestion: {question}\nUser Answer: {user_answer}"},
                ],
            )
            evaluation = json.loads(response.choices[0].message.content)
            score_raw = evaluation.get('score', '0/10')
            feedback = evaluation.get('feedback', '')
            
            try:
                score_val = int(str(score_raw).split('/')[0])
            except:
                score_val = 5
        except Exception as e:
            print(f"Grading Error: {e}")

    try:
        session = InterviewSession.objects.get(id=session_id, user=request.user)
        session.user_answer = user_answer
        session.technical_score = score_val
        session.feedback = feedback
        session.save()
    except InterviewSession.DoesNotExist:
        return Response({"error": "Session not found"}, status=404)

    return Response({
        "score": f"{score_val}/10", 
        "feedback": feedback
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_interview_history(request):
    """Step 3: Fetch history for all team members."""
    # Note: Use .all() instead of .filter(user=request.user) so everyone can see Tanya, Naresh, and Shreya's scores
    interviews = InterviewSession.objects.all().order_by('-created_at')
    
    data = [{
        "id": item.id,
        "username": item.user.username, # Added username
        "resume": item.resume_name,
        "question": item.ai_question,
        "score": f"{item.technical_score}/10",
        "feedback": item.feedback,
        "date": item.created_at.strftime("%b %d, %Y")
    } for item in interviews]
    
    return Response(data)