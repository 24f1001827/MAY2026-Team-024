import uuid
from unittest.mock import MagicMock, patch
from marshmallow import ValidationError

def test_get_my_complaints_success(client, officer_headers):
    with patch("app.routes.officer_route.get_jwt_identity", return_value="officer-1"), \
         patch("app.routes.officer_route.OfficerService.get_my_complaints", return_value=[MagicMock()]), \
         patch("app.routes.officer_route.complaints_schema.dump", return_value=[{"complaint_id": "1"}]):
        response = client.get("/api/v1/officer/complaints", headers=officer_headers)

    assert response.status_code == 200
    assert response.get_json()["data"] == [{"complaint_id": "1"}]

def test_get_my_complaints_requires_authentication(client):
    assert client.get("/api/v1/officer/complaints").status_code == 401

def test_get_my_complaints_rejects_citizen(client, citizen_headers):
    assert client.get("/api/v1/officer/complaints", headers=citizen_headers).status_code == 403

def test_get_my_complaints_not_found(client, officer_headers):
    with patch("app.routes.officer_route.get_jwt_identity", return_value="officer-1"), \
         patch("app.routes.officer_route.OfficerService.get_my_complaints", side_effect=ValueError("Officer not found.")):
        response = client.get("/api/v1/officer/complaints", headers=officer_headers)
    assert response.status_code == 404

def test_accept_assignment_success(client, officer_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.officer_route.get_jwt_identity", return_value="officer-1"), \
         patch("app.routes.officer_route.OfficerService.accept_assignment", return_value=MagicMock()) as service, \
         patch("app.routes.officer_route.assignment_schema.dump", return_value={"status": "accepted"}):
        response = client.patch(f"/api/v1/officer/complaints/{complaint_id}/accept", headers=officer_headers)

    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == "accepted"
    service.assert_called_once_with("officer-1", complaint_id)

def test_reject_assignment_invalid_state(client, officer_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.officer_route.get_jwt_identity", return_value="officer-1"), \
         patch("app.routes.officer_route.OfficerService.reject_assignment", side_effect=ValueError("Assignment cannot be rejected.")):
        response = client.patch(f"/api/v1/officer/complaints/{complaint_id}/reject", headers=officer_headers)

    assert response.status_code == 400
    assert response.get_json()["success"] is False

def test_submit_review_report_success(client, officer_headers):
    complaint_id = uuid.uuid4()
    payload = {"remarks": "Inspection completed"}
    with patch("app.routes.officer_route.get_jwt_identity", return_value="officer-1"), \
         patch("app.routes.officer_route.create_review_report_schema.load", return_value=payload), \
         patch("app.routes.officer_route.OfficerService.submit_review_report", return_value=MagicMock()), \
         patch("app.routes.officer_route.review_report_response_schema.dump", return_value={"id": "report-1"}):
        response = client.post(f"/api/v1/officer/complaints/{complaint_id}/review-report", headers=officer_headers, json=payload)

    assert response.status_code == 201
    assert response.get_json()["message"] == "Review report submitted successfully."

def test_submit_review_report_validation_error(client, officer_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.officer_route.create_review_report_schema.load", side_effect=ValidationError({"remarks": ["Field required."]})):
        response = client.post(f"/api/v1/officer/complaints/{complaint_id}/review-report", headers=officer_headers, json={})

    assert response.status_code == 422

def test_submit_review_report_invalid_state(client, officer_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.officer_route.create_review_report_schema.load", return_value={"findings": "x"}), \
         patch("app.routes.officer_route.OfficerService.submit_review_report", side_effect=ValueError("Assignment not accepted.")):
        response = client.post(f"/api/v1/officer/complaints/{complaint_id}/review-report", headers=officer_headers, json={"findings": "x"})
    assert response.status_code == 400

def test_get_complaint_details_not_found(client, officer_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.officer_route.get_jwt_identity", return_value="officer-1"), \
         patch("app.routes.officer_route.OfficerService.get_complaint_details", side_effect=ValueError("Complaint not found.")):
        response = client.get(f"/api/v1/officer/complaints/{complaint_id}", headers=officer_headers)

    assert response.status_code == 404

def test_request_budget_success(client, officer_headers):
    complaint_id = uuid.uuid4()
    complaint = MagicMock(id=complaint_id, status=MagicMock(value="budget_requested"))
    with patch("app.routes.officer_route.get_jwt_identity", return_value="officer-1"), \
         patch("app.routes.officer_route.OfficerService.request_budget", return_value=complaint):
        response = client.post(f"/api/v1/officer/complaints/{complaint_id}/budget-request", headers=officer_headers)

    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == "budget_requested"

def test_create_tender_success(client, officer_headers):
    complaint_id = uuid.uuid4()
    payload = {"title": "Road repair tender"}
    with patch("app.routes.officer_route.get_jwt_identity", return_value="officer-1"), \
         patch("app.routes.officer_route.create_tender_schema.load", return_value=payload), \
         patch("app.routes.officer_route.OfficerService.create_tender", return_value=MagicMock()), \
         patch("app.routes.officer_route.tender_response_schema.dump", return_value={"id": "tender-1"}):
        response = client.post(f"/api/v1/officer/complaints/{complaint_id}/tender", headers=officer_headers, json=payload)

    assert response.status_code == 201
    assert response.get_json()["data"]["id"] == "tender-1"
