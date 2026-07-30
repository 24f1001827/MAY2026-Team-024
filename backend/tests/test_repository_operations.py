"""Repository level unit tests for database interaction helpers.

These mock SQLAlchemy's session/query boundary and verify repository behavior
without requiring a real PostgreSQL server.
"""
from unittest.mock import MagicMock, patch

@patch("app.repositories.user_repository.db.session")
def test_user_repository_create_update_and_soft_delete(mock_db):
    from app.repositories.user_repository import UserRepository
    user = MagicMock()
    assert UserRepository.create(user) is user
    UserRepository.update()
    UserRepository.soft_delete(user)
    assert user.deleted_at is not None
    assert mock_db.add.call_count == 1
    assert mock_db.commit.call_count == 3

@patch("app.repositories.tender_repository.Tender")
@patch("app.repositories.tender_repository.db.session")
def test_tender_repository_create_and_update(mock_db, mock_tender):
    from app.repositories.tender_repository import TenderRepository
    created = MagicMock(); mock_tender.return_value = created
    assert TenderRepository.create({"title": "Road repair"}) is created
    TenderRepository.update()
    mock_db.add.assert_called_once_with(created)
    mock_db.commit.assert_called_once()

@patch("app.repositories.work_order_repository.WorkOrder")
@patch("app.repositories.work_order_repository.db.session")
def test_work_order_repository_create_and_update(mock_db, mock_order):
    from app.repositories.work_order_repository import WorkOrderRepository
    created = MagicMock(); mock_order.return_value = created
    assert WorkOrderRepository.create({"scope_of_work": "Repair road"}) is created
    assert WorkOrderRepository.update(created) is created
    assert mock_db.add.call_count == 2

@patch("app.repositories.agency_proposal_repository.AgencyProposal")
@patch("app.repositories.agency_proposal_repository.db.session")
def test_agency_proposal_repository_create_and_update(mock_db, mock_proposal):
    from app.repositories.agency_proposal_repository import AgencyProposalRepository
    created = MagicMock(); mock_proposal.return_value = created
    assert AgencyProposalRepository.create({"tender_id": 1}) is created
    AgencyProposalRepository.update()
    mock_db.add.assert_called_once_with(created)
    mock_db.commit.assert_called_once()

@patch("app.repositories.complaint_repository.db.session")
def test_complaint_repository_update_and_delete(mock_db):
    from app.repositories.complaint_repository import ComplaintRepository
    complaint = MagicMock()
    ComplaintRepository.update()
    ComplaintRepository.delete(complaint)
    assert complaint.deleted_at is not None
    assert mock_db.commit.call_count == 2