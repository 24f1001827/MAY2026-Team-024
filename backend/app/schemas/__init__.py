from .auth_schema import (
    RegisterCitizenSchema,
    RegisterAgencySchema,
    RegisterOfficerSchema,
    LoginSchema,
)

from .complaint_schema import (
    ComplaintSchema,
    ComplaintResponseSchema,
    ComplaintDetailResponseSchema,
    PublicComplaintSchema,
    PublicComplaintDetailSchema,
    AssignComplaintSchema,
    ReopenComplaintSchema,
    DepartmentSuggestionSchema,
    LinkComplaintSchema,
)

from .admin_user_schema import (
    UserResponseSchema,
    UpdateUserStatusSchema,
    UpdateMaxWorkloadSchema,
)
from .officer_schema import (
    OfficerComplaintResponseSchema,
    ComplaintAssignmentResponseSchema,
    CreateReviewReportSchema,
    ReviewReportResponseSchema,
    OfficerComplaintDetailSchema,
    CreateTenderSchema,
    TenderResponseSchema,
    OfficerTenderListSchema,
    OfficerProposalListSchema,
    OfficerProposalDetailSchema,
    UpdateProposalStatusSchema,
    DepartmentOfficerSchema,
    DepartmentDashboardResponseSchema,
    OfficerDirectorySchema,
)
from .admin_budget_schema import (
    AllocateBudgetSchema,
    DepartmentBudgetSchema,
    AddDepartmentBudgetSchema,
    BudgetLedgerEntrySchema,
)
from .agency_schema import (
    TenderListSchema,
    TenderDetailSchema,
    CreateProposalSchema,
    ProposalResponseSchema,
    AgencyProposalListSchema,
)
from .work_order_schema import (
    CreateWorkOrderSchema,
    UpdateWorkOrderStatusSchema,
    MarkWorkOrderIncompleteSchema,
)

from .department_schema import (
    CreateDepartmentSchema,
    UpdateDepartmentSchema,
    DepartmentResponseSchema,
    PublicDepartmentSchema,
)
from .settings_schema import SettingsResponseSchema, UpdateSettingsSchema
