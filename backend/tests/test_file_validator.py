from io import BytesIO
import pytest
from werkzeug.datastructures import FileStorage
from app.utils.file_validator import MAX_FILE_SIZE, validate_document

def document(filename="proposal.pdf", content=b"pdf", content_type="application/pdf"):
    return FileStorage(stream=BytesIO(content), filename=filename, content_type=content_type)

def test_validate_document_accepts_pdf_and_resets_pointer():
    file = document(content=b"proposal")
    assert validate_document(file) is None
    assert file.stream.tell() == 0

@pytest.mark.parametrize("file,message", [
    (None, "Proposal document is required."),
    (document(filename=""), "Proposal document is required."),
    (document(filename="proposal.docx", content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"), "Only PDF files are allowed."),
    (document(content=b"x" * (MAX_FILE_SIZE + 1)), "Proposal document must not exceed 10 MB."),
])
def test_validate_document_rejects_invalid_files(file, message):
    with pytest.raises(ValueError, match=message):
        validate_document(file)