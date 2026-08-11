"""Unit tests for M4 department, settings, statistics and admin agency services."""
from unittest.mock import MagicMock, patch

import pytest

from app.services.admin_agency_service import AdminAgencyService
from app.services.department_service import DepartmentService
from app.services.settings_service import SettingsService
from app.services.stats_service import StatsService


@patch("app.services.department_service.DepartmentRepository")
def test_department_service_lists_departments(repo):
    repo.get_all.return_value = [MagicMock()]
    assert len(DepartmentService.get_all_departments()) == 1


@patch("app.services.department_service.DepartmentRepository")
def test_department_service_gets_detail(repo):
    department = MagicMock()
    repo.get_by_id.return_value = department
    assert DepartmentService.get_department_by_id(1) is department


@patch("app.services.department_service.DepartmentRepository")
def test_department_service_rejects_missing_detail(repo):
    repo.get_by_id.return_value = None
    with pytest.raises(ValueError, match="Department not found"):
        DepartmentService.get_department_by_id(99)


@patch("app.services.department_service.SettingsService.is_manual_allotment", return_value=True)
@patch("app.services.department_service.ComplaintRepository")
@patch("app.services.department_service.OfficerRepository")
@patch("app.services.department_service.DepartmentRepository")
def test_department_dashboard_success(repo, officers, complaints, manual):
    department = MagicMock()
    repo.get_by_id.return_value = department
    officers.get_by_department_id.return_value = []
    complaints.get_by_department.return_value = []
    result = DepartmentService.get_department_dashboard(1)
    assert result["department"] is department
    assert result["manual_allotment"] is True


@patch("app.services.department_service.DepartmentRepository")
def test_department_dashboard_rejects_missing_department(repo):
    repo.get_by_id.return_value = None
    with pytest.raises(ValueError, match="Department not found"):
        DepartmentService.get_department_dashboard(1)


@patch("app.services.department_service.db.session")
@patch("app.services.department_service.DepartmentService._sync_head_flag")
@patch("app.services.department_service.DepartmentService._validate_head_officer")
@patch("app.services.department_service.DepartmentRepository")
def test_create_department_success(repo, validate_head, sync_head, session):
    repo.get_by_name.return_value = None
    created = MagicMock()
    repo.create.return_value = created
    assert DepartmentService.create_department({"name": "Roads", "head_officer_id": None}) is created
    repo.create.assert_called_once()
    session.commit.assert_called_once()


@patch("app.services.department_service.DepartmentRepository")
def test_create_department_rejects_duplicate_name(repo):
    repo.get_by_name.return_value = MagicMock()
    with pytest.raises(ValueError, match="already exists"):
        DepartmentService.create_department({"name": "Roads"})


@patch("app.services.department_service.DepartmentRepository")
def test_update_department_rejects_missing_department(repo):
    repo.get_by_id.return_value = None
    with pytest.raises(ValueError, match="Department not found"):
        DepartmentService.update_department(1, {"name": "Roads"})


@patch("app.services.department_service.DepartmentRepository")
def test_delete_department_success(repo):
    department = MagicMock()
    repo.get_by_id.return_value = department
    assert DepartmentService.delete_department(1) is department
    repo.delete.assert_called_once_with(department)


@patch("app.services.department_service.DepartmentRepository")
def test_delete_department_rejects_missing_department(repo):
    repo.get_by_id.return_value = None
    with pytest.raises(ValueError, match="Department not found"):
        DepartmentService.delete_department(1)


@patch("app.services.settings_service.db.session")
@patch("app.services.settings_service.AppSettings")
def test_settings_service_creates_default_row(settings_model, session):
    settings_model.query.get.return_value = None
    created = MagicMock(manual_allotment=True)
    settings_model.return_value = created
    assert SettingsService.get_settings() is created
    session.add.assert_called_once_with(created)
    session.commit.assert_called_once()


@patch("app.services.settings_service.db.session")
@patch("app.services.settings_service.SettingsService.get_settings")
def test_settings_service_updates_manual_allotment(get_settings, session):
    settings = MagicMock(manual_allotment=True)
    get_settings.return_value = settings
    assert SettingsService.update_settings({"manual_allotment": False}) is settings
    assert settings.manual_allotment is False
    session.commit.assert_called_once()


@patch("app.services.settings_service.SettingsService.get_settings")
def test_settings_service_reads_manual_allotment(get_settings):
    get_settings.return_value = MagicMock(manual_allotment=False)
    assert SettingsService.is_manual_allotment() is False


@patch("app.services.stats_service.Agency")
@patch("app.services.stats_service.Tender")
@patch("app.services.stats_service.Complaint")
def test_stats_service_returns_expected_calculations(complaint, tender, agency):
    complaint.query.filter.return_value.count.side_effect = [10, 7]
    tender.query.filter.return_value.count.return_value = 3
    agency.query.join.return_value.filter.return_value.count.return_value = 2
    assert StatsService.get_public_stats() == {
        "complaints_total": 10,
        "resolved_pct": 70,
        "tenders_awarded": 3,
        "agencies_total": 2,
    }


@patch("app.services.stats_service.Agency")
@patch("app.services.stats_service.Tender")
@patch("app.services.stats_service.Complaint")
def test_stats_service_handles_zero_complaints(complaint, tender, agency):
    complaint.query.filter.return_value.count.side_effect = [0, 0]
    tender.query.filter.return_value.count.return_value = 0
    agency.query.join.return_value.filter.return_value.count.return_value = 0
    assert StatsService.get_public_stats()["resolved_pct"] == 0


@patch("app.services.admin_agency_service.AgencyRepository")
def test_admin_agency_service_lists_agencies(repo):
    repo.get_all.return_value = []
    assert AdminAgencyService.get_all_agencies() == []


@patch("app.services.admin_agency_service.AgencyRepository")
def test_admin_agency_service_rejects_unknown_agency(repo):
    repo.get_by_user_id.return_value = None
    with pytest.raises(ValueError, match="Agency not found"):
        AdminAgencyService.get_agency("missing")


@patch("app.services.admin_agency_service.WorkOrderRepository")
@patch("app.services.admin_agency_service.AgencyRepository")
def test_admin_agency_service_returns_work_orders(repo, work_orders):
    repo.get_by_user_id.return_value = MagicMock()
    work_orders.get_by_agency_id.return_value = [MagicMock()]
    assert len(AdminAgencyService.get_agency_work_orders("agency-1")) == 1
