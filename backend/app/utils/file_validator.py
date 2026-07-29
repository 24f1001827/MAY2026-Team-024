from werkzeug.datastructures import FileStorage

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def validate_document(file: FileStorage):
    """
    Validate proposal document.

    Rules:
    - File is required
    - Must be a PDF
    - Size must not exceed 10 MB
    """

    if file is None:
        raise ValueError("Proposal document is required.")

    if file.filename == "":
        raise ValueError("Proposal document is required.")

    if file.content_type != "application/pdf":
        raise ValueError("Only PDF files are allowed.")

    # Calculate file size
    file.seek(0, 2)  # Move cursor to end
    file_size = file.tell()
    file.seek(0)  # Reset cursor

    if file_size > MAX_FILE_SIZE:
        raise ValueError(
            "Proposal document must not exceed 10 MB."
        )