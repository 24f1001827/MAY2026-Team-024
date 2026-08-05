from .auth_schema import (
    RegisterCitizenSchema,
    RegisterAgencySchema,
    RegisterOfficerSchema,
    LoginSchema,
)

from .complaint_schema import (
    ComplaintSchema,
    ComplaintResponseSchema,
    AssignComplaintSchema,
    ReopenComplaintSchema,
)

from .admin_user_schema import UserResponseSchema, UpdateUserStatusSchema
from .officer_schema import (
    OfficerComplaintResponseSchema,
    ComplaintAssignmentResponseSchema,
    CreateReviewReportSchema,
    ReviewReportResponseSchema,
    OfficerComplaintDetailSchema,
    CreateTenderSchema,
    TenderResponseSchema,
    OfficerProposalListSchema,
    OfficerProposalDetailSchema,
    UpdateProposalStatusSchema,
)
from .admin_budget_schema import AllocateBudgetSchema
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
)
