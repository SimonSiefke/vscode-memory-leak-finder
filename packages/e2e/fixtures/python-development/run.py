import json
import pathlib
import sys

from project.models import Invoice


def main() -> None:
    result = {"total": Invoice([10, 20, 12]).total(), "prefix": sys.prefix}
    pathlib.Path(".python-run.json").write_text(json.dumps(result), encoding="utf-8")
    print(f"Python calculation: {result['total']}", flush=True)


if __name__ == "__main__":
    main()
