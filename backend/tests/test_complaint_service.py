import uuid
from unittest.mock import MagicMock, patch
import pytest
from app.models import ComplaintPriority, ComplaintStatus, UserRole
from app.services.complaint_service import ComplaintService

def complaint_data():
    return {
        "title": "Large pothole",
        "description": "Large pothole near bus stop",
        "department": "Roads",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "address": "Main Road",
        "locality": "Downtown",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560001",
    }

def make_user(user_id=1, role=UserRole.CITIZEN):
    return MagicMock(id=user_id, role=role)

def make_complaint(
    complaint_id=100,
    citizen_id=1,
    status=ComplaintStatus.SUBMITTED,
):
    complaint = MagicMock(
        id=complaint_id,
        citizen_id=citizen_id,
        status=status,
    )
    complaint.images = []
    return complaint

# CREATE COMPLAINT
@patch("app.services.complaint_service.db.session")
@patch("app.services.complaint_service.ComplaintImageRepository")
@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.DepartmentRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_create_complaint_success(
    mock_jwt,
    mock_user_repo,
    mock_department_repo,
    mock_complaint_repo,
    mock_image_repo,
    mock_db,
):
    user = make_user()
    department = MagicMock(id=10)
    complaint = make_complaint()

    mock_jwt.return_value = user.id
    mock_user_repo.get_by_id.return_value = user
    mock_department_repo.get_by_name.return_value = department
    mock_complaint_repo.create.return_value = complaint

    result = ComplaintService.create_complaint(complaint_data(), [])

    assert result == complaint
    mock_complaint_repo.create.assert_called_once_with(
        {
            "title": "Large pothole",
            "description": "Large pothole near bus stop",
            "citizen_id": 1,
            "department_id": 10,
            "latitude": 12.9716,
            "longitude": 77.5946,
            "address": "Main Road",
            "locality": "Downtown",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560001",
            "status": ComplaintStatus.SUBMITTED,
            "priority": ComplaintPriority.MEDIUM,
            "ai_category": "Unclassified",
            "ai_priority_score": 0,
        }
    )
    mock_db.flush.assert_called_once()
    assert mock_db.commit.call_count >= 1
    mock_image_repo.create.assert_not_called()

@patch("app.services.complaint_service.upload_image")
@patch("app.services.complaint_service.db.session")
@patch("app.services.complaint_service.ComplaintImageRepository")
@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.DepartmentRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_create_complaint_with_image(
    mock_jwt,
    mock_user_repo,
    mock_department_repo,
    mock_complaint_repo,
    mock_image_repo,
    mock_db,
    mock_upload_image,
):
    user = make_user()
    department = MagicMock(id=10)
    complaint = make_complaint()
    image = MagicMock()

    mock_jwt.return_value = user.id
    mock_user_repo.get_by_id.return_value = user
    mock_department_repo.get_by_name.return_value = department
    mock_complaint_repo.create.return_value = complaint
    mock_upload_image.return_value = {
    "image_url": "https://cloudinary.example/pothole.jpg",
    "public_id": "pothole-cloudinary-id",
    }

    ComplaintService.create_complaint(complaint_data(), [image])

    mock_upload_image.assert_called_once_with(image)
    mock_image_repo.create.assert_called_once_with(
    {
        "complaint_id": complaint.id,
        "uploaded_by": user.id,
        "image_url": "https://cloudinary.example/pothole.jpg",
        "public_id": "pothole-cloudinary-id",
      }
    )
    assert mock_db.commit.call_count >= 1

@patch("app.services.complaint_service.db.session")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_create_complaint_user_not_found(mock_jwt, mock_user_repo, mock_db):
    mock_jwt.return_value = 1
    mock_user_repo.get_by_id.return_value = None

    with pytest.raises(ValueError, match="User not found"):
        ComplaintService.create_complaint(complaint_data(), [])

    mock_db.rollback.assert_called_once()

@patch("app.services.complaint_service.db.session")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_create_complaint_rejects_non_citizen(mock_jwt, mock_user_repo, mock_db):
    mock_jwt.return_value = 2
    mock_user_repo.get_by_id.return_value = make_user(2, UserRole.OFFICER)

    with pytest.raises(PermissionError, match="Only citizens can create complaints"):
        ComplaintService.create_complaint(complaint_data(), [])

    mock_db.rollback.assert_called_once()

@patch("app.services.complaint_service.db.session")
@patch("app.services.complaint_service.DepartmentRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_create_complaint_department_not_found(
    mock_jwt,
    mock_user_repo,
    mock_department_repo,
    mock_db,
):
    mock_jwt.return_value = 1
    mock_user_repo.get_by_id.return_value = make_user()
    mock_department_repo.get_by_name.return_value = None

    with pytest.raises(ValueError, match="Department not found"):
        ComplaintService.create_complaint(complaint_data(), [])

    mock_db.rollback.assert_called_once()

@patch("app.services.complaint_service.upload_image")
@patch("app.services.complaint_service.db.session")
@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.DepartmentRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_create_complaint_rolls_back_upload_failure(
    mock_jwt,
    mock_user_repo,
    mock_department_repo,
    mock_complaint_repo,
    mock_db,
    mock_upload_image,
):
    mock_jwt.return_value = 1
    mock_user_repo.get_by_id.return_value = make_user()
    mock_department_repo.get_by_name.return_value = MagicMock(id=10)
    mock_complaint_repo.create.return_value = make_complaint()
    mock_upload_image.side_effect = Exception("Cloudinary upload failed")

    with pytest.raises(Exception, match="Cloudinary upload failed"):
        ComplaintService.create_complaint(complaint_data(), [MagicMock()])

    mock_db.rollback.assert_called_once()
    mock_db.commit.assert_not_called()

# GET COMPLAINTS
@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_get_my_complaints_success(mock_jwt, mock_user_repo, mock_complaint_repo):
    user = make_user()
    complaints = [make_complaint(), make_complaint(101)]

    mock_jwt.return_value = user.id
    mock_user_repo.get_by_id.return_value = user
    mock_complaint_repo.get_by_citizen_id.return_value = complaints

    result = ComplaintService.get_my_complaints()

    assert result == complaints
    mock_complaint_repo.get_by_citizen_id.assert_called_once_with(user.id)

@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_get_my_complaints_user_not_found(mock_jwt, mock_user_repo):
    mock_jwt.return_value = 1
    mock_user_repo.get_by_id.return_value = None

    with pytest.raises(ValueError, match="User not found"):
        ComplaintService.get_my_complaints()

@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_get_my_complaints_rejects_non_citizen(mock_jwt, mock_user_repo):
    mock_jwt.return_value = 2
    mock_user_repo.get_by_id.return_value = make_user(2, UserRole.OFFICER)

    with pytest.raises(PermissionError, match="Only citizens can view their complaints"):
        ComplaintService.get_my_complaints()

@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_get_complaint_by_id_success(mock_jwt, mock_user_repo, mock_complaint_repo):
    complaint_id = uuid.uuid4()
    complaint = make_complaint(complaint_id=complaint_id)

    mock_jwt.return_value = 1
    mock_user_repo.get_by_id.return_value = make_user()
    mock_complaint_repo.get_by_id.return_value = complaint

    result = ComplaintService.get_complaint_by_id(complaint_id)

    assert result == complaint
    mock_complaint_repo.get_by_id.assert_called_once_with(complaint_id)

@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_get_complaint_by_id_not_found(
    mock_jwt,
    mock_user_repo,
    mock_complaint_repo,
):
    mock_jwt.return_value = 1
    mock_user_repo.get_by_id.return_value = make_user()
    mock_complaint_repo.get_by_id.return_value = None

    with pytest.raises(ValueError, match="Complaint not found"):
        ComplaintService.get_complaint_by_id(uuid.uuid4())

# UPDATE COMPLAINT
@patch("app.services.complaint_service.db.session")
@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.DepartmentRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_update_complaint_success(
    mock_jwt,
    mock_user_repo,
    mock_department_repo,
    mock_complaint_repo,
    mock_db,
):
    complaint = make_complaint()
    department = MagicMock(id=10)
    data = complaint_data()

    mock_jwt.return_value = 1
    mock_user_repo.get_by_id.return_value = make_user()
    mock_complaint_repo.get_by_id.return_value = complaint
    mock_department_repo.get_by_name.return_value = department

    result = ComplaintService.update_complaint(complaint.id, data, [])

    assert result == complaint
    assert complaint.title == data["title"]
    assert complaint.description == data["description"]
    assert complaint.department_id == department.id
    mock_complaint_repo.update.assert_called_once_with()
    mock_db.rollback.assert_not_called()

@patch("app.services.complaint_service.upload_image")
@patch("app.services.complaint_service.delete_image")
@patch("app.services.complaint_service.db.session")
@patch("app.services.complaint_service.ComplaintImageRepository")
@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.DepartmentRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_update_complaint_replaces_images(
    mock_jwt,
    mock_user_repo,
    mock_department_repo,
    mock_complaint_repo,
    mock_image_repo,
    mock_db,
    mock_delete_image,
    mock_upload_image,
):
    old_image = MagicMock(public_id="old-image-id")
    complaint = make_complaint()
    complaint.images = [old_image]

    mock_jwt.return_value = 1
    mock_user_repo.get_by_id.return_value = make_user()
    mock_complaint_repo.get_by_id.return_value = complaint
    mock_department_repo.get_by_name.return_value = MagicMock(id=10)
    mock_upload_image.return_value = {
        "image_url": "https://cloudinary.example/new.jpg",
        "public_id": "new-image-id",
    }

    created_image = MagicMock()
    mock_image_repo.create.return_value = created_image

    ComplaintService.update_complaint(
        complaint.id,
        complaint_data(),
        [MagicMock()],
    )

    mock_delete_image.assert_called_once_with("old-image-id")
    mock_db.delete.assert_called_once_with(old_image)
    mock_db.flush.assert_called_once()
    mock_db.add.assert_called_once_with(created_image)

@pytest.mark.parametrize(
    ("complaint", "department", "message"),
    [
        (None, MagicMock(id=10), "Complaint not found"),
        (
            make_complaint(citizen_id=999),
            MagicMock(id=10),
            "not authorized to update",
        ),
        (
            make_complaint(status=ComplaintStatus.WORK_IN_PROGRESS),
            MagicMock(id=10),
            "Only submitted complaints can be updated",
        ),
        (make_complaint(), None, "Department not found"),
    ],
)
@patch("app.services.complaint_service.db.session")
@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.DepartmentRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_update_complaint_invalid_cases(
    mock_jwt,
    mock_user_repo,
    mock_department_repo,
    mock_complaint_repo,
    mock_db,
    complaint,
    department,
    message,
):
    mock_jwt.return_value = 1
    mock_user_repo.get_by_id.return_value = make_user()
    mock_complaint_repo.get_by_id.return_value = complaint
    mock_department_repo.get_by_name.return_value = department

    with pytest.raises((ValueError, PermissionError), match=message):
        ComplaintService.update_complaint(
            uuid.uuid4(),
            complaint_data(),
            [],
        )

    mock_db.rollback.assert_called_once()

# DELETE COMPLAINT
@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_delete_complaint_success(mock_jwt, mock_user_repo, mock_complaint_repo):
    complaint = make_complaint()

    mock_jwt.return_value = 1
    mock_user_repo.get_by_id.return_value = make_user()
    mock_complaint_repo.get_by_id.return_value = complaint

    result = ComplaintService.delete_complaint(complaint.id)

    assert result is None
    mock_complaint_repo.delete.assert_called_once_with(complaint)

@pytest.mark.parametrize(
    ("user", "complaint", "message"),
    [
        (None, make_complaint(), "User not found"),
        (make_user(), None, "Complaint not found"),
        (
            make_user(),
            make_complaint(citizen_id=999),
            "not authorized to delete",
        ),
        (
            make_user(),
            make_complaint(status=ComplaintStatus.WORK_IN_PROGRESS),
            "Only submitted complaints can be deleted",
        ),
    ],
)
@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity")
def test_delete_complaint_invalid_cases(
    mock_jwt,
    mock_user_repo,
    mock_complaint_repo,
    user,
    complaint,
    message,
):
    mock_jwt.return_value = 1
    mock_user_repo.get_by_id.return_value = user
    mock_complaint_repo.get_by_id.return_value = complaint

    with pytest.raises((ValueError, PermissionError), match=message):
        ComplaintService.delete_complaint(uuid.uuid4())
