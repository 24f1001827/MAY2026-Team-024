# Complaint intelligence and related reports

New complaints receive category/severity assessment through the LangChain provider selected by `LLM_PROVIDER`; otherwise the deterministic baseline keeps submissions available. The department suggestion is non-binding: the citizen remains responsible for selecting the final department.

Every complaint is preserved. A `complaint_cluster` represents the physical civic issue; the first report is its primary report and later high-confidence reports are linked to it. A linked report does not lose its reporter, images, or history.

## Concurrent reports

The grouping service locks a PostgreSQL locality/city bucket before it searches or creates a cluster. It first restricts candidates to the same normalized pincode, locality, and city, then applies the configured hard distance radius and embedding-similarity threshold. If two matching reports arrive simultaneously, the second waits for the first transaction, rechecks candidates, and attaches to the just-created cluster. This avoids two clusters for the same event without holding a database transaction open for an external model call.

## Priority

The cluster priority score begins with the severity score and adds eight points for each additional distinct reporter, capped at 30 points. This prevents repeated reports from one account from increasing urgency. The resulting score is mapped to the existing Low/Medium/High/Critical enum, and applied to all reports in the cluster.

## Overrides

Citizens can dispute an automatic grouping. Administrators can link or unlink reports. Officers can do the same for complaints within their own department. A disputed grouping remains visible until staff resolves it by linking or unlinking the report.

Whenever a complaint is automatically linked, its reporter receives a notification and can open the primary report from their complaint detail page. Whenever a complaint in a cluster changes lifecycle status, every distinct citizen who has reported that issue receives a status notification.
