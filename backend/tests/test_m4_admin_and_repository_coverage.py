"""M4 business-rule tests plus isolated repository method coverage."""
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest

from app.models import UserRole, UserStatus
from app.repositories.agency_repository import AgencyRepository
from app.repositories.complaint_image_repository import ComplaintImageRepository
from app.repositories.department_budget_repository import DepartmentBudgetRepository
from app.repositories.notification_repository import NotificationRepository
from app.services.admin_budget_service import AdminBudgetService
from app.services.admin_user_service import AdminUserService


@patch("app.services.admin_user_service.db.session")
@patch("app.services.admin_user_service.UserRepository")
def test_admin_user_updates_officer_max_workload(repo, session):
    officer = MagicMock(current_workload=2, max_workload=5)
    user = MagicMock(role=UserRole.OFFICER, officer=officer)
    repo.get_by_id.return_value = user
    assert AdminUserService.update_officer_max_workload("officer-1", {"max_workload": 6}) is user
    assert officer.max_workload == 6
    session.commit.assert_called_once()


@patch("app.services.admin_user_service.UserRepository")
def test_admin_user_rejects_unknown_officer_for_workload(repo):
    repo.get_by_id.return_value = None
    with pytest.raises(ValueError, match="User not found"):
        AdminUserService.update_officer_max_workload("missing", {"max_workload": 3})


@patch("app.services.admin_user_service.UserRepository")
def test_admin_user_rejects_non_officer_for_workload(repo):
    repo.get_by_id.return_value = MagicMock(role=UserRole.CITIZEN, officer=None)
    with pytest.raises(ValueError, match="not an officer"):
        AdminUserService.update_officer_max_workload("citizen", {"max_workload": 3})


@patch("app.services.admin_user_service.UserRepository")
def test_admin_user_rejects_workload_below_current(repo):
    repo.get_by_id.return_value = MagicMock(role=UserRole.OFFICER, officer=MagicMock(current_workload=4))
    with pytest.raises(ValueError, match="cannot be below"):
        AdminUserService.update_officer_max_workload("officer", {"max_workload": 3})


@patch("app.services.admin_user_service.UserRepository")
def test_admin_user_rejects_pending_to_blocked_status(repo):
    repo.get_by_id.return_value = MagicMock(role=UserRole.CITIZEN, status=UserStatus.PENDING_APPROVAL)
    with pytest.raises(ValueError, match="approved or rejected"):
        AdminUserService.update_user_status("user", {"status": UserStatus.BLOCKED})


@patch("app.services.admin_user_service.UserRepository")
def test_admin_user_rejects_rejected_to_blocked_status(repo):
    repo.get_by_id.return_value = MagicMock(role=UserRole.CITIZEN, status=UserStatus.REJECTED)
    with pytest.raises(ValueError, match="cannot be blocked"):
        AdminUserService.update_user_status("user", {"status": UserStatus.BLOCKED})


@patch("app.services.admin_budget_service.DepartmentBudgetRepository")
def test_admin_budget_lists_budget_rows(repo):
    repo.list_all.return_value = []
    assert AdminBudgetService.list_budgets() == []


@patch("app.services.admin_budget_service.DepartmentRepository")
def test_admin_budget_history_rejects_unknown_department(repo):
    repo.get_by_id.return_value = None
    with pytest.raises(ValueError, match="Department not found"):
        AdminBudgetService.get_department_history(99)


@patch("app.services.admin_budget_service.BudgetLedgerRepository")
@patch("app.services.admin_budget_service.DepartmentRepository")
def test_admin_budget_history_splits_additions_and_allocations(departments, ledger):
    departments.get_by_id.return_value = MagicMock()
    addition = MagicMock(entry_type="addition")
    allocation = MagicMock(entry_type="allocation")
    from app.models import BudgetLedger
    addition.entry_type = BudgetLedger.ADDITION
    allocation.entry_type = BudgetLedger.ALLOCATION
    ledger.get_by_department.return_value = [addition, allocation]
    result = AdminBudgetService.get_department_history(1)
    assert result == {"additions": [addition], "allocations": [allocation]}


@patch("app.services.admin_budget_service.DepartmentRepository")
def test_admin_budget_add_rejects_unknown_department(repo):
    repo.get_by_id.return_value = None
    with pytest.raises(ValueError, match="Department not found"):
        AdminBudgetService.add_budget({"department_id": 1, "amount": "5"})


@patch("app.services.admin_budget_service.DepartmentRepository")
def test_admin_budget_add_rejects_non_positive_amount(repo):
    repo.get_by_id.return_value = MagicMock(id=1)
    with pytest.raises(ValueError, match="greater than zero"):
        AdminBudgetService.add_budget({"department_id": 1, "amount": "0"})


@patch("app.services.admin_budget_service.db.session")
@patch("app.services.admin_budget_service.BudgetLedgerRepository")
@patch("app.services.admin_budget_service.DepartmentBudgetRepository")
@patch("app.services.admin_budget_service.DepartmentRepository")
def test_admin_budget_add_creates_new_financial_year_row(departments, budgets, ledger, session):
    departments.get_by_id.return_value = MagicMock(id=1)
    budgets.get_by_dept_and_year.return_value = None
    created = MagicMock()
    budgets.create.return_value = created
    assert AdminBudgetService.add_budget({"department_id": 1, "amount": "20", "financial_year": "2026-27"}) is created
    assert budgets.create.call_args.args[0]["total_amount"] == Decimal("20")
    session.commit.assert_called_once()


@patch("app.repositories.agency_repository.db.session")
@patch("app.repositories.agency_repository.Agency")
def test_agency_repository_creates_and_adds_model(model, session):
    instance = model.return_value
    assert AgencyRepository.create({"user_id": "agency-1"}) is instance
    session.add.assert_called_once_with(instance)


@patch("app.repositories.agency_repository.Agency")
def test_agency_repository_finds_by_user_id(model):
    expected = MagicMock()
    model.query.filter_by.return_value.first.return_value = expected
    assert AgencyRepository.get_by_user_id("agency-1") is expected
    model.query.filter_by.assert_called_once_with(user_id="agency-1")


@patch("app.repositories.complaint_image_repository.db.session")
@patch("app.repositories.complaint_image_repository.ComplaintImage")
def test_complaint_image_repository_creates_image(model, session):
    image = model.return_value
    assert ComplaintImageRepository.create({"complaint_id": "c1"}) is image
    session.add.assert_called_once_with(image)


@patch("app.repositories.complaint_image_repository.db.session")
@patch("app.repositories.complaint_image_repository.ComplaintImage")
def test_complaint_image_repository_deletes_existing_image(model, session):
    image = MagicMock()
    model.query.filter_by.return_value.first.return_value = image
    assert ComplaintImageRepository.delete_by_id(1) is image
    session.delete.assert_called_once_with(image)


@patch("app.repositories.department_budget_repository.db.session")
@patch("app.repositories.department_budget_repository.DepartmentBudget")
def test_department_budget_repository_creates_budget(model, session):
    budget = model.return_value
    assert DepartmentBudgetRepository.create({"department_id": 1}) is budget
    session.add.assert_called_once_with(budget)


@patch("app.repositories.notification_repository.db.session")
@patch("app.repositories.notification_repository.Notification")
def test_notification_repository_creates_notification(model, session):
    notification = model.return_value
    assert NotificationRepository.create({"user_id": "u1"}) is notification
    session.add.assert_called_once_with(notification)


@patch("app.repositories.notification_repository.Notification")
def test_notification_repository_marks_all_unread_notifications_read(model):
    first, second = MagicMock(is_read=False), MagicMock(is_read=False)
    model.query.filter_by.return_value.all.return_value = [first, second]
    result = NotificationRepository.mark_all_as_read("u1")
    assert result == [first, second]
    assert first.is_read is True and second.is_read is True
