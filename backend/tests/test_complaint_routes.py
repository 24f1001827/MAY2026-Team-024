import uuid
from unittest.mock import MagicMock, patch
import pytest
from flask_jwt_extended import create_access_token
from app.models import UserRole

@pytest.fixture
def citizen_headers(client):
    with client.application.app_context():
        token = create_access_token(
            identity="citizen-user-id",
            additional_claims={"role": UserRole.CITIZEN.value},
        )
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def agency_headers(client):
    with client.application.app_context():
        token = create_access_token(
            identity="agency-user-id",
            additional_claims={"role": "agency"},
        )
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def complaint_id():
    return str(uuid.uuid4())

# Create complaint
def test_create_complaint_requires_authentication(client):
    response = client.post("/api/v1/complaints", data={"title": "Pothole"})

    assert response.status_code == 401

def test_create_complaint_rejects_non_citizen(client, agency_headers):
    response = client.post(
        "/api/v1/complaints",
        headers=agency_headers,
        data={"title": "Pothole"},
    )

    assert response.status_code == 403

@patch("app.routes.complaint_route.validate_images")
@patch("app.routes.complaint_route.ComplaintService.create_complaint")
@patch("app.routes.complaint_route.ComplaintSchema.load")
def test_create_complaint_success(
    mock_load,
    mock_create,
    mock_validate_images,
    client,
    citizen_headers,
):
    payload = {"title": "Large pothole near bus stop"}
    validated_data = {"title": "Large pothole near bus stop"}
    created_id = uuid.uuid4()

    mock_load.return_value = validated_data
    mock_create.return_value = MagicMock(id=created_id)

    response = client.post(
        "/api/v1/complaints",
        headers=citizen_headers,
        data=payload,
    )

    body = response.get_json()
    assert response.status_code == 201
    assert body["success"] is True
    assert body["message"] == "Complaint created successfully."
    assert body["complaint_id"] == str(created_id)
    mock_load.assert_called_once_with(payload)
    mock_validate_images.assert_called_once_with([])
    mock_create.assert_called_once_with(validated_data, [])

@patch("app.routes.complaint_route.ComplaintSchema.load")
def test_create_complaint_validation_error(mock_load, client, citizen_headers):
    from marshmallow import ValidationError

    mock_load.side_effect = ValidationError({"title": ["Field required."]})

    response = client.post(
        "/api/v1/complaints",
        headers=citizen_headers,
        data={},
    )

    body = response.get_json()
    assert response.status_code == 422
    assert body["success"] is False
    assert body["errors"]["title"] == ["Field required."]

@patch("app.routes.complaint_route.validate_images")
@patch("app.routes.complaint_route.ComplaintSchema.load")
def test_create_complaint_invalid_image_currently_returns_404(
    mock_load,
    mock_validate_images,
    client,
    citizen_headers,
):
    """
    Current route behavior maps ValueError to 404.

    Recommended route improvement:
    invalid image type/size should return 422, not 404.
    """
    mock_load.return_value = {"title": "Pothole"}
    mock_validate_images.side_effect = ValueError("Invalid image type.")

    response = client.post(
        "/api/v1/complaints",
        headers=citizen_headers,
        data={"title": "Pothole"},
    )

    assert response.status_code == 404
    assert response.get_json()["success"] is False

@patch("app.routes.complaint_route.validate_images")
@patch("app.routes.complaint_route.ComplaintService.create_complaint")
@patch("app.routes.complaint_route.ComplaintSchema.load")
def test_create_complaint_referenced_resource_not_found(
    mock_load,
    mock_create,
    mock_validate_images,
    client,
    citizen_headers,
):
    mock_load.return_value = {"title": "Pothole"}
    mock_create.side_effect = ValueError("Category not found.")

    response = client.post(
        "/api/v1/complaints",
        headers=citizen_headers,
        data={"title": "Pothole"},
    )

    assert response.status_code == 404
    assert response.get_json()["success"] is False
    assert response.get_json()["message"] == "Category not found."

@patch("app.routes.complaint_route.validate_images")
@patch("app.routes.complaint_route.ComplaintService.create_complaint")
@patch("app.routes.complaint_route.ComplaintSchema.load")
def test_create_complaint_server_error(
    mock_load,
    mock_create,
    mock_validate_images,
    client,
    citizen_headers,
):
    mock_load.return_value = {"title": "Pothole"}
    mock_create.side_effect = Exception("Database unavailable")

    response = client.post(
        "/api/v1/complaints",
        headers=citizen_headers,
        data={"title": "Pothole"},
    )

    assert response.status_code == 500
    assert response.get_json()["success"] is False
    assert response.get_json()["message"] == "Internal server error."

# Get current citizen's complaints
def test_get_my_complaints_requires_authentication(client):
    response = client.get("/api/v1/complaints/my")

    assert response.status_code == 401

def test_get_my_complaints_rejects_non_citizen(client, agency_headers):
    response = client.get("/api/v1/complaints/my", headers=agency_headers)

    assert response.status_code == 403

@patch("app.routes.complaint_route.ComplaintResponseSchema")
@patch("app.routes.complaint_route.ComplaintService.get_my_complaints")
def test_get_my_complaints_success(
    mock_get_complaints,
    mock_response_schema,
    client,
    citizen_headers,
):
    mock_get_complaints.return_value = [MagicMock(), MagicMock()]
    mock_response_schema.return_value.dump.return_value = [
        {"id": "complaint-1", "title": "Pothole"},
        {"id": "complaint-2", "title": "Water leak"},
    ]

    response = client.get("/api/v1/complaints/my", headers=citizen_headers)

    body = response.get_json()
    assert response.status_code == 200
    assert body["success"] is True
    assert len(body["data"]) == 2
    mock_response_schema.assert_called_once_with(many=True)

@patch("app.routes.complaint_route.ComplaintResponseSchema")
@patch("app.routes.complaint_route.ComplaintService.get_my_complaints")
def test_get_my_complaints_empty_list(
    mock_get_complaints,
    mock_response_schema,
    client,
    citizen_headers,
):
    mock_get_complaints.return_value = []
    mock_response_schema.return_value.dump.return_value = []

    response = client.get("/api/v1/complaints/my", headers=citizen_headers)

    assert response.status_code == 200
    assert response.get_json()["data"] == []

@patch("app.routes.complaint_route.ComplaintService.get_my_complaints")
def test_get_my_complaints_server_error(mock_get_complaints, client, citizen_headers):
    mock_get_complaints.side_effect = Exception("Database unavailable")

    response = client.get("/api/v1/complaints/my", headers=citizen_headers)

    assert response.status_code == 500
    assert response.get_json()["message"] == "Internal server error."

# Get one complaint
def test_get_complaint_requires_authentication(client, complaint_id):
    response = client.get(f"/api/v1/complaints/{complaint_id}")

    assert response.status_code == 401

@patch("app.routes.complaint_route.ComplaintResponseSchema")
@patch("app.routes.complaint_route.ComplaintService.get_complaint_by_id")
def test_get_complaint_success(
    mock_get_complaint,
    mock_response_schema,
    client,
    citizen_headers,
    complaint_id,
):
    complaint = MagicMock()
    mock_get_complaint.return_value = complaint
    mock_response_schema.return_value.dump.return_value = {
        "id": complaint_id,
        "title": "Pothole",
        "status": "filed",
    }

    response = client.get(
        f"/api/v1/complaints/{complaint_id}",
        headers=citizen_headers,
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["id"] == complaint_id
    mock_get_complaint.assert_called_once_with(uuid.UUID(complaint_id))

@patch("app.routes.complaint_route.ComplaintService.get_complaint_by_id")
def test_get_complaint_not_found(
    mock_get_complaint,
    client,
    citizen_headers,
    complaint_id,
):
    mock_get_complaint.side_effect = ValueError("Complaint not found.")

    response = client.get(
        f"/api/v1/complaints/{complaint_id}",
        headers=citizen_headers,
    )

    assert response.status_code == 404

@patch("app.routes.complaint_route.ComplaintService.get_complaint_by_id")
def test_get_complaint_forbidden(
    mock_get_complaint,
    client,
    citizen_headers,
    complaint_id,
):
    mock_get_complaint.side_effect = PermissionError("Access denied.")

    response = client.get(
        f"/api/v1/complaints/{complaint_id}",
        headers=citizen_headers,
    )

    assert response.status_code == 403

# Update complaint
def test_update_complaint_requires_authentication(client, complaint_id):
    response = client.put(
        f"/api/v1/complaints/{complaint_id}",
        data={"title": "Updated pothole"},
    )

    assert response.status_code == 401

def test_update_complaint_rejects_non_citizen(client, agency_headers, complaint_id):
    response = client.put(
        f"/api/v1/complaints/{complaint_id}",
        headers=agency_headers,
        data={"title": "Updated pothole"},
    )

    assert response.status_code == 403

@patch("app.routes.complaint_route.validate_images")
@patch("app.routes.complaint_route.ComplaintResponseSchema")
@patch("app.routes.complaint_route.ComplaintService.update_complaint")
@patch("app.routes.complaint_route.ComplaintSchema.load")
def test_update_complaint_success_without_images(
    mock_load,
    mock_update,
    mock_response_schema,
    mock_validate_images,
    client,
    citizen_headers,
    complaint_id,
):
    validated_data = {"title": "Updated pothole"}
    mock_load.return_value = validated_data
    mock_update.return_value = MagicMock()
    mock_response_schema.return_value.dump.return_value = {
        "id": complaint_id,
        "title": "Updated pothole",
    }

    response = client.put(
        f"/api/v1/complaints/{complaint_id}",
        headers=citizen_headers,
        data={"title": "Updated pothole"},
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["title"] == "Updated pothole"
    mock_validate_images.assert_not_called()
    mock_update.assert_called_once_with(
        uuid.UUID(complaint_id),
        validated_data,
        [],
    )

@patch("app.routes.complaint_route.ComplaintSchema.load")
def test_update_complaint_validation_error(
    mock_load,
    client,
    citizen_headers,
    complaint_id,
):
    from marshmallow import ValidationError

    mock_load.side_effect = ValidationError({"title": ["Field required."]})

    response = client.put(
        f"/api/v1/complaints/{complaint_id}",
        headers=citizen_headers,
        data={},
    )

    assert response.status_code == 422

@patch("app.routes.complaint_route.ComplaintService.update_complaint")
@patch("app.routes.complaint_route.ComplaintSchema.load")
def test_update_complaint_not_found(
    mock_load,
    mock_update,
    client,
    citizen_headers,
    complaint_id,
):
    mock_load.return_value = {"title": "Updated pothole"}
    mock_update.side_effect = ValueError("Complaint not found.")

    response = client.put(
        f"/api/v1/complaints/{complaint_id}",
        headers=citizen_headers,
        data={"title": "Updated pothole"},
    )

    assert response.status_code == 404

@patch("app.routes.complaint_route.ComplaintService.update_complaint")
@patch("app.routes.complaint_route.ComplaintSchema.load")
def test_update_complaint_forbidden(
    mock_load,
    mock_update,
    client,
    citizen_headers,
    complaint_id,
):
    mock_load.return_value = {"title": "Updated pothole"}
    mock_update.side_effect = PermissionError("You do not own this complaint.")

    response = client.put(
        f"/api/v1/complaints/{complaint_id}",
        headers=citizen_headers,
        data={"title": "Updated pothole"},
    )

    assert response.status_code == 403

@patch("app.routes.complaint_route.ComplaintService.update_complaint")
@patch("app.routes.complaint_route.ComplaintSchema.load")
def test_update_complaint_server_error(
    mock_load,
    mock_update,
    client,
    citizen_headers,
    complaint_id,
):
    mock_load.return_value = {"title": "Updated pothole"}
    mock_update.side_effect = Exception("Database unavailable")

    response = client.put(
        f"/api/v1/complaints/{complaint_id}",
        headers=citizen_headers,
        data={"title": "Updated pothole"},
    )

    assert response.status_code == 500

# Delete complaint
def test_delete_complaint_requires_authentication(client, complaint_id):
    response = client.delete(f"/api/v1/complaints/{complaint_id}")

    assert response.status_code == 401

def test_delete_complaint_rejects_non_citizen(client, agency_headers, complaint_id):
    response = client.delete(
        f"/api/v1/complaints/{complaint_id}",
        headers=agency_headers,
    )

    assert response.status_code == 403

@patch("app.routes.complaint_route.ComplaintService.delete_complaint")
def test_delete_complaint_success(
    mock_delete,
    client,
    citizen_headers,
    complaint_id,
):
    response = client.delete(
        f"/api/v1/complaints/{complaint_id}",
        headers=citizen_headers,
    )

    body = response.get_json()
    assert response.status_code == 200
    assert body["success"] is True
    assert body["message"] == "Complaint deleted successfully."
    mock_delete.assert_called_once_with(uuid.UUID(complaint_id))

@patch("app.routes.complaint_route.ComplaintService.delete_complaint")
def test_delete_complaint_not_found(
    mock_delete,
    client,
    citizen_headers,
    complaint_id,
):
    mock_delete.side_effect = ValueError("Complaint not found.")

    response = client.delete(
        f"/api/v1/complaints/{complaint_id}",
        headers=citizen_headers,
    )

    assert response.status_code == 404

@patch("app.routes.complaint_route.ComplaintService.delete_complaint")
def test_delete_complaint_forbidden(
    mock_delete,
    client,
    citizen_headers,
    complaint_id,
):
    mock_delete.side_effect = PermissionError("You do not own this complaint.")

    response = client.delete(
        f"/api/v1/complaints/{complaint_id}",
        headers=citizen_headers,
    )

    assert response.status_code == 403

@patch("app.routes.complaint_route.ComplaintService.delete_complaint")
def test_delete_complaint_server_error(
    mock_delete,
    client,
    citizen_headers,
    complaint_id,
):
    mock_delete.side_effect = Exception("Database unavailable")

    response = client.delete(
        f"/api/v1/complaints/{complaint_id}",
        headers=citizen_headers,
    )

    assert response.status_code == 500
    assert response.get_json()["message"] == "Internal server error."