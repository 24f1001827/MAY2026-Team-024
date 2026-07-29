"""Unit tests for admin_budget_service, admin_complaint_service and admin_user_service."""
from decimal import Decimal
from unittest.mock import MagicMock, patch
import pytest
from app.models import AssignmentStatus, AssignedBy, ComplaintStatus, UserRole, UserStatus
from app.services.admin_budget_service import AdminBudgetService
from app.services.admin_complaint_service import AdminComplaintService
from app.services.admin_user_service import AdminUserService

def admin(): return MagicMock(role=UserRole.ADMIN)
def complaint(status=ComplaintStatus.AWAITING_BUDGET):
    return MagicMock(id="complaint-1", status=status, department_id="roads", department=MagicMock(budget=Decimal("100.00")))

@patch("app.services.admin_budget_service.db.session")
@patch("app.services.admin_budget_service.ReviewReportRepository")
@patch("app.services.admin_budget_service.ComplaintRepository")
def test_allocate_budget_success(mock_complaints, mock_reports, mock_db):
    item = complaint(); mock_complaints.get_by_id.return_value = item; mock_reports.get_by_complaint_id.return_value = MagicMock()
    result = AdminBudgetService.allocate_budget("complaint-1", {"amount": Decimal("50.00")})
    assert result == item
    assert item.department.budget == Decimal("150.00")
    assert item.status == ComplaintStatus.BUDGET_ALLOCATED
    mock_db.commit.assert_called_once()

@patch("app.services.admin_budget_service.ComplaintRepository")
def test_allocate_budget_rejects_unknown_complaint(mock_complaints):
    mock_complaints.get_by_id.return_value = None
    with pytest.raises(ValueError, match="Complaint not found"):
        AdminBudgetService.allocate_budget("missing", {"amount": Decimal("1")})

@patch("app.services.admin_budget_service.ComplaintRepository")
def test_allocate_budget_requires_awaiting_budget_status(mock_complaints):
    mock_complaints.get_by_id.return_value = complaint(ComplaintStatus.UNDER_REVIEW)
    with pytest.raises(ValueError, match="awaiting budget"):
        AdminBudgetService.allocate_budget("complaint-1", {"amount": Decimal("1")})

@patch("app.services.admin_complaint_service.ComplaintRepository")
@patch("app.services.admin_complaint_service.UserRepository")
@patch("app.services.admin_complaint_service.get_jwt_identity", return_value="admin-1")
def test_get_all_complaints_success(mock_identity, mock_users, mock_complaints):
    mock_users.get_by_id.return_value = admin(); mock_complaints.get_all.return_value = [MagicMock()]
    assert len(AdminComplaintService.get_all_complaints()) == 1
    mock_complaints.get_all.assert_called_once()

@patch("app.services.admin_complaint_service.UserRepository")
@patch("app.services.admin_complaint_service.get_jwt_identity", return_value="citizen-1")
def test_get_all_complaints_rejects_non_admin(mock_identity, mock_users):
    mock_users.get_by_id.return_value = MagicMock(role=UserRole.CITIZEN)
    with pytest.raises(PermissionError, match="Only admins"):
        AdminComplaintService.get_all_complaints()

@patch("app.services.admin_complaint_service.UserRepository")
@patch("app.services.admin_complaint_service.get_jwt_identity", return_value="missing")
def test_get_all_complaints_rejects_unknown_admin(mock_identity, mock_users):
    mock_users.get_by_id.return_value = None
    with pytest.raises(ValueError, match="User not found"):
        AdminComplaintService.get_all_complaints()

@patch("app.services.admin_complaint_service.db.session")
@patch("app.services.admin_complaint_service.ComplaintAssignmentRepository")
@patch("app.services.admin_complaint_service.OfficerRepository")
@patch("app.services.admin_complaint_service.ComplaintRepository")
@patch("app.services.admin_complaint_service.UserRepository")
@patch("app.services.admin_complaint_service.get_jwt_identity", return_value="admin-1")
def test_assign_complaint_success(mock_identity, mock_users, mock_complaints, mock_officers, mock_assignments, mock_db):
    item = complaint(ComplaintStatus.UNDER_REVIEW); officer = MagicMock(user_id="officer-1", department_id="roads")
    mock_users.get_by_id.return_value = admin(); mock_complaints.get_by_id.return_value = item; mock_officers.get_by_user_id.return_value = officer
    mock_assignments.get_by_complaint_id.return_value = None; created = MagicMock(); mock_assignments.create.return_value = created
    result = AdminComplaintService.assign_complaint("complaint-1", {"officer_id": "officer-1", "assignment_note": "urgent"})
    assert result == created and item.status == ComplaintStatus.ASSIGNED
    mock_assignments.create.assert_called_once_with({"complaint_id": "complaint-1", "officer_id": "officer-1", "assigned_by": AssignedBy.ADMIN, "status": AssignmentStatus.PENDING, "assignment_note": "urgent"})
    mock_db.commit.assert_called_once()

@patch("app.services.admin_complaint_service.ComplaintAssignmentRepository")
@patch("app.services.admin_complaint_service.OfficerRepository")
@patch("app.services.admin_complaint_service.ComplaintRepository")
@patch("app.services.admin_complaint_service.UserRepository")
@patch("app.services.admin_complaint_service.get_jwt_identity", return_value="admin-1")
def test_assign_complaint_rejects_wrong_department(mock_identity, mock_users, mock_complaints, mock_officers, mock_assignments):
    mock_users.get_by_id.return_value = admin(); mock_complaints.get_by_id.return_value = complaint(); mock_officers.get_by_user_id.return_value = MagicMock(department_id="water")
    with pytest.raises(ValueError, match="does not belong"):
        AdminComplaintService.assign_complaint("complaint-1", {"officer_id": "officer-1"})

@patch("app.services.admin_complaint_service.OfficerRepository")
@patch("app.services.admin_complaint_service.ComplaintRepository")
@patch("app.services.admin_complaint_service.UserRepository")
@patch("app.services.admin_complaint_service.get_jwt_identity", return_value="admin-1")
def test_assign_complaint_rejects_missing_officer(mock_identity, mock_users, mock_complaints, mock_officers):
    mock_users.get_by_id.return_value = admin(); mock_complaints.get_by_id.return_value = complaint(); mock_officers.get_by_user_id.return_value = None
    with pytest.raises(ValueError, match="Officer not found"):
        AdminComplaintService.assign_complaint("complaint-1", {"officer_id": "missing"})

@patch("app.services.admin_complaint_service.ComplaintAssignmentRepository")
@patch("app.services.admin_complaint_service.OfficerRepository")
@patch("app.services.admin_complaint_service.ComplaintRepository")
@patch("app.services.admin_complaint_service.UserRepository")
@patch("app.services.admin_complaint_service.get_jwt_identity", return_value="admin-1")
def test_assign_complaint_rejects_existing_assignment(mock_identity, mock_users, mock_complaints, mock_officers, mock_assignments):
    mock_users.get_by_id.return_value = admin(); mock_complaints.get_by_id.return_value = complaint(); mock_officers.get_by_user_id.return_value = MagicMock(department_id="roads")
    mock_assignments.get_by_complaint_id.return_value = MagicMock()
    with pytest.raises(ValueError, match="already been assigned"):
        AdminComplaintService.assign_complaint("complaint-1", {"officer_id": "officer-1"})

@patch("app.services.admin_complaint_service.ComplaintRepository")
@patch("app.services.admin_complaint_service.UserRepository")
@patch("app.services.admin_complaint_service.get_jwt_identity", return_value="admin-1")
def test_get_complaint_rejects_missing_complaint(mock_identity, mock_users, mock_complaints):
    mock_users.get_by_id.return_value = admin(); mock_complaints.get_by_id.return_value = None
    with pytest.raises(ValueError, match="Complaint not found"):
        AdminComplaintService.get_complaint("missing")

@patch("app.services.admin_complaint_service.OfficerRepository")
@patch("app.services.admin_complaint_service.ComplaintRepository")
@patch("app.services.admin_complaint_service.UserRepository")
@patch("app.services.admin_complaint_service.get_jwt_identity", return_value="admin-1")
def test_get_department_officers_success(mock_identity, mock_users, mock_complaints, mock_officers):
    mock_users.get_by_id.return_value = admin(); mock_complaints.get_by_id.return_value = complaint(); mock_officers.get_by_department_id.return_value = [MagicMock()]
    assert len(AdminComplaintService.get_department_officers("complaint-1")) == 1

@patch("app.services.admin_user_service.UserRepository")
def test_get_all_users_passes_filters_to_repository(mock_users):
    AdminUserService.get_all_users(role=UserRole.CITIZEN, status=UserStatus.ACTIVE)
    mock_users.get_all.assert_called_once_with(role=UserRole.CITIZEN, status=UserStatus.ACTIVE)

@patch("app.services.admin_user_service.UserRepository")
def test_update_user_status_success(mock_users):
    user = MagicMock(role=UserRole.CITIZEN, status=UserStatus.PENDING_APPROVAL); mock_users.get_by_id.return_value = user
    result = AdminUserService.update_user_status("user-1", {"status": UserStatus.ACTIVE})
    assert result == user and user.status == UserStatus.ACTIVE
    mock_users.update.assert_called_once()

@patch("app.services.admin_user_service.UserRepository")
def test_update_user_status_rejects_admin(mock_users):
    mock_users.get_by_id.return_value = MagicMock(role=UserRole.ADMIN, status=UserStatus.ACTIVE)
    with pytest.raises(PermissionError, match="Admin cannot"):
        AdminUserService.update_user_status("admin-1", {"status": UserStatus.BLOCKED})

@patch("app.services.admin_user_service.UserRepository")
def test_update_user_status_rejects_pending_to_blocked(mock_users):
    mock_users.get_by_id.return_value = MagicMock(role=UserRole.CITIZEN, status=UserStatus.PENDING_APPROVAL)
    with pytest.raises(ValueError, match="approved or rejected"):
        AdminUserService.update_user_status("user-1", {"status": UserStatus.BLOCKED})