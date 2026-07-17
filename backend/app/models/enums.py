from enum import Enum


class UserRole(Enum):
    CITIZEN = "Citizen"
    OFFICER = "Officer"
    ADMIN = "Admin"
    AGENCY = "Agency"


class UserStatus(Enum):
    PENDING_APPROVAL = "PendingApproval"
    ACTIVE = "Active"
    REJECTED = "Rejected"
    BLOCKED = "Blocked"


class AuthProvider(Enum):
    LOCAL = "Local"
    GOOGLE = "Google"

class AssignedBy(Enum):
    SYSTEM = "System"
    ADMIN = "Admin"

class AvailabilityStatus(Enum):
    AVAILABLE = "Available"
    ENGAGED = "Engaged"
    ON_LEAVE = "OnLeave"


class ComplaintStatus(Enum):
    SUBMITTED = "Submitted"
    ASSIGNED = "Assigned"
    UNDER_REVIEW = "UnderReview"
    REPORT_SUBMITTED = "ReportSubmitted"
    AWAITING_BUDGET = "AwaitingBudget"
    BUDGET_ALLOCATED = "BudgetAllocated"
    TENDER_NOTIFICATION_ISSUED = "TenderNotificationIssued"
    TENDER_ALLOTED = "TenderAlloted"
    WORK_IN_PROGRESS = "WorkInProgress"
    WORK_COMPLETED = "WorkCompleted"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class ComplaintPriority(Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class AssignmentStatus(Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    ESCALATED = "Escalated"
    REJECTED = "Rejected"


class TenderStatus(Enum):
    DRAFT = "Draft"
    OPEN = "Open"
    CLOSED = "Closed"
    AWARDED = "Awarded"
    CANCELLED = "Cancelled"


class ProposalStatus(Enum):
    SUBMITTED = "Submitted"
    SHORTLISTED = "Shortlisted"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"


class WorkOrderStatus(Enum):
    ASSIGNED = "Assigned"
    IN_PROGRESS = "InProgress"
    COMPLETED = "Completed"
    VERIFIED = "Verified"
    CANCELLED = "Cancelled"


class ReviewDecision(Enum):
    RESOLVED = "Resolved"
    TENDER_REQUIRED = "TenderRequired"
    CLOSED = "Closed"


class NotificationType(Enum):
    STATUS_CHANGE = "StatusChange"
    ASSIGNMENT = "Assignment"
    REVIEW_DONE = "ReviewDone"
    TENDER_PUBLISHED = "TenderPublished"
    SLA_BREACH = "SLABreach"
    BUDGET_PENDING = "BudgetPending"
    CLOSURE = "Closure"