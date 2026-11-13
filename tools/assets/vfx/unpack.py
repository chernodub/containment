"""Extract only bounded PNG/text data from a downloaded ZIP; never execute pack contents."""
from pathlib import Path, PurePosixPath
import sys, zipfile
archive, target = map(Path, sys.argv[1:])
assert not target.exists(), 'Use a new empty directory for each archive'
target.mkdir(parents=True)
with zipfile.ZipFile(archive) as z:
    entries = z.infolist()
    assert len(entries) < 2000 and sum(e.file_size for e in entries) < 200_000_000
    for entry in entries:
        name = PurePosixPath(entry.filename)
        assert not name.is_absolute() and '..' not in name.parts
        if name.suffix.lower() not in ('.png', '.txt', '.md') or entry.is_dir(): continue
        assert entry.file_size < 20_000_000
        path = target.joinpath(*name.parts)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(z.read(entry))
