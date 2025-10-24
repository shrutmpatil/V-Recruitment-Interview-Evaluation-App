from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
import uuid
import json
import io
import traceback
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
import sys 

# Placeholder for unused but required library
try:
    import google.genai 
except ImportError:
    pass

# --- CONFIGURATION ---
load_dotenv()
app = Flask(__name__)
# Allow ALL origins for development
CORS(app, supports_credentials=True)

# Load Supabase credentials from .env file
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("FATAL ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from the environment.")
    print("Please check your backend/.env file and ensure it is in the correct location.")
    sys.exit(1)

SUPABASE_REST_URL = f"{SUPABASE_URL}/rest/v1"
SUPABASE_AUTH_ADMIN_URL = f"{SUPABASE_URL}/auth/v1/admin/users"

# --- PDF COLORS ---
COLOR_PRIMARY = HexColor('#FF3B5F') # Red/Pink (V-Recruit theme)
COLOR_SECONDARY = HexColor('#4CAF50') # Green (Recommended)
COLOR_TEXT = HexColor('#333333')
COLOR_BG_LIGHT = HexColor('#F5F5F5')

# --- HELPER FUNCTION ---
def get_supabase_headers(prefer_header="return=representation"):
    """Returns the headers required for making requests to Supabase as an admin."""
    return {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        "Prefer": prefer_header
    }

# --- MANUALLY HANDLE OPTIONS REQUESTS ---
@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        return response

# --- PRIMARY CANDIDATE CREATION ROUTE (UNCHANGED) ---
@app.route("/api/candidate/add", methods=["POST", "OPTIONS"])
def add_new_candidate():
    if request.method == "OPTIONS":
        return handle_options()
        
    try:
        data = request.json
        if data is None: 
            return jsonify({"error": "Invalid JSON payload received. Body is empty or malformed."}), 400
            
        headers = get_supabase_headers()
        user_id = None

        # --- Step 1: Create the Authentication User ---
        email = data.get('email')
        if not email:
            email = f"temp_{uuid.uuid4().hex[:8]}@candidate.vit.edu.in"

        full_name = f"{data.get('first_name', '')} {data.get('surname', '')}".strip()
        if not full_name:
            return jsonify({"error": "First name and surname are required."}), 400

        auth_payload = {
            "email": email,
            "password": str(uuid.uuid4()),
            "email_confirm": True,
            "user_metadata": {"full_name": full_name, "role": "candidate"}
        }

        auth_response = requests.post(SUPABASE_AUTH_ADMIN_URL, headers=headers, json=auth_payload)

        if auth_response.status_code != 200:
            error_detail = auth_response.json() if auth_response.content else "No response content"
            return jsonify({
                "error": "Failed to create authentication user. Check Supabase URL/Key.",
                "supabase_error": error_detail
            }), auth_response.status_code

        new_user = auth_response.json()
        user_id = new_user.get('id')

        # --- Step 2: Build the Detailed Profile Payload ---
        profile_payload = {
            "user_id": user_id,
            "position_applied_for": data.get("position_applied_for"),
            "first_name": data.get("first_name"),
            "father_or_husband_name": data.get("father_or_husband_name"),
            "surname": data.get("surname"),
            "current_address": data.get("current_address"),
            "permanent_address": data.get("permanent_address"),
            "mobile": data.get("mobile"),
            "email": data.get("email"),
            "date_of_birth": data.get("date_of_birth") if data.get("date_of_birth") else None,
            "marital_status": data.get("marital_status"),
            "gender": data.get("gender"),
            "religion": data.get("religion"),
            "caste": data.get("caste"),
            "category": data.get("category"),
            "nationality": data.get("nationality"),
            "blood_group": data.get("blood_group"),
            "allergies": data.get("allergies"),
            "disability": data.get("disability"),
            "aadhar_card_no": data.get("aadhar_card_no"),
            "pan_no": data.get("pan_no"),
            "resume_url": data.get("resume_url"), 
            
            # Use json.dumps with defaults to prevent errors on null data from frontend
            "academic_details": json.dumps(data.get("academic_details") or []),
            "experience_details": json.dumps(data.get("experience_details") or []),
            "computer_skills": json.dumps(data.get("computer_skills") or {}),
            "languages_known": json.dumps(data.get("languages_known") or {}),
            "additional_info": json.dumps(data.get("additional_info") or {}),
            "reporting_officers": json.dumps(data.get("reporting_officers") or []),
            "self_ratings": json.dumps(data.get("self_ratings") or {}),
            "family_details": json.dumps(data.get("family_details") or []),
        }

        # --- Step 3: Insert the Profile ---
        profile_response = requests.post(
            f"{SUPABASE_REST_URL}/candidate_profiles",
            headers=headers,
            json=profile_payload
        )

        if profile_response.status_code not in [200, 201, 204]:
            error_detail = profile_response.text
            
            # Clean up: Delete the auth user
            if user_id:
                requests.delete(f"{SUPABASE_AUTH_ADMIN_URL}/{user_id}", headers=headers)
            
            return jsonify({
                "error": "Failed to save candidate profile. Check Supabase RLS on candidate_profiles table.",
                "supabase_error": error_detail
            }), 500

        return jsonify({
            "uid": user_id, 
            "message": "Candidate created and profile saved successfully."
        }), 201

    except Exception as e:
        print(f"--- UNEXPECTED SERVER ERROR ---")
        print(traceback.format_exc()) 
        print(f"--- END ERROR ---")
        return jsonify({
            "error": "An unexpected server error occurred. Check server console for details.",
            "details": str(e)
        }), 500

@app.route("/api/test", methods=["GET"])
def test_route():
    return jsonify({"message": "Flask server is working!"})

# --- DYNAMIC REPORT GENERATION FUNCTION ---
def fetch_candidate_data_for_report(candidate_id):
    """Fetches and aggregates real data from Supabase for report generation."""
    headers = get_supabase_headers(prefer_header="return=representation")

    # 1. Fetch Candidate Profile Info
    profile_url = f"{SUPABASE_REST_URL}/candidate_profiles"
    profile_params = {"select": "first_name,surname,position_applied_for,final_verdict", "user_id": f"eq.{candidate_id}"}
    profile_response = requests.get(profile_url, headers=headers, params=profile_params)
    
    if profile_response.status_code != 200 or not profile_response.json():
        candidate_info = {"name": "Unknown Candidate", "position": "N/A", "final_verdict": "N/A"}
    else:
        profile = profile_response.json()[0]
        candidate_info = {
            "name": f"{profile.get('first_name', '')} {profile.get('surname', '')}".strip(),
            "position": profile.get("position_applied_for", "N/A"),
            "final_verdict": profile.get("final_verdict", "N/A")
        }

    # 2. Fetch all completed evaluations
    evals_url = f"{SUPABASE_REST_URL}/evaluations"
    evals_params = {
        "select": "round_type,total_score,total_max_score,quantitative_scores,qualitative_comments",
        "candidate_uid": f"eq.{candidate_id}",
        "is_complete": "eq.true"
    }
    evals_response = requests.get(evals_url, headers=headers, params=evals_params)
    
    if evals_response.status_code != 200:
        raise Exception(f"Supabase error fetching evaluations: {evals_response.text}")

    evaluations = evals_response.json()

    # 3. Aggregate Data
    if not evaluations:
        return {
            "candidate_info": {**candidate_info, "recommendation": "N/A", "overall_score": 0, "max_score": 100, "total_score_sum": 0, "total_max_score_sum": 0},
            "grouped_by_round": [], "section_scores": [], "ai_summary": "No completed evaluations found."
        }

    aggregated_data = {}
    section_scores = []
    all_comments = []

    for eval_data in evaluations:
        round_type = eval_data['round_type']
        score = eval_data['total_score']
        max_score = eval_data['total_max_score']
        
        # Group by Round
        if round_type not in aggregated_data:
            aggregated_data[round_type] = {"totalScore": 0, "totalMaxScore": 0, "sections": []}
        
        aggregated_data[round_type]["totalScore"] += score
        aggregated_data[round_type]["totalMaxScore"] += max_score
        
        # Parse JSON fields
        try:
            quantitative = json.loads(eval_data.get('quantitative_scores', '{}'))
        except (TypeError, json.JSONDecodeError):
            quantitative = {}

        try:
            qualitative = json.loads(eval_data.get('qualitative_comments', '[]'))
        except (TypeError, json.JSONDecodeError):
            qualitative = []

        if qualitative:
            all_comments.extend(qualitative)

        for module, data in quantitative.items():
             section_scores.append({
                 "section": module,
                 "score": data.get('score', 0),
                 "max": data.get('max', 0),
                 "comment": next((c['comment'] for c in qualitative if c.get('round') == module), 'N/A')
             })

    # 4. Final Calculations
    grouped_by_round = []
    total_score_sum = 0
    total_max_score_sum = 0

    for round_type, data in aggregated_data.items():
        avg_score = round(data["totalScore"] / data["totalMaxScore"] * 100) if data["totalMaxScore"] > 0 else 0
        
        grouped_by_round.append({
            "round": round_type, 
            "avg_score": avg_score, 
            "score": data["totalScore"], 
            "max_score": data["totalMaxScore"]
        })
        total_score_sum += data["totalScore"]
        total_max_score_sum += data["totalMaxScore"]

    # Overall Metrics
    overall_avg = round(total_score_sum / total_max_score_sum * 100) if total_max_score_sum > 0 else 0
    recommendation = candidate_info['final_verdict'] if candidate_info['final_verdict'] != 'N/A' else ('Strongly Recommended' if overall_avg > 80 else ('Waitlist' if overall_avg > 60 else 'Not Recommended'))
    
    mock_summary = f"Based on {len(evaluations)} completed evaluations, the overall score is {overall_avg}%. Candidate {candidate_info['name']} is rated as {recommendation} for the position."

    # Aggregated section scores for PDF detailed view
    final_section_scores = {}
    for score in section_scores:
        section = score['section']
        if section not in final_section_scores:
            final_section_scores[section] = {"score": 0, "max": 0, "count": 0, "comments": []}
        
        final_section_scores[section]["score"] += score['score']
        final_section_scores[section]["max"] += score['max']
        final_section_scores[section]["count"] += 1
        if score['comment'] != 'N/A':
             final_section_scores[section]["comments"].append(score['comment'])

    pdf_section_scores = []
    for section, data in final_section_scores.items():
        pdf_section_scores.append({
            "section": section, 
            "score": data["score"],
            "max": data["max"],
            "avg_score": round(data["score"] / data["max"] * 100) if data["max"] > 0 else 0,
            "comment": " | ".join(data["comments"]) if data["comments"] else "No specific qualitative comments."
        })


    return {
        "candidate_info": {
            **candidate_info, 
            "recommendation": recommendation,
            "overall_score": overall_avg,
            "max_score": 100,
            "total_score_sum": total_score_sum,
            "total_max_score_sum": total_max_score_sum
        },
        "grouped_by_round": grouped_by_round,
        "section_scores": pdf_section_scores, 
        "ai_summary": mock_summary
    }

@app.route("/api/report", methods=["GET"])
def generate_pdf_report():
    candidate_id = request.args.get('candidate_id')
    if not candidate_id:
        return jsonify({"error": "Candidate ID is required."}), 400
    
    try:
        report_data = fetch_candidate_data_for_report(candidate_id)
    except Exception as e:
        return jsonify({"error": f"Error fetching report data: {str(e)}"}), 500

    try:
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        p.setTitle("Candidate Performance Report")
        
        # --- Start Drawing (Beautified Layout) ---
        
        MARGIN_LEFT = 50
        MARGIN_RIGHT = 550
        LINE_HEIGHT = 16
        y = 750
        
        # Title and Candidate Info
        p.setFillColor(COLOR_PRIMARY)
        p.setFont("Helvetica-Bold", 20)
        p.drawString(MARGIN_LEFT, y, "Candidate Performance Report")
        p.setFillColor(COLOR_TEXT)
        y -= 25
        
        p.setFont("Helvetica", 10)
        p.drawString(MARGIN_LEFT, y, f"Candidate: {report_data['candidate_info']['name']}")
        p.drawString(MARGIN_LEFT + 250, y, f"ID: {candidate_id}")
        y -= LINE_HEIGHT
        p.drawString(MARGIN_LEFT, y, f"Position: {report_data['candidate_info']['position']}")
        y -= 30
        
        # Overall Summary Box
        REC_COLOR = COLOR_SECONDARY if "Recommended" in report_data['candidate_info']['recommendation'] else COLOR_PRIMARY
        
        p.setFillColor(COLOR_BG_LIGHT)
        p.roundRect(MARGIN_LEFT, y - 5, MARGIN_RIGHT - MARGIN_LEFT, 50, 8, fill=1)
        p.setFillColor(COLOR_TEXT)
        
        p.setFont("Helvetica-Bold", 12)
        p.drawString(MARGIN_LEFT + 10, y + 25, "Overall Score:")
        p.drawString(MARGIN_LEFT + 10, y + 10, "Recommendation:")
        
        p.setFont("Helvetica-Bold", 16)
        p.drawString(MARGIN_LEFT + 150, y + 25, f"{report_data['candidate_info']['total_score_sum']}/{report_data['candidate_info']['total_max_score_sum']}")
        
        p.setFillColor(REC_COLOR)
        p.drawString(MARGIN_LEFT + 150, y + 10, report_data['candidate_info']['recommendation'])
        p.setFillColor(COLOR_TEXT)
        y -= 60
        
        # Round-wise Scores Section
        p.setFont("Helvetica-Bold", 14)
        p.drawString(MARGIN_LEFT, y, "Evaluation Scores Breakdown")
        y -= 5
        p.setStrokeColor(COLOR_PRIMARY)
        p.line(MARGIN_LEFT, y, MARGIN_RIGHT, y)
        y -= 15
        
        p.setFont("Helvetica-Bold", 10)
        p.drawString(MARGIN_LEFT + 10, y, "Round Type")
        p.drawString(MARGIN_LEFT + 200, y, "Total Score")
        p.drawString(MARGIN_LEFT + 350, y, "Average %")
        p.setStrokeColor(HexColor('#BBBBBB'))
        p.line(MARGIN_LEFT, y - 2, MARGIN_RIGHT, y - 2)
        y -= 15
        
        p.setFont("Helvetica", 10)
        for round_data in report_data['grouped_by_round']:
            p.drawString(MARGIN_LEFT + 10, y, round_data['round'])
            p.drawString(MARGIN_LEFT + 200, y, f"{round_data['score']}/{round_data['max_score']}")
            p.drawString(MARGIN_LEFT + 350, y, f"{round_data['avg_score']}%")
            y -= LINE_HEIGHT
        y -= 20

        # AI Summary Section
        p.setFont("Helvetica-Bold", 14)
        p.drawString(MARGIN_LEFT, y, "AI Summary & Insights")
        y -= 5
        p.setStrokeColor(COLOR_PRIMARY)
        p.line(MARGIN_LEFT, y, MARGIN_RIGHT, y)
        y -= 20
        
        p.setFont("Helvetica-Oblique", 10)
        
        summary_lines = []
        line_buffer = ""
        words = report_data['ai_summary'].split(' ')
        for word in words:
            if p.stringWidth(line_buffer + word, "Helvetica-Oblique", 10) < (MARGIN_RIGHT - MARGIN_LEFT - 20):
                line_buffer += word + " "
            else:
                summary_lines.append(line_buffer.strip())
                line_buffer = word + " "
        summary_lines.append(line_buffer.strip())

        for line in summary_lines:
            p.drawString(MARGIN_LEFT + 10, y, line)
            y -= LINE_HEIGHT
            
        y -= 20
        
        # Detailed Section Scores
        if report_data['section_scores']:
            p.setFont("Helvetica-Bold", 14)
            p.drawString(MARGIN_LEFT, y, "Detailed Dimension Analysis")
            y -= 5
            p.setStrokeColor(COLOR_PRIMARY)
            p.line(MARGIN_LEFT, y, MARGIN_RIGHT, y)
            y -= 20
            
            p.setFont("Helvetica-Bold", 10)
            
            for score_data in report_data['section_scores']:
                 # Check for page break
                 if y < 100:
                     p.showPage()
                     y = 750
                     p.setFont("Helvetica", 12)
                     p.drawString(MARGIN_LEFT, y, f"Detailed Analysis (Continued for {report_data['candidate_info']['name']})")
                     y -= 20
                     p.setFont("Helvetica-Bold", 10)
                     
                 # Section Header
                 p.setFillColor(COLOR_PRIMARY)
                 p.drawString(MARGIN_LEFT + 5, y, f"{score_data['section']} ({score_data['avg_score']}%)")
                 p.setFillColor(COLOR_TEXT)
                 y -= LINE_HEIGHT
                 
                 # Detailed Comment/Score
                 p.setFont("Helvetica", 9)
                 comment_text = score_data.get('comment', 'No comments available.')
                 
                 # Wrap comment text
                 comment_lines = []
                 line_buffer = f"Score: {score_data['score']}/{score_data['max']} | Comment: "
                 words = comment_text.split(' ')
                 
                 for word in words:
                     if p.stringWidth(line_buffer + word, "Helvetica", 9) < (MARGIN_RIGHT - MARGIN_LEFT - 20):
                         line_buffer += word + " "
                     else:
                         comment_lines.append(line_buffer.strip())
                         line_buffer = word + " "
                 comment_lines.append(line_buffer.strip())
                 
                 for line in comment_lines:
                      p.drawString(MARGIN_LEFT + 15, y, line)
                      y -= 12 # Tighter spacing for detailed comments
                      if y < 60: break # Ensure it doesn't go off the bottom

                 y -= 10 # Extra space after each section analysis


        p.showPage()
        p.save()
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f'VRecruitment_Report_{candidate_id}.pdf',
            mimetype='application/pdf'
        )
    except Exception as e:
        print(f"--- PDF GENERATION ERROR ---")
        print(traceback.format_exc()) 
        print(f"--- END ERROR ---")
        return jsonify({"error": f"PDF generation failed: {str(e)}"}), 500


@app.route("/api/report/excel", methods=["GET"])
def generate_excel_report():
    candidate_id = request.args.get('candidate_id')
    
    try:
        report_data = fetch_candidate_data_for_report(candidate_id)
    except Exception as e:
        return jsonify({"error": f"Error fetching report data: {str(e)}"}), 500
        
    info = report_data['candidate_info']
    
    csv_content = io.StringIO()
    csv_content.write(f"V-Recruitment Grouped Report for,{info['name']}\n")
    csv_content.write(f"Candidate ID,{candidate_id}\n")
    csv_content.write(f"Overall Score,{info['total_score_sum']}/{info['total_max_score_sum']}\n")
    csv_content.write(f"Final Recommendation,{info['recommendation']}\n\n")

    csv_content.write("Round,Score,Max Score,Average Percentage\n")
    for round_data in report_data['grouped_by_round']:
        csv_content.write(f"{round_data['round']},{round_data['score']},{round_data['max_score']},{round_data['avg_score']}%\n")

    csv_content.write("\nDetailed Section Scores/Comments\n")
    csv_content.write("Section,Score,Max Score,Comment\n")
    for section_data in report_data['section_scores']:
        csv_content.write(f"{section_data['section']},{section_data.get('score', 'N/A')},{section_data.get('max', 'N/A')},{section_data.get('comment', 'N/A')}\n")
        
    output = io.BytesIO(csv_content.getvalue().encode('utf-8'))
    output.seek(0)
    
    return send_file(
        output,
        as_attachment=True,
        download_name=f'VRecruitment_Grouped_Data_{candidate_id}.csv',
        mimetype='text/csv'
    )


@app.route("/api/summarize", methods=['POST'])
def summarize_comments():
    data = request.json
    comments = data.get('comments', [])
    
    mock_summary = "Based on evaluations across various rounds, the candidate demonstrated strong core competencies and high emotional intelligence. Key areas for development are noted in system design architecture where more depth is required. Overall: A promising candidate with minor gaps."
    
    if not comments:
         return jsonify({"summary": "No qualitative data provided for summary generation."})
         
    return jsonify({"summary": mock_summary})


if __name__ == "__main__":
    app.run(debug=True, port=5000)